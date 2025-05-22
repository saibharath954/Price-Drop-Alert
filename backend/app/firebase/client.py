# backend/app/firebase/client.py
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class FirebaseClient:
    def __init__(self):
        # Initialize Firebase
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if not cred_path:
            raise ValueError("FIREBASE_CREDENTIALS_PATH environment variable not set")
            
        cred = credentials.Certificate(cred_path)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()

    async def track_product(
        self,
        product_id: str,
        user_id: str,
        product_data: Dict[str, Any],
        target_price: Optional[float] = None,
        email: Optional[str] = None
    ) -> None:
        """Track a product in Firestore"""
        product_ref = self.db.collection("products").document(product_id)
        alerts_ref = self.db.collection("alerts")
        
        # Update or create product
        product_snapshot = await product_ref.get()
        
        product_update = {
            "name": product_data["name"],
            "image": product_data["image"],
            "currentPrice": product_data["price"],
            "url": product_data["url"],
            "updatedAt": datetime.now(),
            f"trackers.{user_id}": True
        }
        
        # Add price to history if it's changed
        if not product_snapshot.exists or product_snapshot.get("currentPrice") != product_data["price"]:
            price_history = product_snapshot.get("priceHistory") or []
            price_history.append({
                "date": datetime.now(),
                "price": product_data["price"]
            })
            product_update["priceHistory"] = price_history
        
        await product_ref.set(product_update, merge=True)
        
        # Create alert if target price is provided
        if target_price is not None:
            alert_data = {
                "productId": product_id,
                "userId": user_id,
                "targetPrice": target_price,
                "currentPrice": product_data["price"],
                "isActive": True,
                "createdAt": datetime.now(),
                "email": email
            }
            await alerts_ref.add(alert_data)

    async def get_price_history(self, product_id: str) -> List[Dict[str, Any]]:
        """Get price history for a product"""
        doc = await self.db.collection("products").document(product_id).get()
        if not doc.exists:
            return []
        return doc.get("priceHistory", [])

    async def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get product metadata"""
        doc = await self.db.collection("products").document(product_id).get()
        if not doc.exists:
            return {}
        return doc.to_dict()