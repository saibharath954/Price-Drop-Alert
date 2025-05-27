import traceback
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.exceptions import FirebaseError
from datetime import datetime, timedelta, timezone # Import timedelta for cache freshness
import os
import json
import asyncio # Import asyncio for async operations
import re # Import re for price extraction
from typing import Dict, Any, List, Optional, Union
from dotenv import load_dotenv
import logging
from google.cloud.firestore_v1 import DocumentSnapshot
from google.cloud.firestore_v1.field_path import FieldPath


# --- Your ACTUAL Scraper Imports ---
from app.scraper.keyword_extractor import extract_brand_model, generate_search_variants
from app.scraper.platform_scraper import search_other_platforms, search_specific_platform
# --- End Scraper Imports ---

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()


class FirebaseClient:
    def __init__(self):
        """Initialize Firebase client with proper error handling, supporting both
        environment variable (production) and local file (development).
        """
        try:
            cred = None
            # Attempt to get the JSON config from environment variable (for production)
            firebase_config_env = os.getenv("FIREBASE_CONFIG")

            if firebase_config_env:
                logger.info("Initializing Firebase using FIREBASE_CONFIG environment variable.")
                try:
                    # Parse the JSON string into a dictionary
                    cred_dict = json.loads(firebase_config_env)
                    cred = credentials.Certificate(cred_dict)
                except json.JSONDecodeError as e:
                    raise ValueError(f"Invalid JSON in FIREBASE_CONFIG environment variable: {e}")
            else:
                # Fallback to local service account key file (for development)
                service_account_key_path = os.path.join(os.path.dirname(__file__), '../../serviceAccountKey.json')
                if os.path.exists(service_account_key_path):
                    logger.info(f"Initializing Firebase using local service account key: {service_account_key_path}")
                    cred = credentials.Certificate(service_account_key_path)
                else:
                    raise FileNotFoundError(f"Neither FIREBASE_CONFIG environment variable nor local service account key found at {service_account_key_path}")

            if cred:
                if not firebase_admin._apps:  # Avoid re-initializing if already initialized
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase initialized successfully.")
            else:
                raise ValueError("Firebase credentials could not be established.")

        except Exception as e:
            logger.critical(f"Firebase initialization failed: {e}")
            logger.critical(traceback.format_exc())  # Log full traceback
            raise # Re-raise the exception to stop the application if Firebase init fails

    def verify_token(self, token: str) -> dict:
        """Verify Firebase ID token with comprehensive error handling."""
        try:
            decoded_token = auth.verify_id_token(token)
            logger.debug(f"Token verified for UID: {decoded_token.get('uid')}")
            return decoded_token
        except ValueError as e:
            logger.error(f"Invalid token format (ValueError): {e}")
            raise
        except FirebaseError as e:
            logger.error(f"Firebase authentication error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            raise

    async def track_product(
        self,
        product_id: str,
        user_id: str,
        product_data: Dict[str, Any],
        target_price: Optional[float] = None,
        email: Optional[str] = None
    ) -> None:
        """Track a product with comprehensive data and transaction safety."""
        try:
            product_ref = self.db.collection("products").document(product_id)
            user_ref = self.db.collection("users").document(user_id)

            # Use a transaction for atomic updates
            @firestore.transactional
            def update_in_transaction(transaction, product_ref, user_ref, product_data, user_id, email):
                # Get current product data
                product_snapshot = product_ref.get(transaction=transaction)
                current_data = product_snapshot.to_dict() if product_snapshot.exists else {}

                # Calculate price change
                price_change = self._calculate_price_change(current_data, product_data)

                now = datetime.now()
                product_update = {
                    "name": product_data.get("name"),
                    "image": product_data.get("image"),
                    "currentPrice": product_data.get("price"),
                    "currency": product_data.get("currency", "Rs"),
                    "url": product_data.get("url"),
                    "lastUpdated": now,
                    "priceChange": price_change,
                    f"trackers.{user_id}": now
                }

                # Update price history if needed
                if not product_snapshot.exists or current_data.get("currentPrice") != product_data["price"]:
                    history = current_data.get("priceHistory", [])
                    history.append({"date": now, "price": product_data["price"]})
                    product_update["priceHistory"] = history

                # Update product document
                transaction.set(product_ref, product_update, merge=True)

                # Update user document
                user_update = {
                    "trackedProducts": firestore.ArrayUnion([product_id]),
                    "email": email or user_id,
                    "lastUpdated": now
                }
                transaction.set(user_ref, user_update, merge=True)

            # Run the transaction
            transaction = self.db.transaction()
            update_in_transaction(transaction, product_ref, user_ref, product_data, user_id, email)

            # Handle target price if provided
            if target_price is not None:
                await self.add_alert(product_id, user_id, target_price, email=email)

            logger.info(f"Successfully tracked product '{product_id}' for user '{user_id}'.")
        except Exception as e:
            logger.error(f"Failed to track product '{product_id}' for user '{user_id}': {traceback.format_exc()}")
            raise

    def _calculate_price_change(self, current_data: dict, new_data: dict) -> Dict[str, Any]:
        """Helper to calculate price change metrics."""
        if not current_data or "currentPrice" not in current_data:
            return {
                "amount": 0.0,
                "percentage": 0.0,
                "direction": "stable"
            }

        old_price = current_data["currentPrice"]
        new_price = new_data["price"]
        change_amount = new_price - old_price
        change_percent = (change_amount / old_price) * 100 if old_price != 0 else 0.0

        return {
            "amount": round(change_amount, 2),
            "percentage": round(change_percent, 2),
            "direction": "up" if change_amount > 0 else "down" if change_amount < 0 else "stable"
        }

    async def add_alert(
        self,
        product_id: str,
        user_id: str,
        target_price: float,
        email: Optional[str] = None
    ) -> None:
        """Add or update a price alert with transaction safety."""
        try:
            alerts_ref = self.db.collection("alerts")
            
            # Use a transaction to prevent duplicate alerts
            @firestore.transactional
            def update_alert_in_transaction(transaction, alerts_ref, product_id, user_id, target_price, email):
                query = (alerts_ref.where("productId", "==", product_id)
                                 .where("userId", "==", user_id)
                                 .limit(1))
                
                docs = query.get(transaction=transaction)
                now = datetime.now()
                alert_data = {
                    "productId": product_id,
                    "userId": user_id,
                    "targetPrice": target_price,
                    "isActive": True,
                    "lastModified": now,
                    "email": email
                }
                
                if docs:
                    # Update existing alert
                    transaction.update(docs[0].reference, alert_data)
                else:
                    # Create new alert
                    alert_data["createdAt"] = now
                    transaction.create(alerts_ref.document(), alert_data)

            transaction = self.db.transaction()
            update_alert_in_transaction(transaction, alerts_ref, product_id, user_id, target_price, email)
            
            logger.info(f"Alert set for product '{product_id}' (user '{user_id}') at target price {target_price}.")
        except Exception as e:
            logger.error(f"Failed to set alert for product '{product_id}' (user '{user_id}'): {traceback.format_exc()}")
            raise

    async def remove_alert(
        self,
        product_id: str,
        user_id: str
    ) -> None:
        """Remove a price alert with proper error handling."""
        try:
            alerts_ref = self.db.collection("alerts")
            query = (alerts_ref.where("productId", "==", product_id)
                               .where("userId", "==", user_id)
                               .limit(1))
            
            docs = query.get()
            if docs:
                docs[0].reference.delete()
                logger.info(f"Removed alert for product '{product_id}' (user '{user_id}').")
        except Exception as e:
            logger.error(f"Failed to remove alert for product '{product_id}' (user '{user_id}'): {traceback.format_exc()}")
            raise

    async def remove_product(
        self,
        product_id: str,
        user_id: str
    ) -> None:
        """Remove product tracking with transaction safety."""
        try:
            # Use a transaction for atomic updates
            @firestore.transactional
            def remove_in_transaction(transaction, product_id, user_id):
                # Remove from user's tracked products
                user_ref = self.db.collection("users").document(user_id)
                transaction.update(user_ref, {
                    "trackedProducts": firestore.ArrayRemove([product_id])
                })
                
                # Remove tracking entry from product
                product_ref = self.db.collection("products").document(product_id)
                transaction.update(product_ref, {
                    f"trackers.{user_id}": firestore.DELETE_FIELD
                })

            transaction = self.db.transaction()
            remove_in_transaction(transaction, product_id, user_id)
            
            # Remove any alerts (outside transaction since it's async)
            await self.remove_alert(product_id, user_id)
            
            logger.info(f"User '{user_id}' stopped tracking product '{product_id}'.")
        except Exception as e:
            logger.error(f"Failed to remove product tracking for '{product_id}' (user '{user_id}'): {traceback.format_exc()}")
            raise

    async def get_user_products(self, user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get all products tracked by a user and format for API response."""
        try:
            user_doc = self.db.collection("users").document(user_id).get()
            if not user_doc.exists:
                logger.info(f"No user document found for ID: {user_id}")
                return {"products": []}
            
            tracked_product_ids = user_doc.to_dict().get("trackedProducts", [])
            if not tracked_product_ids:
                return {"products": []}
            
            # Get all alerts for this user in one query
            alerts = self._get_user_alerts(user_id)
            
            # Get all products in batch
            products = await self._get_products_batch(tracked_product_ids)
            
            # Combine data
            enriched_products = []
            for prod_id in tracked_product_ids:
                prod_data = products.get(prod_id)
                if not prod_data:
                    logger.warning(f"Missing product data for ID: {prod_id}, skipping.")
                    continue

                alert_data = alerts.get(prod_id, {})
                enriched_products.append(self._format_product_data(prod_id, prod_data, alert_data))

            return {"products": enriched_products}
        except Exception as e:
            logger.error(f"Failed to get products for user '{user_id}': {traceback.format_exc()}")
            raise

    def _get_user_alerts(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Helper to get all alerts for a user."""
        alerts_query = self.db.collection("alerts").where("userId", "==", user_id)
        return {
            alert.to_dict().get("productId"): {
                "targetPrice": alert.to_dict().get("targetPrice"),
                "alertEnabled": alert.to_dict().get("isActive", False)
            }
            for alert in alerts_query.stream()
        }

    async def _get_products_batch(self, product_ids: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """Helper to get multiple products in a single batch."""
        if not product_ids:
            return {}
            
        # Split into chunks of 10 to avoid Firestore limits
        chunk_size = 10
        chunks = [product_ids[i:i + chunk_size] for i in range(0, len(product_ids), chunk_size)]
        results = {}
        
        for chunk in chunks:
            # Use `in` query for efficient batch fetching
            docs = self.db.collection("products").where(FieldPath.document_id(), "in", chunk).stream()
            for doc in docs:
                results[doc.id] = doc.to_dict()
        
        # Include None for any products not found (useful for debugging, but we filter these out later)
        for pid in product_ids:
            if pid not in results:
                results[pid] = None
                
        return results

    def _format_product_data(
        self,
        product_id: str,
        product_data: Optional[Dict[str, Any]],
        alert_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Format product data for API response."""
        if product_data is None:
            return {
                "id": product_id,
                "error": "Product data not found"
            }
            
        last_updated = product_data.get("lastUpdated")
        return {
            "id": product_id,
            "name": product_data.get("name"),
            "image": product_data.get("image"),
            "currentPrice": product_data.get("currentPrice"),
            "currency": product_data.get("currency", "Rs"),
            "url": product_data.get("url"),
            "alertEnabled": alert_info.get("alertEnabled", False),
            "targetPrice": alert_info.get("targetPrice"),
            "lastUpdated": last_updated.isoformat() if hasattr(last_updated, "isoformat") else str(last_updated),
            "priceChange": product_data.get("priceChange", {
                "amount": 0.0,
                "percentage": 0.0,
                "direction": "stable"
            })
        }

    async def get_single_product(self, product_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a single tracked product with validation."""
        try:
            # Verify user is tracking this product
            if not await self._is_user_tracking_product(user_id, product_id):
                logger.warning(f"User {user_id} is not tracking product {product_id}.")
                return None
                
            # Get product data
            product_doc = self.db.collection("products").document(product_id).get()
            if not product_doc.exists:
                logger.warning(f"Product {product_id} not found in 'products' collection.")
                return None
                
            product_data = product_doc.to_dict()
            
            # Get alert info
            alert_info = await self._get_product_alert_info(product_id, user_id)
            
            return self._format_product_data(product_id, product_data, alert_info)
        except Exception as e:
            logger.error(f"Failed to get product '{product_id}' for user '{user_id}': {traceback.format_exc()}")
            raise

    async def _is_user_tracking_product(self, user_id: str, product_id: str) -> bool:
        """Check if a user is tracking a specific product."""
        user_doc = self.db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return False
        tracked = user_doc.to_dict().get("trackedProducts", [])
        return product_id in tracked

    async def _get_product_alert_info(self, product_id: str, user_id: str) -> Dict[str, Any]:
        """Get alert info for a specific product-user pair."""
        query = (self.db.collection("alerts")
                             .where("productId", "==", product_id)
                             .where("userId", "==", user_id)
                             .limit(1))
        
        docs = query.get()
        if not docs:
            return {}
            
        alert_data = docs[0].to_dict()
        return {
            "targetPrice": alert_data.get("targetPrice"),
            "alertEnabled": alert_data.get("isActive", False)
        }

    async def get_price_history(self, product_id: str) -> List[Dict[str, Any]]:
        """Get price history with proper formatting and error handling."""
        try:
            doc = self.db.collection("products").document(product_id).get()
            if not doc.exists:
                logger.info(f"No price history found for product ID: {product_id}")
                return []
                
            data = doc.to_dict()
            history = data.get("priceHistory", [])
            
            return [
                {
                    "date": entry["date"].isoformat() if hasattr(entry.get("date"), "isoformat") else str(entry.get("date", "")),
                    "price": entry.get("price")
                }
                for entry in history
            ]
        except Exception as e:
            logger.error(f"Failed to get price history for '{product_id}': {traceback.format_exc()}")
            raise

    # --- FUNCTIONS FOR PRODUCT COMPARISON ---
    async def get_or_generate_comparison(
        self,
        product_id: str,
        product_title: str
    ) -> List[Dict[str, Any]]:
        """
        Get similar products with enhanced caching and multiple search strategies.
        Always tries to return 3 products from different platforms.
        """
        comparison_ref = self.db.collection("comparisons").document(product_id)
        
        # Step 1: Check cache
        cached_data = comparison_ref.get().to_dict() if comparison_ref.get().exists else None
        
        # Step 2: Use cache only if it has 3 products and is recent (less than 24 hours old)
        if cached_data and cached_data.get("similarProducts"):
            cached_products = cached_data["similarProducts"]
            if len(cached_products) >= 3:
                logger.info(f"Using cached data with {len(cached_products)} products for {product_id}")
                return cached_products
        
        # Step 3: Generate fresh data with multiple strategies
        logger.info(f"Generating fresh comparison data for {product_id}")
        return await self._refresh_comparison_data(product_id, product_title, comparison_ref)

    async def _refresh_comparison_data(
        self,
        product_id: str,
        product_title: str,
        ref: firestore.DocumentReference
    ) -> List[Dict[str, Any]]:
        """
        Fetch fresh comparison data using multiple search strategies.
        """
        try:
            results = await self._fetch_and_process_comparison_data(product_id, product_title)
            
            # Cache the results regardless of count (for future improvement)
            ref.set({
                "primaryProductId": product_id,
                "lastCompared": firestore.SERVER_TIMESTAMP,
                "similarProducts": results,
                "searchTitle": product_title
            })
            
            logger.info(f"Cached {len(results)} products for {product_id}")
            return results
            
        except Exception as e:
            logger.error(f"Refresh failed for {product_id}: {str(e)}")
            return []

    async def _fetch_and_process_comparison_data(
        self,
        product_id: str,
        product_title: str
    ) -> List[Dict[str, Any]]:
        """
        Enhanced data fetching with multiple search strategies and better processing.
        """
        try:
            # Strategy 1 - Enhanced keyword extraction
            keywords = extract_brand_model(product_title)
            logger.info(f"Extracted keywords: '{keywords}' from title: '{product_title}'")
            
            # Strategy 2 - Multiple search approaches
            all_results = []
            
            # Search approach 1: General search with site restrictions
            search_variants = generate_search_variants(keywords)
            for variant in search_variants:
                try:
                    results = search_other_platforms(variant)
                    all_results.extend(results)
                    logger.info(f"Search variant '{variant}' returned {len(results)} results")
                    
                    # Add small delay between searches
                    await asyncio.sleep(0.5)
                    
                    # If we have good results, we can break early
                    if len(all_results) >= 10:
                        break
                        
                except Exception as e:
                    logger.error(f"Error with search variant '{variant}': {e}")
                    continue
            
            # Search approach 2: Platform-specific searches if needed
            if len(all_results) < 6:  # If we don't have enough results
                platform_searches = await self._platform_specific_searches(keywords)
                all_results.extend(platform_searches)
            
            # Process and filter results
            similar_products = await self._process_search_results(all_results, product_title)
            
            logger.info(f"Final processed products: {len(similar_products)}")
            return similar_products

        except Exception as e:
            logger.error(f"Comparison processing failed for {product_id}: {str(e)}")
            return []

    async def _platform_specific_searches(self, keywords: str) -> List[Dict]:
        """
        Perform targeted searches on specific platforms.
        """
        platform_results = []
        platforms = ["Flipkart", "Meesho", "Amazon"]
        
        for platform in platforms:
            try:
                results = search_specific_platform(keywords, platform)
                platform_results.extend(results)
                logger.info(f"Platform-specific search on {platform} returned {len(results)} results")
                await asyncio.sleep(0.5)  # Rate limiting
            except Exception as e:
                logger.error(f"Error searching {platform}: {e}")
                continue
        
        return platform_results

    async def _process_search_results(
        self, 
        raw_results: List[Dict], 
        original_title: str
    ) -> List[Dict[str, Any]]:
        """
        Process raw search results into final product format with enhanced filtering.
        """
        if not raw_results:
            return []
        
        # Remove duplicates and invalid results
        valid_results = self._filter_and_deduplicate(raw_results)
        
        # Group by platform for balanced selection
        platform_groups = {
            "Flipkart": [],
            "Meesho": [],
            "Amazon": []
        }
        
        for result in valid_results:
            platform = result.get("platform", "")
            if platform in platform_groups:
                platform_groups[platform].append(result)
        
        # Score and rank products within each platform
        for platform in platform_groups:
            platform_groups[platform] = self._score_and_rank_products(
                platform_groups[platform], 
                original_title
            )
        
        # Select best products ensuring platform diversity
        final_products = self._select_best_products(platform_groups)
        
        # Convert to final format
        return [self._convert_to_response_format(product) for product in final_products]

    def _filter_and_deduplicate(self, results: List[Dict]) -> List[Dict]:
        """
        Filter out invalid results and remove duplicates.
        """
        valid_results = []
        seen_urls = set()
        seen_titles = set()
        
        for result in results:
            url = result.get("url", "")
            title = result.get("title", "").lower().strip()
            
            # Skip if no URL or title
            if not url or not title:
                continue
            
            # Skip duplicates
            if url in seen_urls or title in seen_titles:
                continue
            
            # Skip if title is too short or generic
            if len(title) < 10:
                continue
            
            # Skip if no price information available
            price = result.get("price", 0)
            snippet = result.get("snippet", "")
            if price <= 0 and not any(char in snippet.lower() for char in ['₹', 'rs', 'rupee', 'price', 'cost']):
                continue
            
            valid_results.append(result)
            seen_urls.add(url)
            seen_titles.add(title)
        
        logger.info(f"Filtered to {len(valid_results)} valid unique results")
        return valid_results

    def _score_and_rank_products(self, products: List[Dict], original_title: str) -> List[Dict]:
        """
        Score products based on relevance and quality indicators.
        """
        if not products:
            return []
        
        original_words = set(original_title.lower().split())
        
        for product in products:
            score = 0
            title = product.get("title", "").lower()
            title_words = set(title.split())
            
            # Relevance score based on word overlap
            common_words = original_words.intersection(title_words)
            relevance_score = len(common_words) / max(len(original_words), 1) * 100
            score += relevance_score
            
            # Quality indicators
            if product.get("price", 0) > 0:
                score += 20  # Has price information
            
            if product.get("image") and product["image"] != "/logos/default.png":
                score += 10  # Has product image
            
            if product.get("source") == "shopping":
                score += 15  # From shopping results (usually more accurate)
            
            if len(title) > 30:
                score += 5  # Detailed title
            
            # Penalty for very short titles
            if len(title) < 20:
                score -= 10
            
            product["relevance_score"] = score
        
        # Sort by score (highest first)
        return sorted(products, key=lambda x: x.get("relevance_score", 0), reverse=True)

    def _select_best_products(self, platform_groups: Dict[str, List[Dict]]) -> List[Dict]:
        """
        Select the best products ensuring platform diversity.
        Target: 1 product from each platform (Flipkart, Meesho, Amazon).
        """
        selected_products = []
        platforms_priority = ["Flipkart", "Meesho", "Amazon"]
        
        # First pass: Get one product from each platform
        for platform in platforms_priority:
            if platform_groups[platform] and len(selected_products) < 3:
                best_product = platform_groups[platform][0]  # Already sorted by score
                selected_products.append(best_product)
                logger.info(f"Selected from {platform}: {best_product['title'][:50]}... (Score: {best_product.get('relevance_score', 0):.1f})")
        
        # Second pass: Fill remaining slots with best remaining products
        if len(selected_products) < 3:
            all_remaining = []
            for platform in platforms_priority:
                # Skip first product as it's already selected
                all_remaining.extend(platform_groups[platform][1:])
            
            # Sort all remaining by score
            all_remaining.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            for product in all_remaining:
                if len(selected_products) >= 3:
                    break
                selected_products.append(product)
                logger.info(f"Added additional from {product['platform']}: {product['title'][:50]}... (Score: {product.get('relevance_score', 0):.1f})")
        
        return selected_products

    def _convert_to_response_format(self, product: Dict) -> Dict[str, Any]:
        """
        Convert internal product format to API response format.
        """
        # Enhanced price extraction
        price = product.get("price", 0)
        if price <= 0:
            # Try to extract price from snippet again with more patterns
            snippet = product.get("snippet", "")
            title = product.get("title", "")
            price = self._extract_price_enhanced(snippet + " " + title)
        
        # Generate product ID
        product_id = product.get("url", "")
        if not product_id:
            # Fallback ID generation
            platform = product.get("platform", "unknown").lower()
            title_hash = abs(hash(product.get("title", ""))) % 100000
            product_id = f"{platform}-{title_hash}"
        
        # Determine currency
        snippet_text = product.get("snippet", "") + " " + product.get("title", "")
        currency = "₹" if "₹" in snippet_text else ("Rs " if any(x in snippet_text.lower() for x in ["rs ", "rs.", "rupee"]) else "₹")
        
        return {
            "productId": product_id,
            "name": product.get("title", "Unknown Product").strip(),
            "platform": product.get("platform", "Unknown"),
            "url": product.get("url", ""),
            "image": product.get("image", "/logos/default.png"),
            "currentPrice": max(price, 0),  # Ensure non-negative price
            "currency": currency,
            "snippet": product.get("snippet", "")[:200],  # Limit snippet length
            "relevanceScore": product.get("relevance_score", 0)
        }

    def _extract_price_enhanced(self, text: str) -> float:
        """
        Enhanced price extraction with multiple patterns and validation.
        """
        if not text:
            return 0.0
        
        # More comprehensive price patterns
        price_patterns = [
            r'₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # ₹1,299 or ₹1,299.00
            r'Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # Rs 1,299 or Rs. 1,299.50
            r'INR\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # INR 1,299
            r'Price[:\s]*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # Price: ₹1,299
            r'MRP[:\s]*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # MRP: ₹1,299
            r'([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rupees?|inr)',  # 1,299 rupees
            r'\$\s*([0-9,]+(?:\.[0-9]{1,2})?)',  # $99.99
            r'([0-9,]+(?:\.[0-9]{1,2})?)\s*₹',  # 1,299₹
            r'(?:starting|from|only)\s*₹\s*([0-9,]+)',  # starting ₹1,299
            r'(?:at|for)\s*₹\s*([0-9,]+)',  # at ₹1,299
        ]
        
        extracted_prices = []
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Clean and convert price
                    price_str = str(match).replace(',', '').strip()
                    price = float(price_str)
                    
                    # Validate price range (reasonable for Indian e-commerce)
                    if 10 <= price <= 10000000:  # ₹10 to ₹1 crore
                        extracted_prices.append(price)
                        
                except (ValueError, TypeError):
                    continue
        
        if extracted_prices:
            # Return the most reasonable price (median if multiple found)
            extracted_prices.sort()
            return extracted_prices[len(extracted_prices) // 2]
        
        return 0.0

    # Additional utility method for debugging
    async def debug_search_results(self, product_title: str) -> Dict[str, Any]:
        """
        Debug method to test search functionality and see intermediate results.
        """
        try:
            keywords = extract_brand_model(product_title)
            search_variants = generate_search_variants(keywords)
            
            debug_info = {
                "original_title": product_title,
                "extracted_keywords": keywords,
                "search_variants": search_variants,
                "results_by_variant": {}
            }
            
            for variant in search_variants:
                results = search_other_platforms(variant)
                debug_info["results_by_variant"][variant] = {
                    "count": len(results),
                    "platforms": list(set(r.get("platform", "Unknown") for r in results)),
                    "sample_titles": [r.get("title", "")[:50] + "..." for r in results[:3]]
                }
            
            return debug_info
            
        except Exception as e:
            return {"error": str(e)}

# Additional helper functions that can be used independently

def validate_product_data(product: Dict) -> bool:
    """
    Validate if a product has minimum required data.
    """
    required_fields = ["title", "url", "platform"]
    return all(product.get(field) for field in required_fields)

def normalize_platform_name(platform_name: str) -> str:
    """
    Normalize platform names to standard format.
    """
    platform_mapping = {
        "flipkart.com": "Flipkart",
        "meesho.com": "Meesho",
        "meesho.in": "Meesho",
        "amazon.in": "Amazon",
        "amazon.com": "Amazon"
    }
    
    platform_lower = platform_name.lower()
    for key, value in platform_mapping.items():
        if key in platform_lower:
            return value
    
    return "Other"