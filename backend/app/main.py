# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from .scraper.amazon import AmazonScraper # Assuming this path is correct
from .firebase.client import FirebaseClient
import os
import traceback

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
    "https://your-production-domain.com", # Replace with your actual production domain
    "https://price-drop-alert-seven.vercel.app" # Your Vercel deployment
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
    userId: str # Should ideally be derived from token, not sent by client
    targetPrice: Optional[float] = None
    email: Optional[str] = None # Should ideally be derived from token if verified by Firebase

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
    priceChange: PriceChange

class PriceHistoryEntry(BaseModel):
    date: str # ISO formatted datetime string
    price: float

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
        # Ensure scraper returns expected keys
        if not all(k in product_data for k in ["name", "image", "price", "url"]):
             raise ValueError("Scraper returned incomplete data.")
        
        product_id = scraper.generate_product_id(request.url) # Ensure this is robust
        
        return ScrapePreviewResponse(
            productId=product_id,
            name=product_data["name"],
            image=product_data["image"],
            currentPrice=product_data["price"],
            currency=product_data.get("currency", "USD"), # Default if not scraped
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
        # It's safer to use the userId from the authenticated token
        # than to rely on the client sending it in the request body.
        user_id_from_token = user['uid']
        user_email_from_token = user.get('email', None) # Get email from token if available

        # Optional: You might want to remove request.userId from TrackRequest Pydantic model
        # if you always want to rely on the token for userId.
        if request.userId and request.userId != user_id_from_token:
             logger.warning(f"Client-provided userId ({request.userId}) mismatch with token userId ({user_id_from_token}). Using token userId.")
        
        # Scrape fresh data again (or consider caching/deduplication for performance)
        product_data = await scraper.scrape(request.url)
        product_id = scraper.generate_product_id(request.url)
        
        # Save to Firestore
        await firebase.track_product(
            product_id=product_id,
            user_id=user_id_from_token,
            product_data=product_data,
            target_price=request.targetPrice,
            email=request.email or user_email_from_token # Prefer request email if provided, else token email
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
        products = await firebase.get_user_products(user_id=user['uid'])
        if not products:
            logger.info(f"No products found for user {user['uid']}.")
            return []
        
        # Explicitly validate and return the ProductResponse list
        return [ProductResponse(**p) for p in products]
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
    This addresses the original 405 error by providing a GET endpoint for individual products.
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
            user_products = await firebase.get_user_products(user['uid'])
            if not any(p['id'] == request.productId for p in user_products):
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