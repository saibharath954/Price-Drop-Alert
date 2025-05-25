# backend/scheduler.py
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from typing import Dict, Any, List
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import asyncio
from fastapi import Depends
from app.scraper.amazon import AmazonScraper
from app.firebase.client import FirebaseClient
from dotenv import load_dotenv
import traceback
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

# Load environment variables
load_dotenv()

class AlertScheduler:
    def __init__(self):
        """Initialize the scheduler with logging and services."""
        self._setup_logging()
        self.logger = logging.getLogger(__name__)
        self.scheduler = BackgroundScheduler()
        self.firebase = FirebaseClient()
        self.scraper = AmazonScraper()
        self.smtp_config = {
            'host': os.getenv('SMTP_HOST'),
            'port': int(os.getenv('SMTP_PORT', 587)),
            'username': os.getenv('SMTP_USERNAME'),
            'password': os.getenv('SMTP_PASSWORD'),
            'from_email': os.getenv('EMAIL_FROM', 'alerts@pricedropalert.com')
        }
        self.loop = asyncio.new_event_loop()

    def _setup_logging(self):
        """Configure rotating file logging for the scheduler."""
        log_dir = "logs"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        handler = RotatingFileHandler(
            f'{log_dir}/scheduler.log',
            maxBytes=1024 * 1024 * 5,  # 5MB
            backupCount=3
        )
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        logger = logging.getLogger('price_alert_scheduler')
        logger.setLevel(logging.INFO)
        logger.addHandler(handler)

    def start(self):
        """Start the scheduled jobs."""
        try:
            # Schedule the main job to run every 30 minutes
            self.scheduler.add_job(
                self.run_price_checks,
                trigger=IntervalTrigger(minutes=30),
                next_run_time=datetime.now()  # Run immediately on startup
            )
            self.scheduler.start()
            self.logger.info("Scheduler started successfully")
        except Exception as e:
            self.logger.error(f"Failed to start scheduler: {traceback.format_exc()}")
            raise

    def run_price_checks(self):
        """Main job that runs periodically to check prices and send alerts."""
        self.logger.info("Starting scheduled price check run")
        
        try:
            # Run the async process in the event loop
            self.loop.run_until_complete(self._async_price_checks())
            self.logger.info("Completed price check run successfully")
        except Exception as e:
            self.logger.error(f"Price check run failed: {traceback.format_exc()}")

    async def _async_price_checks(self):
        """Async version of price checks to handle async scraping."""
        try:
            # Step 1: Get all tracked products from Firestore
            tracked_products = self._get_all_tracked_products()
            if not tracked_products:
                self.logger.info("No tracked products found")
                return

            # Step 2: Scrape and update each product
            for product in tracked_products:
                try:
                    await self._process_product(product)
                except Exception as e:
                    self.logger.error(f"Error processing product {product.get('id')}: {traceback.format_exc()}")
                    continue
        except Exception as e:
            self.logger.error(f"Async price check failed: {traceback.format_exc()}")
            raise

    def _get_all_tracked_products(self) -> List[Dict[str, Any]]:
        """Get all products that are being tracked by any user."""
        try:
            products_ref = self.firebase.db.collection("products")
            docs = products_ref.stream()
            
            return [
                {"id": doc.id, **doc.to_dict()}
                for doc in docs
            ]
        except Exception as e:
            self.logger.error(f"Failed to get tracked products: {traceback.format_exc()}")
            return []

    async def _process_product(self, product: Dict[str, Any]):
        """Process a single product: scrape, update, and check alerts."""
        product_id = product["id"]
        url = product.get("url")
        
        if not url:
            self.logger.warning(f"Product {product_id} has no URL, skipping")
            return

        try:
            # Scrape fresh product data (await the async call)
            self.logger.info(f"Scraping product: {product_id}")
            scraped_data = await self.scraper.scrape(url)
            
            if not scraped_data or "price" not in scraped_data:
                self.logger.warning(f"Failed to scrape valid data for product {product_id}")
                return

            # Update product in Firestore
            updated_product = self._update_product_in_firestore(product_id, scraped_data)
            
            # Check for alerts that should be triggered
            self._check_and_send_alerts(product_id, updated_product["currentPrice"])
            
        except Exception as e:
            self.logger.error(f"Error processing product {product_id}: {traceback.format_exc()}")
            raise

    def _update_product_in_firestore(self, product_id: str, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update product data in Firestore with new price information."""
        try:
            product_ref = self.firebase.db.collection("products").document(product_id)
            
            # Get current data for comparison
            current_data = product_ref.get().to_dict() or {}
            current_price = current_data.get("currentPrice", 0)
            new_price = scraped_data["price"]
            
            # Calculate price change
            price_change = self.firebase._calculate_price_change(current_data, scraped_data)
            
            # Prepare update data
            update_data = {
                "name": scraped_data.get("name", current_data.get("name")),
                "image": scraped_data.get("image", current_data.get("image")),
                "currentPrice": new_price,
                "currency": scraped_data.get("currency", current_data.get("currency", "Rs")),
                "url": scraped_data.get("url", current_data.get("url")),
                "lastUpdated": datetime.now(),
                "priceChange": price_change
            }
            
            # Get existing history or initialize empty array
            history = current_data.get("priceHistory", [])
            
            # Always add new price point to history (not just when price changes)
            history.append({
                "date": datetime.now(),
                "price": new_price
            })
            
            # Keep only the last 30 price points (adjust as needed)
            if len(history) > 30:
                history = history[-30:]
            
            update_data["priceHistory"] = history
            
            # Perform the update
            product_ref.set(update_data, merge=True)
            self.logger.info(f"Updated product {product_id} in Firestore with new price history")
            
            return update_data
        except Exception as e:
            self.logger.error(f"Failed to update product {product_id} in Firestore: {traceback.format_exc()}")
            raise

    def _check_and_send_alerts(self, product_id: str, current_price: float):
        """Check for active alerts and send notifications if triggered."""
        try:
            # Get all active alerts for this product where current price <= target price
            alerts_ref = self.firebase.db.collection("alerts")
            query = alerts_ref.where("productId", "==", product_id) \
                             .where("isActive", "==", True) \
                             .where("targetPrice", ">=", current_price)
            
            alerts = query.stream()
            
            for alert in alerts:
                alert_data = alert.to_dict()
                try:
                    self._send_alert_email(alert_data, current_price)
                    # Deactivate the alert after sending
                    alert.reference.update({"isActive": False, "triggeredAt": datetime.now()})
                    self.logger.info(f"Alert triggered and deactivated for product {product_id}, user {alert_data.get('userId')}")
                except Exception as e:
                    self.logger.error(f"Failed to process alert {alert.id}: {traceback.format_exc()}")
                    continue
                    
        except Exception as e:
            self.logger.error(f"Failed to check alerts for product {product_id}: {traceback.format_exc()}")
            raise

    def _send_alert_email(self, alert_data: Dict[str, Any], current_price: float):
        """Send an email notification for a triggered price alert."""
        try:
            product_id = alert_data["productId"]
            user_email = alert_data["email"]
            target_price = alert_data["targetPrice"]
            
            # Get product details for the email
            product_ref = self.firebase.db.collection("products").document(product_id)
            product_data = product_ref.get().to_dict()
            
            if not product_data:
                self.logger.warning(f"Product {product_id} not found for alert email")
                return

            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Price Alert: {product_data.get('name', 'Your tracked product')}"
            msg['From'] = self.smtp_config['from_email']
            msg['To'] = user_email
            
            # Create HTML email content
            html = f"""
            <html>
            <body>
                <h2>Price Drop Alert!</h2>
                <p>The product you're tracking has reached your target price.</p>
                
                <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
                    <img src="{product_data.get('image', '')}" alt="{product_data.get('name', '')}" width="200">
                    <h3>{product_data.get('name', '')}</h3>
                    <p><strong>Current Price:</strong> {product_data.get('currency', 'Rs')}{current_price}</p>
                    <p><strong>Your Target Price:</strong> {product_data.get('currency', 'Rs')}{target_price}</p>
                    <p><a href="{product_data.get('url', '')}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Buy Now</a></p>
                </div>
                
                <p>You can view all your tracked products at <a href="https://price-drop-alert-seven.vercel.app">Price Drop Alert</a></p>
                <p><small>This is an automated message. Please do not reply directly to this email.</small></p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html, 'html'))
            
            # Send the email
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.send_message(msg)
            
            self.logger.info(f"Alert email sent to {user_email} for product {product_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to send alert email: {traceback.format_exc()}")
            raise

def init_scheduler():
    """Initialize and start the scheduler."""
    scheduler = AlertScheduler()
    scheduler.start()
    return scheduler