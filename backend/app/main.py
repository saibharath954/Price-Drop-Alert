# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .scraper.amazon import AmazonScraper
from .firebase.client import FirebaseClient
import os

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
firebase = FirebaseClient()

class ScrapeRequest(BaseModel):
    url: str

class TrackRequest(ScrapeRequest):
    userId: str
    targetPrice: Optional[float] = None
    email: Optional[str] = None

@app.post("/scrape-preview")
async def scrape_preview(request: ScrapeRequest):
    scraper = AmazonScraper()
    try:
        product_data = await scraper.scrape(request.url)
        return {
            "productId": scraper.generate_product_id(request.url),
            "name": product_data["name"],
            "image": product_data["image"],
            "price": product_data["price"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/track")
async def track_product(request: TrackRequest):
    scraper = AmazonScraper()
    try:
        # Scrape fresh data
        product_data = await scraper.scrape(request.url)
        product_id = scraper.generate_product_id(request.url)
        
        # Save to Firestore
        await firebase.track_product(
            product_id=product_id,
            user_id=request.userId,
            product_data=product_data,
            target_price=request.targetPrice,
            email=request.email
        )
        
        return {"status": "success", "productId": product_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/prices")
async def get_price_history(productId: str):
    try:
        history = await firebase.get_price_history(productId)
        return {"priceHistory": history}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/product")
async def get_product(productId: str):
    try:
        product = await firebase.get_product(productId)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))