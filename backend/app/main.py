# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union # Added Union for PriceChange
from datetime import datetime
from google.cloud.firestore import SERVER_TIMESTAMP
import logging
from app.scraper.keyword_extractor import extract_brand_model
from app.scraper.platform_scraper import search_other_platforms
import os
import re
import traceback

# Local imports (ensure these paths are correct relative to your project structure)
from .scraper.amazon import AmazonScraper
from .firebase.client import FirebaseClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Price Drop Alert API",
    description="API for tracking product prices and setting alerts.",
    version="1.0.0"
)
security = HTTPBearer()

# CORS configuration - Ensure this is correctly set for your frontend deployment
origins = [
    "http://localhost:3000", # For local development
    "https://price-drop-alert-seven.vercel.app",  # Your Vercel frontend
    "https://price-drop-alert-seven.vercel.app/",  # Variant with trailing slash
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods for flexibility, though more specific is better in prod
    allow_headers=["*"], # Allow all headers
)

# Initialize services
try:
    firebase = FirebaseClient()
    scraper = AmazonScraper()
except Exception as e:
    logger.critical(f"Failed to initialize critical services: {e}. Exiting.")
    # In a real-world scenario, you might want to raise this or handle it more gracefully
    # For now, let it crash if essential services can't start.
    raise

# Pydantic Models for Request and Response Data
class PriceChange(BaseModel):
    amount: float
    percentage: float
    direction: str

class ScrapeRequest(BaseModel):
    url: str
    force_new: Optional[bool] = False # Not fully utilized yet, but good for future extension

class ScrapePreviewResponse(BaseModel):
    productId: str
    name: str
    image: str
    currentPrice: float
    currency: str
    url: str

class TrackRequest(ScrapeRequest):
    # userId: str # Removed this - userId should come from the token for security
    targetPrice: Optional[float] = None
    # email: Optional[str] = None # Removed this - email should come from the token for security

class AlertToggleRequest(BaseModel):
    productId: str
    targetPrice: Optional[float] = None # Required if enabling alert
    enable: bool

class ProductResponse(BaseModel):
    id: str
    name: str
    image: str
    currentPrice: float
    currency: str
    url: str
    alertEnabled: bool
    targetPrice: Optional[float] # Can be None if no alert set or disabled
    lastUpdated: str # Will be ISO formatted datetime string
    priceChange: PriceChange # Ensure PriceChange is a Pydantic model itself

class PriceHistoryEntry(BaseModel):
    date: str # ISO formatted datetime string
    price: float

class CompareRequest(BaseModel):
    productId: str # The ID of the primary product for which we're finding similar items
    productTitle: str # The title of the primary product to use for search

# Define the structure for a single similar product to be returned
class SimilarProductResponse(BaseModel):
    productId: str      # Unique ID for the similar product (can be its URL or a generated ID)
    name: str           
    platform: str       
    url: str            
    image: str          
    currentPrice: float 
    currency: str       

# Dependency to verify Firebase ID token
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifies Firebase ID token and returns decoded token."""
    try:
        token = credentials.credentials
        decoded_token = firebase.verify_token(token)
        logger.info(f"Authenticated user: {decoded_token.get('uid')}")
        return decoded_token
    except HTTPException: # Re-raise if it's already an HTTPException (e.g., from FirebaseClient)
        raise
    except Exception as e:
        logger.error(f"Authentication failed in verify_token: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
# --- API Endpoints ---

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "message": "API is running."}

@app.post("/scrape-preview", response_model=ScrapePreviewResponse, status_code=status.HTTP_200_OK)
async def scrape_preview(request: ScrapeRequest):
    """
    Previews product data from a given URL without saving or tracking it.
    Useful for showing product details before a user decides to track.
    """
    try:
        product_data = await scraper.scrape(request.url)
        # Ensure scraper returns expected keys and handle missing optional ones
        required_keys = ["name", "image", "price", "url"]
        if not all(k in product_data for k in required_keys):
            logger.error(f"Scraper returned incomplete data for URL '{request.url}': Missing one of {required_keys}")
            raise ValueError("Scraper returned incomplete data.")
        
        product_id = scraper.generate_product_id(request.url) # Ensure this is robust
        
        return ScrapePreviewResponse(
            productId=product_id,
            name=product_data["name"],
            image=product_data["image"],
            currentPrice=product_data["price"],
            currency=product_data.get("currency", "Rs "), # Default if not scraped
            url=request.url
        )
    except Exception as e:
        logger.error(f"Scrape preview failed for URL '{request.url}': {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to preview product: {str(e)}. Please check the URL or try again."
        )

@app.post("/track", status_code=status.HTTP_201_CREATED) # 201 Created for new resource
async def track_product(
    request: TrackRequest,
    user: dict = Depends(verify_token)
):
    """
    Tracks a new product for the authenticated user.
    If the product is already tracked by the user, it will update its details.
    """
    try:
        user_id_from_token = user['uid']
        user_email_from_token = user.get('email', None) 
        
        # Scrape fresh data again (or consider caching/deduplication for performance)
        product_data = await scraper.scrape(request.url)
        product_id = scraper.generate_product_id(request.url)
        
        await firebase.track_product(
            product_id=product_id,
            user_id=user_id_from_token,
            product_data=product_data,
            target_price=request.targetPrice,
            email=user_email_from_token # Always use email from token for security and consistency
        )
        
        return {"message": "Product tracking initiated successfully", "productId": product_id}
    except HTTPException: # Re-raise HTTPExceptions directly
        raise
    except Exception as e:
        logger.error(f"Tracking product '{request.url}' failed for user '{user.get('uid')}': {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to track product: {str(e)}"
        )

@app.get("/user/products", response_model=List[ProductResponse], status_code=status.HTTP_200_OK)
async def get_user_products(user: dict = Depends(verify_token)):
    """Retrieves all products currently tracked by the authenticated user."""
    try:
        # Crucial change: Extract the 'products' list from the dictionary response
        firebase_response = await firebase.get_user_products(user_id=user['uid'])
        products_list = firebase_response.get("products", [])

        if not products_list:
            logger.info(f"No products found for user {user['uid']}.")
            return [] # Return an empty list if no products or an error
        
        # Explicitly validate and return the ProductResponse list
        return [ProductResponse(**p) for p in products_list]
    except Exception as e:
        logger.error(f"Failed to fetch products for user '{user.get('uid')}': {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user products. Please try again later."
        )

@app.get("/product/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
async def get_product_details(
    product_id: str,
    user: dict = Depends(verify_token)
):
    """
    Retrieves detailed information for a single product tracked by the authenticated user.
    """
    try:
        product_details = await firebase.get_single_product(product_id=product_id, user_id=user['uid'])
        if not product_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' not found or not tracked by this user."
            )
        return ProductResponse(**product_details)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get details for product '{product_id}' (user '{user.get('uid')}'): {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch product details: {str(e)}"
        )

@app.post("/product/alert", status_code=status.HTTP_200_OK)
async def toggle_product_alert(
    request: AlertToggleRequest,
    user: dict = Depends(verify_token)
):
    """
    Enables or disables price alerts for a specific product for the authenticated user.
    If enabling, targetPrice must be provided.
    """
    try:
        if request.enable:
            if request.targetPrice is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target price is required when enabling an alert."
                )
            # Ensure the user is actually tracking the product before setting an alert
            # Fetch user's tracked products to validate ownership
            user_tracked_products_response = await firebase.get_user_products(user['uid'])
            user_tracked_product_ids = [p['id'] for p in user_tracked_products_response.get("products", [])]

            if request.productId not in user_tracked_product_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only set alerts for products you are tracking."
                )

            await firebase.add_alert(
                product_id=request.productId,
                user_id=user['uid'],
                target_price=request.targetPrice,
                email=user.get('email') # Use email from authenticated token for alerts
            )
            return {"status": "success", "message": f"Alert enabled for {request.productId} at target price {request.targetPrice}"}
        else:
            await firebase.remove_alert(
                product_id=request.productId,
                user_id=user['uid']
            )
            return {"status": "success", "message": f"Alert disabled for {request.productId}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle alert for product '{request.productId}' (user '{user.get('uid')}'): {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to toggle alert: {str(e)}"
        )

@app.delete("/product/{product_id}", status_code=status.HTTP_200_OK)
async def remove_tracked_product(
    product_id: str,
    user: dict = Depends(verify_token)
):
    """
    Stops tracking a product for the authenticated user and removes associated alerts.
    """
    try:
        await firebase.remove_product(
            product_id=product_id,
            user_id=user['uid']
        )
        return {"status": "success", "message": f"Stopped tracking product '{product_id}'."}
    except Exception as e:
        logger.error(f"Failed to remove product '{product_id}' for user '{user.get('uid')}': {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to remove product: {str(e)}"
        )

@app.get("/product/{product_id}/history", response_model=List[PriceHistoryEntry], status_code=status.HTTP_200_OK)
async def get_price_history(product_id: str):
    """
    Retrieves the price history for a specific product.
    Note: This endpoint does not require authentication to allow public access to history.
    If you want to restrict it, add `user: dict = Depends(verify_token)`
    and check if the user is tracking the product.
    """
    try:
        history_raw = await firebase.get_price_history(product_id)
        if not history_raw:
            return []
        
        # Ensure the history entries match the Pydantic model
        return [PriceHistoryEntry(date=entry['date'], price=entry['price']) for entry in history_raw]
    except Exception as e:
        logger.error(f"Failed to fetch price history for product '{product_id}': {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch price history: {str(e)}"
        )

@app.post("/compare", response_model=List[SimilarProductResponse], status_code=status.HTTP_200_OK)
async def compare_product(
    request: CompareRequest,
    user: dict = Depends(verify_token)
):
    """
    Find similar products across platforms with enhanced error handling and debugging.
    Returns list of similar products with their details.
    """
    try:
        logger.info(f"Starting product comparison for: {request.productId} - '{request.productTitle}'")
        
        # Validate input
        if not request.productTitle or len(request.productTitle.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product title must be at least 3 characters long"
            )
        
        # Call the enhanced service function
        similar_products = await firebase.get_or_generate_comparison(
            request.productId,
            request.productTitle.strip()
        )
        
        # Enhanced logging for debugging
        platforms_found = list(set(p.get("platform", "Unknown") for p in similar_products))
        logger.info(f"Found {len(similar_products)} products across platforms: {platforms_found}")
        
        # Log individual products for debugging
        for i, product in enumerate(similar_products):
            logger.info(f"Product {i+1}: {product.get('platform', 'Unknown')} - {product.get('name', 'Unknown')[:50]}... - Price: {product.get('currency', '₹')}{product.get('currentPrice', 0)}")
        
        # If we got fewer than expected, log a warning
        if len(similar_products) < 3:
            logger.warning(f"Only found {len(similar_products)} products for '{request.productTitle}'. Expected 3.")
        
        # Ensure we return valid data
        validated_products = []
        for product in similar_products:
            if validate_product_response(product):
                validated_products.append(product)
            else:
                logger.warning(f"Skipping invalid product: {product}")
        
        if not validated_products:
            # If no valid products found, try a debug search to understand why
            debug_info = await firebase.debug_search_results(request.productTitle)
            logger.error(f"No valid products found. Debug info: {debug_info}")
            
            # Return empty list instead of error to maintain API contract
            return []
        
        logger.info(f"Successfully returning {len(validated_products)} validated products for {request.productId}")
        return validated_products

    except HTTPException as e:
        # Re-raise explicit HTTPExceptions
        logger.error(f"HTTP Exception in /compare endpoint: {e.detail}")
        raise e
    except Exception as e:
        # Log the full traceback for debugging
        error_traceback = traceback.format_exc()
        logger.error(f"Unhandled error in /compare endpoint for product {request.productId}: {error_traceback}")
        
        # Return a more helpful error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find similar products. Please try again with a different product title."
        )

def validate_product_response(product: dict) -> bool:
    """
    Validate that a product response has all required fields with valid data.
    """
    required_fields = ["productId", "name", "platform", "url", "currentPrice"]
    
    # Check all required fields exist
    if not all(field in product for field in required_fields):
        return False
    
    # Check field values are valid
    if not product["name"].strip():
        return False
    
    if not product["url"].strip():
        return False
    
    if product["platform"] not in ["Flipkart", "Meesho", "Amazon"]:
        return False
    
    # Price should be non-negative number
    try:
        price = float(product["currentPrice"])
        if price < 0:
            return False
    except (ValueError, TypeError):
        return False
    
    return True

# Optional: Add a debug endpoint for testing
@app.post("/compare/debug", status_code=status.HTTP_200_OK)
async def debug_compare_product(
    request: CompareRequest,
    user: dict = Depends(verify_token)
):
    """
    Debug endpoint to test search functionality and see intermediate results.
    """
    try:
        debug_info = await firebase.debug_search_results(request.productTitle)
        return debug_info
    except Exception as e:
        logger.error(f"Debug endpoint error: {traceback.format_exc()}")
        return {"error": str(e)}

# Optional: Add an endpoint to force refresh comparison data
@app.post("/compare/refresh", response_model=List[SimilarProductResponse], status_code=status.HTTP_200_OK)
async def refresh_comparison(
    request: CompareRequest,
    user: dict = Depends(verify_token)
):
    """
    Force refresh comparison data (bypass cache).
    """
    try:
        logger.info(f"Force refreshing comparison data for: {request.productId}")
        
        # Delete existing cache
        comparison_ref = firebase.db.collection("comparisons").document(request.productId)
        if comparison_ref.get().exists:
            comparison_ref.delete()
            logger.info(f"Deleted cached data for {request.productId}")
        
        # Generate fresh data
        similar_products = await firebase.get_or_generate_comparison(
            request.productId,
            request.productTitle
        )
        
        logger.info(f"Force refresh returned {len(similar_products)} products for {request.productId}")
        return similar_products
        
    except Exception as e:
        logger.error(f"Force refresh error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh comparison data"
        )