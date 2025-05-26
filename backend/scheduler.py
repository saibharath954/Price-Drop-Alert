# backend/scheduler.py
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
from typing import Dict, Any, List
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import asyncio
import firebase_admin
from firebase_admin import credentials, firestore
from app.scraper.amazon import AmazonScraper
from dotenv import load_dotenv
import traceback
import json
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, HtmlContent

# Load environment variables
load_dotenv()

# --- Improved FirebaseClient Integration ---
class FirebaseClient:
    def __init__(self):
        # Initialize Firebase Admin SDK only once
        if not firebase_admin._apps:
            firebase_config_json_str = os.getenv('FIREBASE_CONFIG')
            if firebase_config_json_str:
                try:
                    # Parse the JSON string from the environment variable
                    cred_json = json.loads(firebase_config_json_str)
                    cred = credentials.Certificate(cred_json)
                    firebase_admin.initialize_app(cred)
                    self.logger = logging.getLogger('price_alert_scheduler') # Use existing logger
                    self.logger.info("Firebase Admin SDK initialized successfully.")
                except json.JSONDecodeError as e:
                    logging.error(f"Error decoding FIREBASE_CONFIG JSON: {e}")
                    raise ValueError("FIREBASE_CONFIG environment variable contains invalid JSON.")
                except Exception as e:
                    logging.error(f"Error initializing Firebase Admin SDK: {e}")
                    raise
            else:
                raise ValueError("FIREBASE_CONFIG environment variable is not set.")
        
        self.db = firestore.client()
        self.logger = logging.getLogger('price_alert_scheduler') # Ensure logger is available after init

    def _calculate_price_change(self, old_data: Dict[str, Any], new_data: Dict[str, Any]) -> float:
        """Calculate the percentage price change."""
        old_price = old_data.get("currentPrice")
        new_price = new_data.get("price") # Scraped data uses "price"
        
        if old_price is None or new_price is None or old_price == 0:
            return 0.0
        
        # Ensure prices are numbers before calculation
        try:
            old_price = float(old_price)
            new_price = float(new_price)
        except (ValueError, TypeError):
            self.logger.warning(f"Invalid price encountered for calculation: old_price={old_price}, new_price={new_price}")
            return 0.0 # Or handle as an error if critical

        return ((new_price - old_price) / old_price) * 100

class AlertScheduler:
    def __init__(self):
        """Initialize the scheduler with logging and services."""
        self._setup_logging()
        self.logger = logging.getLogger('price_alert_scheduler')
        self.scheduler = BackgroundScheduler()
        self.firebase = FirebaseClient()
        self.scraper = AmazonScraper()
        
        # SendGrid 
        self.sendgrid_client = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        self.from_email = os.getenv('EMAIL_FROM', 'alerts@pricedropalert.com')
        
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
        
        logger = logging.getLogger('price_alert_scheduler') # Define a specific logger name
        logger.setLevel(logging.INFO)
        if not logger.handlers: # Avoid adding multiple handlers if already present
            logger.addHandler(handler)
        
        # Also add a StreamHandler for console output in development/testing
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        # Check if a StreamHandler is already attached to avoid duplicates on re-init
        if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
            logger.addHandler(console_handler)

    def start(self):
        """Start the scheduled jobs."""
        try:
            self.scheduler.add_job(
                self.run_price_checks,
                trigger=IntervalTrigger(minutes=30),
                next_run_time=datetime.now(timezone.utc) # Run immediately on startup in UTC
            )
            self.scheduler.start()
            self.logger.info("Scheduler started successfully")
        except Exception as e:
            self.logger.error(f"Failed to start scheduler: {traceback.format_exc()}")
            raise

    def run_price_checks(self):
        """Main job that runs periodically to check prices and send alerts."""
        self.logger.info("Starting scheduled price check run")
        
        # Create a new event loop for this run to avoid issues with already-running loops
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop) # Set the new loop as the current one for this thread
        try:
            loop.run_until_complete(self._async_price_checks())
            self.logger.info("Completed price check run successfully")
        except Exception as e:
            self.logger.error(f"Price check run failed: {traceback.format_exc()}")
        finally:
            loop.close() # Always close the loop when done

    async def _async_price_checks(self):
        """Async version of price checks to handle async scraping."""
        try:
            tracked_products = await self._get_all_tracked_products_async()
            if not tracked_products:
                self.logger.info("No tracked products found")
                return

            tasks = [self._process_product(product) for product in tracked_products]
            # asyncio.gather will run tasks concurrently. return_exceptions=True means
            # if one task fails, others will still complete, and the exception is returned.
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            self.logger.error(f"Overall async price check failed: {traceback.format_exc()}")
            raise

    async def _get_all_tracked_products_async(self) -> List[Dict[str, Any]]:
        """Asynchronously get all products that are being tracked by any user."""
        try:
            products_ref = self.firebase.db.collection("products")
            # Using asyncio.to_thread to run the blocking Firestore stream() call
            docs = await asyncio.to_thread(products_ref.stream) 
            
            products_list = []
            for doc in docs:
                products_list.append({"id": doc.id, **doc.to_dict()})
            self.logger.info(f"Fetched {len(products_list)} tracked products.")
            return products_list

        except Exception as e:
            self.logger.error(f"Failed to get tracked products from Firestore: {traceback.format_exc()}")
            return []

    async def _process_product(self, product: Dict[str, Any]):
        """Process a single product: scrape, update, and check alerts."""
        product_id = product.get("id") # Use .get for safety
        url = product.get("url")
        
        if not product_id:
            self.logger.warning("Product found without an 'id', skipping.")
            return

        self.logger.info(f"Processing product: {product_id} with URL: {url}")

        if not url:
            self.logger.warning(f"Product {product_id} has no URL, skipping")
            return

        try:
            self.logger.info(f"Scraping product URL: {url} for product ID: {product_id}")
            scraped_data = await self.scraper.scrape(url)
            
            # Add more specific checks for scraped_data
            if not scraped_data:
                self.logger.warning(f"Scraper returned no data for product {product_id}. Skipping update.")
                return
            if "price" not in scraped_data or scraped_data["price"] is None:
                self.logger.warning(f"Scraper returned no price data for product {product_id}. Scraped: {scraped_data}. Skipping update.")
                return
            
            # Ensure price is a float
            try:
                scraped_data["price"] = float(scraped_data["price"])
            except (ValueError, TypeError):
                self.logger.error(f"Scraped price for product {product_id} is not a valid number: {scraped_data['price']}. Skipping update.")
                return


            updated_product_data = await self._update_product_in_firestore_async(product_id, scraped_data)
            
            if updated_product_data and "currentPrice" in updated_product_data:
                await self._check_and_send_alerts_async(product_id, updated_product_data["currentPrice"])
            else:
                self.logger.warning(f"No updated product data or current price for product {product_id}, skipping alert check.")
            
        except Exception as e:
            self.logger.error(f"Error processing product {product_id}: {traceback.format_exc()}")
            # Do not re-raise here to allow other concurrent tasks to complete.

    async def _update_product_in_firestore_async(self, product_id: str, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Asynchronously update product data in Firestore with new price information."""
        try:
            product_ref = self.firebase.db.collection("products").document(product_id)
            
            current_data_snapshot = await asyncio.to_thread(product_ref.get)
            current_data = current_data_snapshot.to_dict() or {}
            
            new_price = scraped_data["price"] # Already ensured to be float
            
            price_change_value = self.firebase._calculate_price_change(current_data, scraped_data) # This usually gives percentage

            amount_change = new_price - current_data.get("currentPrice", 0)
            direction_value = "same"
            if amount_change > 0:
                direction_value = "up"
            elif amount_change < 0:
                direction_value = "down"
            
            update_data = {
                "name": scraped_data.get("name", current_data.get("name")),
                "image": scraped_data.get("image", current_data.get("image")),
                "currentPrice": new_price,
                "currency": scraped_data.get("currency", current_data.get("currency", "Rs")),
                "url": scraped_data.get("url", current_data.get("url")),
                "lastUpdated": datetime.now(timezone.utc), # Store UTC time
                "priceChange": {
                    "amount": amount_change,
                    "percentage": price_change_value,
                    "direction": direction_value
                },
            }
            
            history = current_data.get("priceHistory", [])
            
            # Always add new price point to history
            history.append({
                "date": datetime.now(timezone.utc), # Store UTC time
                "price": new_price
            })
            
            max_history_entries = int(os.getenv('MAX_PRICE_HISTORY_ENTRIES', 96)) 
            if len(history) > max_history_entries:
                history = history[-max_history_entries:]
            
            update_data["priceHistory"] = history
            
            await asyncio.to_thread(product_ref.set, update_data, merge=True)
            self.logger.info(f"Successfully updated product {product_id} in Firestore. New Price: {new_price}. History length: {len(history)}")
            
            return update_data
        except Exception as e:
            self.logger.error(f"Failed to update product {product_id} in Firestore: {traceback.format_exc()}")
            raise

    async def _check_and_send_alerts_async(self, product_id: str, current_price: float):
        """Asynchronously check for active alerts and send notifications if triggered."""
        try:
            alerts_ref = self.firebase.db.collection("alerts")
            # Query for alerts that are active, for this product, and whose target price is >= current price
            query = alerts_ref.where("productId", "==", product_id) \
                              .where("isActive", "==", True) \
                              .where("targetPrice", ">=", current_price)
            
            alerts_snapshot = await asyncio.to_thread(query.get)
            
            if not alerts_snapshot:
                self.logger.info(f"No active alerts found for product {product_id} at current price {current_price}.")
                return

            for alert in alerts_snapshot:
                alert_data = alert.to_dict()
                alert_id = alert.id # Get the alert ID
                self.logger.info(f"Processing alert {alert_id} for product {product_id}.")
                try:
                    product_data_snapshot = await asyncio.to_thread(
                        self.firebase.db.collection("products").document(product_id).get
                    )
                    product_data = product_data_snapshot.to_dict()

                    if not product_data:
                        self.logger.warning(f"Product {product_id} not found for alert email, skipping alert {alert_id}.")
                        continue

                    await asyncio.to_thread(self._send_alert_email, alert_data, product_data, current_price)
                    
                    await asyncio.to_thread(
                        alert.reference.update,
                        {"isActive": False, "triggeredAt": datetime.now(timezone.utc)}
                    )
                    self.logger.info(f"Alert {alert_id} triggered and deactivated for product {product_id}, user {alert_data.get('userId')}.")
                except Exception as e:
                    self.logger.error(f"Failed to process alert {alert_id} for product {product_id}: {traceback.format_exc()}")
                    continue
                            
        except Exception as e:
            self.logger.error(f"Failed to check alerts for product {product_id}: {traceback.format_exc()}")

    def _send_alert_email(self, alert_data: Dict[str, Any], product_data: Dict[str, Any], current_price: float):
        """Send an email notification using SendGrid API."""
        try:
            product_id = alert_data["productId"]
            user_email = alert_data["email"]
            target_price = alert_data["targetPrice"]
            
            html_content = f"""
            <html>
            <body>
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                        <h2 style="color: #333; margin: 0;">🎉 Price Dropped! Time to Grab Your Deal! 🎉</h2>
                        <p style="color: #666; margin-top: 10px;">The product you've been eyeing just hit your target price!</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
                            <table width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="width: 150px; vertical-align: top; padding-right: 15px;">
                                        <img src="{product_data.get('image', '')}" alt="{product_data.get('name', '')}" width="150" style="max-width: 100%; height: auto; border-radius: 4px;">
                                    </td>
                                    <td style="vertical-align: top;">
                                        <h3 style="color: #007bff; margin-top: 0; margin-bottom: 10px;">{product_data.get('name', '')}</h3>
                                        <p style="margin: 5px 0;"><strong>Current Price:</strong> <span style="color: #28a745; font-size: 1.1em; font-weight: bold;">{product_data.get('currency', 'Rs ')}{current_price}</span></p>
                                        <p style="margin: 5px 0; text-decoration: line-through; color: #777;"><strong>Previous Price:</strong> {product_data.get('currency', 'Rs ')}{product_data.get('previous_price', 'N/A')}</p>
                                        <p style="margin: 5px 0;"><strong>Your Target Price:</strong> {product_data.get('currency', 'Rs ')}{target_price}</p>
                                        <p style="margin-top: 20px;">
                                            <a href="{product_data.get('url', '')}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Claim Your Deal Now!</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px; color: #666;">Don't miss out on this fantastic offer!</p>
                    </div>

                    <div style="background-color: #f7f7f7; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; color: #888;">Keep tracking your favorites at <a href="https://price-drop-alert-seven.vercel.app" style="color: #007bff; text-decoration: none;">PricePulse</a></p>
                        <p style="margin-top: 10px; font-size: 0.8em; color: #aaa;">This is an automated message. Please do not reply directly to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=self.from_email,
                to_emails=user_email,
                subject=f"Price Alert: {product_data.get('name', 'Your tracked product')}",
                html_content=HtmlContent(html_content)
            )
            
            response = self.sendgrid_client.send(message)
            self.logger.info(f"Alert email sent to {user_email} for product {product_id}. Status code: {response.status_code}")
            
        except Exception as e:
            self.logger.error(f"Failed to send alert email to {user_email} for product {product_id}: {traceback.format_exc()}")
            raise

def init_scheduler():
    """Initialize and start the scheduler."""
    scheduler = AlertScheduler()
    scheduler.start()
    # It's important to keep the main thread alive for BackgroundScheduler
    # A common pattern is to simply sleep indefinitely or until a shutdown signal.
    import time
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.scheduler.shutdown() # Gracefully shut down the scheduler
        logging.info("Scheduler shut down.")

# If this file is run directly, it will initialize and start the scheduler
if __name__ == '__main__':
    init_scheduler()