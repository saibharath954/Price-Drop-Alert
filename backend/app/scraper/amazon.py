# backend/app/scraper/amazon.py
import re
import hashlib
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests
import random
import json
from typing import Dict, Any

class AmazonScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.proxies = self._get_proxies()

    def generate_product_id(self, url: str) -> str:
        """Generate a consistent product ID from URL"""
        asin = self._extract_asin(url)
        if asin:
            return f"AMZ-{asin}"
        return f"URL-{hashlib.md5(url.encode()).hexdigest()}"

    async def scrape(self, url: str) -> Dict[str, Any]:
        """Main scraping method with fallback logic"""
        try:
            return await self._scrape_with_playwright(url)
        except Exception as e:
            print(f"Playwright failed, falling back to requests: {e}")
            return self._scrape_with_requests(url)

    async def _scrape_with_playwright(self, url: str) -> Dict[str, Any]:
        """Scrape using Playwright (more reliable but heavier)"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(
                user_agent=self.headers["User-Agent"]
            )
            page = await context.new_page()

            try:
                await page.goto(url, timeout=20000)
                await page.wait_for_timeout(3000)  # Give time for JS to load

                # Wait for title or price selector
                await page.wait_for_selector('span#productTitle, span.a-price, img#landingImage', timeout=10000)

                # Extract content
                name = await page.text_content('span#productTitle')
                price = await page.text_content('span.a-price > span.a-offscreen')
                image = await page.get_attribute('img#landingImage', 'src')


                print(f"[Playwright] Name: {name}, Price: {price}, Image: {image}")

                return {
                    "name": name.strip() if name else None,
                    "price": self._clean_price(price) if price else None,
                    "image": image.strip() if image else None,
                    "url": url
                }
            finally:
                await browser.close()


    def _scrape_with_requests(self, url: str) -> Dict[str, Any]:
        """Fallback scraping with requests + BeautifulSoup"""
        response = requests.get(url, headers=self.headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        name = soup.select_one('span#productTitle')
        price = soup.select_one('span.a-price span.a-offscreen')
        image = soup.select_one('img#landingImage')

        
        return {
            "name": name.get_text().strip() if name else None,
            "price": self._clean_price(price.get_text()) if price else None,
            "image": image.get('src') if image else None,
            "url": url
        }

    def _extract_asin(self, url: str) -> str:
        """Extract ASIN from Amazon URL"""
        asin_pattern = r'(?:[/dp/]|$)([A-Z0-9]{10})'
        match = re.search(asin_pattern, url)
        return match.group(1) if match else None

    def _clean_price(self, price_str: str) -> float:
        """Convert price string to float"""
        return float(re.sub(r'[^\d.]', '', price_str))

    def _get_proxies(self):
        """Optional: Implement proxy rotation if needed"""
        return []