# backend/app/scraper/amazon.py
import re
import hashlib
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError, Page # Import Page
from bs4 import BeautifulSoup
import requests
import random
import json
from typing import Dict, Any, Optional
import logging

# Configure logging for better insights
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AmazonScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br", # Added for better performance and to mimic real browser
            "Connection": "keep-alive" # Added for better performance
        }
        # In a real-world scenario, you'd fetch proxies from a reliable source.
        # For demonstration, it's an empty list.
        self.proxies = self._get_proxies()
        self.max_retries = 3 # Max retries for scraping attempts

    def generate_product_id(self, url: str) -> str:
        """Generate a consistent product ID from URL"""
        asin = self._extract_asin(url)
        if asin:
            return f"AMZ-{asin}"
        # Fallback to URL hash if ASIN not found
        return f"URL-{hashlib.md5(url.encode()).hexdigest()}"

    async def scrape(self, url: str) -> Dict[str, Any]:
        """Main scraping method with retry and fallback logic"""
        # Initialize page outside the loop if you want to use it for sleep between attempts.
        # However, it's safer to ensure page is always part of a new browser context for retries.
        # So, the sleep will be a simple asyncio.sleep for the main `scrape` retry loop.

        for attempt in range(self.max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{self.max_retries} to scrape with Playwright for URL: {url}")
                # _scrape_with_playwright now returns data or raises an exception
                data = await self._scrape_with_playwright(url)
                if data and all(data.get(key) for key in ["name", "price", "image"]):
                    logger.info(f"Successfully scraped with Playwright for URL: {url}")
                    return data
                else:
                    logger.warning(f"Playwright scraped partial data. Retrying or falling back. Data: {data}")
            except PlaywrightTimeoutError as e:
                logger.warning(f"Playwright TimeoutError on attempt {attempt + 1}: {e}. Retrying with Playwright or falling back.")
            except Exception as e:
                logger.error(f"Playwright failed on attempt {attempt + 1}: {e}. Retrying with Playwright or falling back.")

            if attempt < self.max_retries - 1:
                # Use asyncio.sleep here, as `page` is not available at this level
                import asyncio
                await asyncio.sleep(random.uniform(2, 5)) # Short delay before retrying Playwright

        logger.info(f"Playwright attempts exhausted. Falling back to requests for URL: {url}")
        # Fallback to requests if Playwright consistently fails or returns incomplete data
        try:
            data = self._scrape_with_requests(url)
            if data and all(data.get(key) for key in ["name", "price", "image"]):
                logger.info(f"Successfully scraped with Requests fallback for URL: {url}")
                return data
            else:
                logger.warning(f"Requests fallback also returned partial data for URL: {url}. Data: {data}")
        except Exception as e:
            logger.error(f"Requests fallback also failed for URL: {url}: {e}")

        logger.error(f"Failed to scrape product details for URL: {url} after all attempts.")
        return {
            "name": None,
            "price": None,
            "image": None,
            "url": url,
            "error": "Failed to scrape product details"
        }

    async def _scrape_with_playwright(self, url: str) -> Dict[str, Any]:
        """Scrape using Playwright with improved element selection and waiting"""
        async with async_playwright() as p:
            # Launch in headless mode for production, headful for debugging (headless=False)
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=self.headers["User-Agent"]
            )
            page = await context.new_page()

            try:
                logger.info(f"Navigating to {url} with Playwright...")
                await page.goto(url, wait_until='domcontentloaded', timeout=30000) # Increased page load timeout

                # Introduce a slightly longer wait for dynamic content, but not too long
                # Use the new _sleep_randomly that accepts 'page'
                await self._sleep_randomly(page, 3, 5) # Sleep after initial load

                # **IMPROVED SELECTORS & WAITING LOGIC**
                # Prioritize direct text content for robustness.
                # Use a list of potential selectors for each element to handle variations.

                name_selectors = [
                    '#productTitle', # Most common
                    '#title_feature_div #productTitle', # Specific to title section
                    'h1.a-size-large.a-spacing-none', # Alternative heading for title
                    '#title span' # Broader span within title
                ]

                price_selectors = [
                    'span.a-price > span.a-offscreen', # Common price display
                    '#corePrice_feature_div span.a-offscreen', # More specific price container
                    '#priceblock_ourprice', # Older price block ID
                    '#priceblock_saleprice', # Sale price ID
                    '#tp_price_block_total_price_ww span.a-offscreen', # From your log, specifically for tp_price_block
                    # Additional selectors to try for price if others fail
                    '#priceAndBuying span.a-price > span.a-offscreen',
                    '.a-section.a-spacing-micro span.a-price > span.a-offscreen',
                    '#current_price_display', # Sometimes a direct display
                    '#price_inside_buybox', # Price inside the buybox
                ]

                image_selectors = [
                    'img#landingImage', # Most common
                    '#imgTagWrapperId img', # Image wrapper ID
                    '.imgTagWrapper img', # Class for image wrapper
                    '#imageBlock img', # Another common image block
                    '#image-block img', # Another common image block variant
                ]

                # Try to get the name first, as it's a good indicator of page content
                name_element = await self._find_first_matching_element(page, name_selectors, timeout=15000)
                name = await name_element.text_content() if name_element else None
                logger.debug(f"Playwright found name: {name}")

                price_element = await self._find_first_matching_element(page, price_selectors, timeout=10000)
                price = await price_element.text_content() if price_element else None
                logger.debug(f"Playwright found price: {price}")

                image_element = await self._find_first_matching_element(page, image_selectors, timeout=10000)
                image = await image_element.get_attribute('src') if image_element else None
                logger.debug(f"Playwright found image: {image}")

                logger.info(f"[Playwright] Scraped - Name: {name}, Price: {price}, Image: {image}")

                return {
                    "name": name.strip() if name else None,
                    "price": self._clean_price(price) if price else None,
                    "image": image.strip() if image else None,
                    "url": url
                }
            except PlaywrightTimeoutError as e:
                logger.error(f"Playwright timed out while scraping {url}: {e}")
                raise # Re-raise to trigger fallback/retry logic
            except Exception as e:
                logger.error(f"An unexpected error occurred with Playwright for {url}: {e}")
                raise # Re-raise to trigger fallback/retry logic
            finally:
                await browser.close()

    async def _find_first_matching_element(self, page: Page, selectors: list, timeout: int = 10000) -> Optional[Any]:
        for selector in selectors:
            try:
                element = page.locator(selector).first
                await element.wait_for(state='visible', timeout=timeout)
                logger.debug(f"Found element with selector: {selector}")
                return element
            except PlaywrightTimeoutError:
                logger.debug(f"Selector '{selector}' not found within {timeout}ms. Trying next.")
            except Exception as e:
                logger.debug(f"Error checking selector '{selector}': {e}. Trying next.")
        logger.warning(f"No element found for any of the provided selectors within timeout.")
        return None

    def _scrape_with_requests(self, url: str) -> Dict[str, Any]:
        """Fallback scraping with requests + BeautifulSoup"""
        logger.info(f"Scraping {url} with Requests fallback...")
        try:
            proxies = {}
            if self.proxies:
                proxy = random.choice(self.proxies)
                proxies = {"http": proxy, "https": proxy}
                logger.info(f"Using proxy: {proxy}")

            response = requests.get(url, headers=self.headers, timeout=15, proxies=proxies)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            name_selectors = [
                '#productTitle',
                '#title_feature_div #productTitle',
                'h1.a-size-large.a-spacing-none',
                '#title span'
            ]

            price_selectors = [
                'span.a-price > span.a-offscreen',
                '#corePrice_feature_div span.a-offscreen',
                '#priceblock_ourprice',
                '#priceblock_saleprice',
                '#tp_price_block_total_price_ww span.a-offscreen',
                '#priceAndBuying span.a-price > span.a-offscreen',
                '.a-section.a-spacing-micro span.a-price > span.a-offscreen',
                '#current_price_display',
                '#price_inside_buybox',
            ]

            image_selectors = [
                'img#landingImage',
                '#imgTagWrapperId img',
                '.imgTagWrapper img',
                '#imageBlock img',
                '#image-block img',
            ]

            name = self._find_text_from_selectors(soup, name_selectors)
            price = self._find_text_from_selectors(soup, price_selectors)
            image = self._find_attribute_from_selectors(soup, image_selectors, 'src')

            logger.info(f"[Requests] Scraped - Name: {name}, Price: {price}, Image: {image}")

            return {
                "name": name.strip() if name else None,
                "price": self._clean_price(price) if price else None,
                "image": image.strip() if image else None,
                "url": url
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests failed to fetch {url}: {e}")
            return {
                "name": None,
                "price": None,
                "image": None,
                "url": url,
                "error": f"Requests failed: {e}"
            }
        except Exception as e:
            logger.error(f"An unexpected error occurred with Requests for {url}: {e}")
            return {
                "name": None,
                "price": None,
                "image": None,
                "url": url,
                "error": f"Unexpected error with Requests: {e}"
            }

    def _find_text_from_selectors(self, soup: BeautifulSoup, selectors: list) -> Optional[str]:
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                logger.debug(f"BS found text from selector: {selector}")
                return element.get_text(strip=True)
        logger.debug(f"BS: No text found for any of the provided selectors.")
        return None

    def _find_attribute_from_selectors(self, soup: BeautifulSoup, selectors: list, attribute: str) -> Optional[str]:
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get(attribute):
                logger.debug(f"BS found attribute '{attribute}' from selector: {selector}")
                return element.get(attribute)
        logger.debug(f"BS: No attribute '{attribute}' found for any of the provided selectors.")
        return None

    def _extract_asin(self, url: str) -> Optional[str]:
        """Extract ASIN from Amazon URL"""
        asin_patterns = [
            r'[/dp/|/gp/product/|/products/]([A-Z0-9]{10})', # Common patterns
            r'ref=[^/]+/([A-Z0-9]{10})', # ASIN in ref parameter
            r'([A-Z0-9]{10})(?:[/?&]|$)' # General ASIN in path
        ]

        for pattern in asin_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                return match.group(1)
        logger.warning(f"Could not extract ASIN from URL: {url}")
        return None

    def _clean_price(self, price_str: str) -> Optional[float]:
        """Convert price string to float, return None if invalid"""
        if not price_str:
            return None
        clean_str = re.sub(r'[^\d.]', '', price_str)
        try:
            return float(clean_str)
        except ValueError:
            logger.warning(f"Could not convert price string '{price_str}' to float.")
            return None

    def _get_proxies(self) -> list:
        """
        Implement proxy rotation if needed.
        In a production environment, you would fetch these from a proxy provider.
        """
        return []

    # Modified _sleep_randomly to accept a Page object
    async def _sleep_randomly(self, page: Page, min_seconds: int, max_seconds: int):
        """Introduce a random delay using Playwright's page.wait_for_timeout."""
        delay = random.uniform(min_seconds, max_seconds)
        logger.info(f"Pausing for {delay:.2f} seconds using Playwright's wait_for_timeout...")
        await page.wait_for_timeout(delay * 1000) # Playwright's wait_for_timeout expects ms