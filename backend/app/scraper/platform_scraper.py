from serpapi import GoogleSearch
import os
import logging
import re
import json
import asyncio
import datetime
from typing import List, Dict, Optional
import time
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Retrieve SERP API key from environment variables
SERP_API_KEY = os.getenv("SERPAPI_API_KEY")

def extract_price_from_text(text: str) -> float:
    """
    Enhanced price extraction with better filtering of irrelevant prices
    and improved pattern matching.
    """
    if not text:
        return 0.0
    
    # Clean the text first
    text = text.replace('\n', ' ').replace('\t', ' ')
    
    # Enhanced ignore patterns (regex format)
    ignore_patterns = [
        r'offer from ₹\d+',
        r'\d+ out of \d+ stars',
        r'courier partners',
        r'delivery by',
        r'sold by',
        r'order processed by',
        r'free delivery',
        r'only \d+ left',
        r'\d+% off',
        r'save ₹\d+',
        r'₹\d+\s*saved',
        r'was ₹\d+',
        r'mrp ₹\d+',
        r'list price ₹\d+'
    ]
    
    # Remove ignored patterns first
    clean_text = text
    for pattern in ignore_patterns:
        clean_text = re.sub(pattern, '', clean_text, flags=re.IGNORECASE)
    
    # Prioritized price patterns (most specific first)
    price_patterns = [
        # Current price with context keywords
        r'(?:current\s*price|selling\s*price|deal\s*price|special\s*price|offer\s*price|now)\s*:?\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)',
        r'(?:price|cost)\s*:?\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)',
        
        # Discounted price patterns (current price in discount context)
        r'(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)\s*(?:was|instead\s*of|original)',
        r'(?:was|originally)\s*(?:₹|Rs\.?|INR)\s*[\d,]+\s*(?:now|today)?\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)',
        
        # Price with context words
        r'(?:only|just|from)\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)',
        r'(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)\s*(?:only|onwards|upwards)',
        
        # Standard price patterns
        r'₹\s*([\d,]+(?:\.\d{2})?)',
        r'Rs\.?\s*([\d,]+(?:\.\d{2})?)',
        r'INR\s*([\d,]+(?:\.\d{2})?)',
    ]
    
    found_prices = []
    
    for pattern in price_patterns:
        matches = re.findall(pattern, clean_text, re.IGNORECASE)
        for match in matches:
            try:
                # Clean and convert the price
                price_str = match.replace(',', '')
                price = float(price_str)
                # Validate reasonable price range
                if 10 <= price <= 1000000:  # ₹10 to ₹10 lakh
                    found_prices.append(price)
            except (ValueError, TypeError):
                continue
    
    # Return the most appropriate price
    if found_prices:
        # If multiple prices found, prefer the lowest (usually current price)
        return min(found_prices)
    
    return 0.0

def scrape_direct_price(url: str, max_retries: int = 2) -> float:
    """
    Robust direct scraping with retries, better selectors, and error handling.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
    }
    
    domain = urlparse(url).netloc.lower()
    
    for attempt in range(max_retries):
        try:
            # Random delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
            
            # Handle different status codes
            if response.status_code == 404:
                logger.warning(f"Product page not found (404): {url}")
                return 0.0
            elif response.status_code == 403:
                logger.warning(f"Access forbidden (403): {url}")
                return 0.0
            elif response.status_code != 200:
                logger.warning(f"HTTP {response.status_code} for {url}")
                return 0.0
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Platform-specific selectors with more comprehensive coverage
            price = 0.0
            
            if "flipkart.com" in domain:
                price = extract_flipkart_price(soup)
            elif "amazon." in domain:  # Covers both .in and .com
                price = extract_amazon_price(soup)
            elif "meesho.com" in domain:
                price = extract_meesho_price(soup)
            
            if price > 0:
                return price
            
            # Fallback: Try to extract from JSON-LD structured data
            price = extract_json_ld_price(soup)
            if price > 0:
                return price
            
            # Final fallback: Extract from page text
            page_text = soup.get_text()
            price = extract_price_from_text(page_text)
            if price > 0:
                return price
            
            return 0.0
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt + 1} failed for {url}: {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"Failed to scrape {url} after {max_retries} attempts")
                return 0.0
            time.sleep(random.uniform(3, 6))  # Longer delay between retries
    
    return 0.0

def extract_flipkart_price(soup: BeautifulSoup) -> float:
    """Extract price specifically from Flipkart pages"""
    price_selectors = [
        # Current price selectors (most reliable)
        {'class': 'Nx9bqj CxhGGd'}, 
        {'class': '_30jeq3 _16Jk6d'},  # Main price
        {'class': '_30jeq3'},  # Current price
        {'class': '_16Jk6d'},  # Discounted price
        {'class': '_25b18c'},  # Price container
        {'class': '_3I9_wc _27UcVY'},  # Price text
        {'class': '_1vC4OE _3qQ9m1'},  # Another price class
        {'class': 'CEmiEU'},  # Newer price class
        {'class': '_1_TelU'},  # Price display
    ]
    
    for selector in price_selectors:
        elements = soup.find_all(['span', 'div'], selector)
        for element in elements:
            if element:
                price_text = element.get_text(strip=True)
                price = extract_price_from_text(price_text)
                if price > 0:
                    return price
    
    return 0.0

def extract_amazon_price(soup: BeautifulSoup) -> float:
    """Extract price specifically from Amazon pages"""
    price_selectors = [
        # Amazon price selectors
        {'class': 'a-price-whole'},
        {'class': 'a-price.a-price-normal'},
        {'class': 'priceToPay'},
        {'class': 'a-offscreen'},
        {'id': 'priceblock_ourprice'},
        {'id': 'priceblock_dealprice'},
        {'class': 'reinventPricePriceToPayMargin'},
        {'class': 'a-price-range'},
        {'class': 'apexPriceToPay'},
        {'class': 'a-price.reinventPricePriceToPayMargin.priceToPay'},
    ]
    
    for selector in price_selectors:
        if 'id' in selector:
            element = soup.find(attrs={'id': selector['id']})
        else:
            element = soup.find(attrs={'class': selector['class']})
        
        if element:
            price_text = element.get_text(strip=True)
            price = extract_price_from_text(price_text)
            if price > 0:
                return price
    
    # Amazon specific: Look for price in span with specific data attributes
    price_spans = soup.find_all('span', {'data-a-size': 'xl'})
    for span in price_spans:
        price_text = span.get_text(strip=True)
        if '₹' in price_text or 'Rs' in price_text:
            price = extract_price_from_text(price_text)
            if price > 0:
                return price
    
    return 0.0

def extract_meesho_price(soup: BeautifulSoup) -> float:
    """Extract price specifically from Meesho pages"""
    price_selectors = [
        {'class': 'sc-eDvSVe'},
        {'class': 'bpVlUH'},
        {'class': 'FinalPrice'},
        {'class': 'SellingPrice'},
        {'class': 'sc-dznXNo'},
        {'class': 'PriceText'},
    ]
    
    for selector in price_selectors:
        elements = soup.find_all(['span', 'div', 'p'], selector)
        for element in elements:
            if element:
                price_text = element.get_text(strip=True)
                price = extract_price_from_text(price_text)
                if price > 0:
                    return price
    
    return 0.0

def extract_json_ld_price(soup: BeautifulSoup) -> float:
    """Extract price from JSON-LD structured data"""
    try:
        scripts = soup.find_all('script', {'type': 'application/ld+json'})
        for script in scripts:
            if script and script.string:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, list):
                        data = data[0]
                    
                    # Look for offers in the structured data
                    offers = data.get('offers', {})
                    if isinstance(offers, list) and offers:
                        offers = offers[0]
                    
                    price = offers.get('price') or offers.get('lowPrice')
                    if price:
                        try:
                            return float(str(price).replace(',', ''))
                        except (ValueError, TypeError):
                            pass
                    
                    # Also check for priceSpecification
                    price_spec = offers.get('priceSpecification', {})
                    if price_spec:
                        price = price_spec.get('price')
                        if price:
                            try:
                                return float(str(price).replace(',', ''))
                            except (ValueError, TypeError):
                                pass
                                
                except json.JSONDecodeError:
                    continue
                except (KeyError, TypeError, AttributeError):
                    continue
    except Exception as e:
        logger.debug(f"Error extracting JSON-LD price: {e}")
    
    return 0.0

def get_product_price(result: Dict) -> float:
    """
    Smart hybrid price extraction with validation and fallback logic.
    """
    # First try to extract from snippet/title
    snippet_text = f"{result.get('title', '')} {result.get('snippet', '')}"
    snippet_price = extract_price_from_text(snippet_text)
    
    # Validate snippet price
    if 10 <= snippet_price <= 1000000:  # Reasonable range
        # Check if snippet contains multiple prices
        price_matches = re.findall(r'(?:₹|Rs\.?|INR)\s*[\d,]+', snippet_text)
        if len(price_matches) == 1:  # Only proceed if single price found
            logger.info(f"Found price {snippet_price} from snippet for: {result.get('title', '')[:50]}")
            return snippet_price
    
    # Fall back to direct scraping
    url = result.get('link', '')
    if url:
        logger.info(f"Attempting direct scraping for: {url}")
        scraped_price = scrape_direct_price(url)
        if scraped_price > 0:
            logger.info(f"Successfully scraped price {scraped_price} from: {url}")
            return scraped_price
    
    return 0.0

def search_other_platforms(query: str) -> List[Dict]:
    """
    Searches for products on Flipkart, Meesho, and Amazon using SerpAPI,
    with enhanced search strategies and better result processing.
    It stops once 3 valid products are found.
    """
    if not SERP_API_KEY:
        logger.error("SERPAPI_API_KEY is not set in environment variables.")
        return []

    all_products = []
    
    # Multiple search strategies for better coverage
    search_queries = [
        f"{query} site:flipkart.com OR site:meesho.com OR site:amazon.in",
        f'"{query}" site:flipkart.com OR site:meesho.com OR site:amazon.in',
        f"{query} buy online site:flipkart.com OR site:meesho.com OR site:amazon.in",
        f"{query} buy online india",
        f"{query} price comparison flipkart meesho amazon",
    ]
    
    # Keep track of unique products by URL to avoid duplicates in the `all_products` list
    seen_urls = set()

    for i, search_query in enumerate(search_queries):
        # Stop if we already have 3 valid products
        if len(all_products) >= 3:
            logger.info("Found 3 valid products, stopping further search queries.")
            break

        try:
            logger.info(f"Executing search query {i+1}/{len(search_queries)}: {search_query}")
            
            params = {
                "q": search_query,
                "engine": "google",
                "api_key": SERP_API_KEY,
                "num": 20,  # Get more results per query
                "location": "India",
                "gl": "in",
                "hl": "en"
            }

            search = GoogleSearch(params)
            results = search.get_dict()

            if "error" in results:
                logger.error(f"SerpAPI Error: {results['error']}")
                continue

            # Process organic results
            organic_results = results.get("organic_results", [])
            logger.info(f"Found {len(organic_results)} organic results for query: {search_query}")
            
            for result in organic_results:
                if len(all_products) >= 3: # Check again after processing each result
                    break 
                try:
                    product = process_search_result(result)
                    if product and product['url'] not in seen_urls:
                        all_products.append(product)
                        seen_urls.add(product['url'])
                except Exception as e:
                    logger.error(f"Error processing organic result: {e}")
                    continue
            
            # Process shopping results if still needed
            if len(all_products) < 3:
                shopping_results = results.get("shopping_results", [])
                logger.info(f"Found {len(shopping_results)} shopping results")
                
                for result in shopping_results:
                    if len(all_products) >= 3: # Check again after processing each result
                        break
                    try:
                        product = process_shopping_result(result)
                        if product and product['url'] not in seen_urls:
                            all_products.append(product)
                            seen_urls.add(product['url'])
                    except Exception as e:
                        logger.error(f"Error processing shopping result: {e}")
                        continue
            
            # Add delay between requests to avoid rate limiting
            time.sleep(1.0)
            
        except Exception as e:
            logger.error(f"Error in search query '{search_query}': {e}")
            continue
    
    # Deduplicate and prioritize products (though the stopping condition helps here)
    # The deduplicate_and_prioritize function will ensure the best 3 are selected
    # if more than 3 were collected before the loop broke.
    return deduplicate_and_prioritize(all_products)

def process_search_result(result: Dict) -> Optional[Dict]:
    """Enhanced result processing with better error handling"""
    try:
        url = result.get('link', '')
        if not url:
            return None
        
        # Skip known bad URLs
        skip_patterns = [
            '/gp/', '/help/', '/customer-service/', '/about/', '/careers/',
            '/contact', '/support', '/policy', '/terms', '/privacy',
            '/live/', '/vdp/', '/stores/', # Added Amazon specific non-product pages
            '/refurbished/' # Often for refurbished products, might not want to include
        ]
        if any(pattern in url.lower() for pattern in skip_patterns):
            return None
            
        title = result.get('title', '').strip()
        if not title:
            return None
            
        platform = get_platform_from_url(url)
        if platform == 'Other':
            return None
        
        product = {
            'title': title,
            'url': url,
            'platform': platform,
            'snippet': result.get('snippet', '').strip(),
            'image': result.get('thumbnail') or result.get('image') or f'/logos/{platform.lower()}.png',
            'source': 'organic',
            'extracted_at': datetime.datetime.utcnow().isoformat()
        }
        
        # Get price with enhanced error handling
        try:
            product['price'] = get_product_price(result)
        except Exception as e:
            logger.error(f"Error getting price for {url}: {e}")
            product['price'] = 0.0
        
        # Skip products with no price or unreasonable price
        if product['price'] <= 0 or not (10 <= product['price'] <= 1000000):
            logger.debug(f"Skipping product with invalid price: {title[:50]} - Price: {product['price']}")
            return None
            
        logger.info(f"Successfully processed product: {title[:50]} - ₹{product['price']}")
        return product
        
    except Exception as e:
        logger.error(f"Error processing search result: {e}")
        return None

def process_shopping_result(result: Dict) -> Optional[Dict]:
    """Enhanced shopping result processor with better price extraction and validation."""
    try:
        title = result.get("title", "").strip()
        link = result.get("link", "").strip()
        
        # Basic validation
        if not title or not link:
            return None
        
        # Determine platform with additional validation
        platform = get_platform_from_url(link)
        if platform == "Other":
            return None
        
        # Get all available price information
        price_str = result.get("price", "")
        extracted_price = extract_price_from_text(price_str)
        
        # Additional price extraction from other fields if needed
        if extracted_price <= 0:
            extracted_price = extract_price_from_text(
                f"{title} {result.get('snippet', '')} {price_str}"
            )
        
        # Validate price is reasonable
        if extracted_price <= 0 or extracted_price > 1000000:  # ₹10 lakh upper limit
            return None
        
        # Get image with better fallback logic
        image_url = (
            result.get("thumbnail") or 
            result.get("image") or 
            f"/logos/{platform.lower()}.png"
        )
        
        # Build product dictionary
        product = {
            "title": title,
            "url": link,
            "platform": platform,
            "snippet": result.get("snippet", "").strip(),
            "image": image_url,
            "price": extracted_price,
            "source": "shopping",
            "extracted_at": datetime.datetime.utcnow().isoformat()
        }
        
        # Additional platform-specific data if available
        if platform == "Flipkart":
            product["rating"] = result.get("rating")
        elif platform == "Amazon":
            product["prime"] = "prime" in title.lower() or "prime" in (result.get("snippet", "").lower())
        
        return product
        
    except Exception as e:
        logger.error(f"Error processing shopping result: {e}")
        return None

def get_platform_from_url(url: str) -> str:
    """Determine platform from URL."""
    url_lower = url.lower()
    
    if "flipkart.com" in url_lower:
        return "Flipkart"
    elif "meesho.com" in url_lower or "meesho.in" in url_lower:
        return "Meesho"
    elif "amazon.in" in url_lower or "amazon.com" in url_lower:
        return "Amazon"
    else:
        return "Other"

def deduplicate_and_prioritize(products: List[Dict]) -> List[Dict]:
    """
    Deduplicate products and select the best 3 products,
    prioritizing one from each platform.
    """
    if not products:
        return []
    
    # Group by platform
    platforms = {
        "Flipkart": [],
        "Meesho": [],
        "Amazon": []
    }
    
    # Remove duplicates by URL and group by platform
    seen_urls = set()
    for product in products:
        url = product.get("url", "")
        if url and url not in seen_urls:
            platform = product.get("platform", "")
            if platform in platforms:
                platforms[platform].append(product)
                seen_urls.add(url)
    
    # Sort products within each platform by relevance
    for platform_key in platforms: # Renamed variable to avoid conflict with `platform` module
        platforms[platform_key] = sorted(
            platforms[platform_key],
            key=lambda x: (
                x.get("price", 0) > 0,  # Prefer products with price
                x.get("source") == "shopping", # Prefer shopping results as they are usually more accurate
                len(x.get("title", "")),  # Prefer longer titles (more detailed)
                -x.get("price", float('inf'))  # Prefer lower prices (negative for ascending sort)
            ),
            reverse=True # Sort in descending order to get best at the top
        )
    
    # Select best products from each platform
    final_products = []
    
    # First, try to get one from each major platform: Amazon, Flipkart, then Meesho
    for platform_name in ["Amazon", "Flipkart", "Meesho"]:
        if platforms[platform_name] and len(final_products) < 3:
            best_product = platforms[platform_name][0]
            if best_product['url'] not in [p['url'] for p in final_products]: # Ensure no duplicate URLs in final list
                final_products.append(best_product)
                logger.info(f"Selected product from {platform_name}: {best_product['title'][:50]}...")
    
    # If we don't have 3 products yet, fill with remaining best products, ensuring no duplicates
    if len(final_products) < 3:
        all_remaining = []
        for platform_name in platforms:
            # Add all products from the platform that haven't been selected yet
            all_remaining.extend([p for p in platforms[platform_name] if p['url'] not in [fp['url'] for fp in final_products]])
        
        # Sort remaining by quality
        all_remaining.sort(
            key=lambda x: (
                x.get("price", 0) > 0,
                x.get("source") == "shopping",
                len(x.get("title", "")),
                -x.get("price", float('inf'))
            ),
            reverse=True
        )
        
        for product in all_remaining:
            if len(final_products) >= 3:
                break
            final_products.append(product)
            logger.info(f"Added additional product from {product['platform']}: {product['title'][:50]}...")
    
    logger.info(f"Final selection: {len(final_products)} products")
    return final_products

def search_specific_platform(query: str, platform: str) -> List[Dict]:
    """
    Search for products on a specific platform.
    
    Args:
        query (str): Search query
        platform (str): Platform name (Flipkart, Meesho, Amazon)
        
    Returns:
        List[Dict]: List of products from the specified platform
    """
    platform_sites = {
        "Flipkart": "flipkart.com",
        "Meesho": "meesho.com",
        "Amazon": "amazon.in"
    }
    
    if platform not in platform_sites:
        return []
    
    site = platform_sites[platform]
    search_query = f"{query} site:{site}"
    
    try:
        params = {
            "q": search_query,
            "engine": "google",
            "api_key": SERP_API_KEY,
            "num": 10,
            "location": "India",
            "gl": "in",
            "hl": "en"
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            logger.error(f"SerpAPI Error for {platform}: {results['error']}")
            return []

        products = []
        for result in results.get("organic_results", []):
            product = process_search_result(result)
            if product and product["platform"] == platform:
                products.append(product)
        
        return products
        
    except Exception as e:
        logger.error(f"Error searching {platform}: {e}")
        return []

# Additional utility function for testing price extraction
def test_price_extraction(text: str) -> None:
    """Test the price extraction function with sample text"""
    price = extract_price_from_text(text)
    print(f"Text: {text}")
    print(f"Extracted price: ₹{price}")
    print("-" * 50)

if __name__ == "__main__":
    # Test price extraction with various formats
    test_texts = [
        "Price: ₹299.00 only",
        "Special offer ₹199 was ₹399",
        "Current price: Rs 150",
        "₹89 + ₹40 delivery",
        "Deal price: ₹1,299",
        "From ₹99 onwards"
    ]
    
    for text in test_texts:
        test_price_extraction(text)