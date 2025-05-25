# backend/app/firebase/client.py
import traceback
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.exceptions import FirebaseError
from datetime import datetime
import os
import json 
from typing import Dict, Any, List, Optional, Union
from dotenv import load_dotenv
import logging
from google.cloud.firestore_v1 import DocumentSnapshot
from google.cloud.firestore_v1.field_path import FieldPath

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

class FirebaseClient:
    def __init__(self):
        """Initialize Firebase client with proper error handling."""
        try:
            # Get the JSON config from environment variable
            firebase_config = os.getenv("FIREBASE_CONFIG")
            
            if not firebase_config:
                raise ValueError("FIREBASE_CONFIG environment variable not set")

            try:
                # Parse the JSON string into a dictionary
                cred_dict = json.loads(firebase_config)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in FIREBASE_CONFIG: {e}")

            # Initialize Firebase with the dictionary
            cred = credentials.Certificate(cred_dict)
            if not firebase_admin._apps:  # Avoid re-initializing if already initialized
                firebase_admin.initialize_app(cred)

            self.db = firestore.client()
            logger.info("Firebase initialized successfully.")
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            logger.error(traceback.format_exc())  # Log full traceback
            raise

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
                return {"products": []}  # Return an empty list within the "products" key
            
            tracked_product_ids = user_doc.to_dict().get("trackedProducts", [])
            if not tracked_product_ids:
                return {"products": []} # Return an empty list within the "products" key
            
            # Get all alerts for this user in one query
            alerts = self._get_user_alerts(user_id)
            
            # Get all products in batch
            products = await self._get_products_batch(tracked_product_ids) # Await this call
            
            # Combine data
            enriched_products = []
            for prod_id in tracked_product_ids:
                prod_data = products.get(prod_id)
                if not prod_data:
                    logger.warning(f"Missing product data for ID: {prod_id}, skipping.")
                    continue

                alert_data = alerts.get(prod_id, {})
                enriched_products.append(self._format_product_data(prod_id, prod_data, alert_data))

            return {"products": enriched_products} # Wrap the list in a dictionary with the key "products"
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
            # Corrected: Use FieldPath from google.cloud.firestore_v1.field_path
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
            # This case should ideally be handled by filtering out missing products earlier,
            # but it's good to have a fallback.
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