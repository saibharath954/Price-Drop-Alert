import re
import hashlib
import random
import json
import logging
import asyncio # Used for independent sleep in scrape method

from typing import Dict, Any, Optional
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError, Page
from bs4 import BeautifulSoup
import requests

# Configure logging for better insights
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AmazonScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        }
        self.proxies = self._get_proxies() # Placeholder for proxy rotation
        self.max_retries = 3 # Max retries for scraping attempts

    def generate_product_id(self, url: str) -> str:
        """Generate a consistent product ID from URL"""
        asin = self._extract_asin(url)
        if asin:
            return f"AMZ-{asin}"
        # Fallback to URL hash if ASIN not found (less ideal but consistent)
        return f"URL-{hashlib.md5(url.encode()).hexdigest()}"

    async def scrape(self, url: str) -> Dict[str, Any]:
        """Main scraping method with retry and fallback logic."""
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{self.max_retries} to scrape with Playwright for URL: {url}")
                data = await self._scrape_with_playwright(url)
                # Check if essential data is obtained; otherwise, retry or fallback
                if data and all(data.get(key) is not None for key in ["name", "price", "image"]):
                    logger.info(f"Successfully scraped with Playwright for URL: {url}")
                    return data
                else:
                    logger.warning(f"Playwright scraped partial data (Name: {data.get('name')}, Price: {data.get('price')}, Image: {data.get('image')}). Retrying or falling back.")
            except PlaywrightTimeoutError as e:
                logger.warning(f"Playwright TimeoutError on attempt {attempt + 1}: {e}. Retrying with Playwright or falling back.")
            except Exception as e:
                logger.error(f"Playwright failed on attempt {attempt + 1}: {e}. Retrying with Playwright or falling back.")

            if attempt < self.max_retries - 1:
                await asyncio.sleep(random.uniform(2, 5)) # Short delay before retrying Playwright

        logger.info(f"Playwright attempts exhausted. Falling back to requests for URL: {url}")
        # Fallback to requests if Playwright consistently fails or returns incomplete data
        try:
            data = self._scrape_with_requests(url)
            if data and all(data.get(key) is not None for key in ["name", "price", "image"]):
                logger.info(f"Successfully scraped with Requests fallback for URL: {url}")
                return data
            else:
                logger.warning(f"Requests fallback also returned partial data for URL: {url}. Data: {data}")
        except Exception as e:
            logger.error(f"Requests fallback also failed for URL: {url}: {e}")

        logger.error(f"Failed to scrape essential product details for URL: {url} after all attempts.")
        # Return a dictionary with None values for required fields upon ultimate failure
        return {
            "name": None,
            "price": None,
            "image": None,
            "url": url,
            "error": "Failed to scrape essential product details"
        }

    async def _scrape_with_playwright(self, url: str) -> Dict[str, Any]:
        """Scrape using Playwright (more reliable for dynamic content)."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True) # Set headless=False for debugging
            context = await browser.new_context(
                user_agent=self.headers["User-Agent"]
            )
            page = await context.new_page()

            try:
                logger.info(f"Navigating to {url} with Playwright...")
                await page.goto(url, wait_until='domcontentloaded', timeout=30000) # Increased page load timeout

                # A strategic pause to allow critical JS to execute
                await self._sleep_randomly(page, 3, 5)

                # Define robust selectors for key elements
                name_selectors = [
                    '#productTitle',
                    '#title_feature_div #productTitle',
                    'h1.a-size-large.a-spacing-none',
                    '#title span'
                ]

                # Expanded price selectors for more robustness
                price_selectors = [
                    'span.a-price > span.a-offscreen',
                    '#corePrice_feature_div span.a-offscreen',
                    '#priceblock_ourprice',
                    '#priceblock_saleprice',
                    '#tp_price_block_total_price_ww span.a-offscreen', # Found in previous logs
                    '.a-price.a-text-price span.a-offscreen', # Common in "old price" or general listings
                    '#priceAndBuying span.a-offscreen', # Often wraps price
                    '#olp-upd-offered-price', # For Buy Box prices sometimes
                    '[data-a-price-whole]' # Generic attribute for price whole number
                ]

                image_selectors = [
                    'img#landingImage',
                    '#imgTagWrapperId img',
                    '.imgTagWrapper img',
                    '#imageBlock img',
                    '#image-block img',
                    '#imgBlkFront', # Older image selector
                    '#main-image' # Another potential image ID
                ]

                # Attempt to extract data using the robust selectors
                name_element = await self._find_first_matching_element(page, name_selectors, timeout=15000)
                name = await name_element.text_content() if name_element else None
                logger.debug(f"Playwright found name: {name}")

                price_element = await self._find_first_matching_element(page, price_selectors, timeout=10000)
                price = await price_element.text_content() if price_element else None
                logger.debug(f"Playwright found price: {price}")

                image_element = await self._find_first_matching_element(page, image_selectors, timeout=10000)
                image = await image_element.get_attribute('src') if image_element else None
                logger.debug(f"Playwright found image: {image}")

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
        """Helper to find the first visible element from a list of selectors."""
        for selector in selectors:
            try:
                element = page.locator(selector).first
                # Wait for the element to be visible and in the DOM
                await element.wait_for(state='visible', timeout=timeout)
                logger.debug(f"Found element with selector: {selector}")
                return element
            except PlaywrightTimeoutError:
                logger.debug(f"Selector '{selector}' not found or visible within {timeout}ms. Trying next.")
            except Exception as e:
                logger.debug(f"Error checking selector '{selector}': {e}. Trying next.")
        logger.warning(f"No element found for any of the provided selectors within timeout.")
        return None

    def _scrape_with_requests(self, url: str) -> Dict[str, Any]:
        """Fallback scraping with requests + BeautifulSoup (less reliable for dynamic sites)."""
        logger.info(f"Scraping {url} with Requests fallback...")
        try:
            proxies = {}
            if self.proxies:
                proxy = random.choice(self.proxies)
                proxies = {"http": proxy, "https": proxy}
                logger.info(f"Using proxy: {proxy}")

            response = requests.get(url, headers=self.headers, timeout=15, proxies=proxies)
            response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Use the same robust selectors for BeautifulSoup
            name_selectors = [
                '#productTitle', '#title_feature_div #productTitle', 'h1.a-size-large.a-spacing-none', '#title span'
            ]
            price_selectors = [
                'span.a-price > span.a-offscreen', '#corePrice_feature_div span.a-offscreen',
                '#priceblock_ourprice', '#priceblock_saleprice', '#tp_price_block_total_price_ww span.a-offscreen',
                '.a-price.a-text-price span.a-offscreen', '#priceAndBuying span.a-offscreen',
                '#olp-upd-offered-price', '[data-a-price-whole]'
            ]
            image_selectors = [
                'img#landingImage', '#imgTagWrapperId img', '.imgTagWrapper img',
                '#imageBlock img', '#image-block img', '#imgBlkFront', '#main-image'
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
            raise # Re-raise to indicate failure for the main scrape method
        except Exception as e:
            logger.error(f"An unexpected error occurred with Requests for {url}: {e}")
            raise # Re-raise

    def _find_text_from_selectors(self, soup: BeautifulSoup, selectors: list) -> Optional[str]:
        """Helper for BeautifulSoup to find text content from a list of selectors."""
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                logger.debug(f"BS found text from selector: {selector}")
                return element.get_text(strip=True)
        logger.debug(f"BS: No text found for any of the provided selectors.")
        return None

    def _find_attribute_from_selectors(self, soup: BeautifulSoup, selectors: list, attribute: str) -> Optional[str]:
        """Helper for BeautifulSoup to find an attribute from a list of selectors."""
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get(attribute):
                logger.debug(f"BS found attribute '{attribute}' from selector: {selector}")
                return element.get(attribute)
        logger.debug(f"BS: No attribute '{attribute}' found for any of the provided selectors.")
        return None

    def _extract_asin(self, url: str) -> Optional[str]:
        """Extract ASIN from Amazon URL using multiple patterns for robustness."""
        asin_patterns = [
            r'[/dp/|/gp/product/|/products/]([A-Z0-9]{10})',
            r'ref=[^/]+/([A-Z0-9]{10})',
            r'([A-Z0-9]{10})(?:[/?&]|$)'
        ]
        for pattern in asin_patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                return match.group(1)
        logger.warning(f"Could not extract ASIN from URL: {url}")
        return None

    def _clean_price(self, price_str: str) -> Optional[float]:
        """Convert price string to float, returning None if invalid."""
        if not price_str:
            return None
        clean_str = re.sub(r'[^\d.]', '', price_str)
        try:
            return float(clean_str)
        except ValueError:
            logger.warning(f"Could not convert price string '{price_str}' to float.")
            return None

    def _get_proxies(self) -> list:
        """Placeholder for proxy rotation. In production, fetch from a reliable source."""
        # Example: return ["http://user:pass@ip:port", "http://user:pass@ip2:port2"]
        return []

    async def _sleep_randomly(self, page: Page, min_seconds: int, max_seconds: int):
        """Introduce a random delay using Playwright's page.wait_for_timeout."""
        delay = random.uniform(min_seconds, max_seconds)
        logger.info(f"Pausing for {delay:.2f} seconds using Playwright's wait_for_timeout...")
        await page.wait_for_timeout(delay * 1000)