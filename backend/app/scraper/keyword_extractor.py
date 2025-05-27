import google.generativeai as genai
import os
import logging
import re
from typing import Optional, List

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Configure logging for better error tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure the Gemini API with your API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def extract_brand_model(title: str) -> str:
    """
    Extracts the brand and model from a given product title using multiple approaches.
    
    Args:
        title (str): The product title from which to extract brand and model.
        
    Returns:
        str: A string containing the extracted brand and model information
    """
    if not title or not title.strip():
        return "unknown product"
    
    # First try Gemini API
    gemini_result = extract_with_gemini(title)
    if gemini_result and gemini_result.lower() != 'none':
        return gemini_result
    
    # Fallback to rule-based extraction
    rule_based_result = extract_with_rules(title)
    if rule_based_result:
        return rule_based_result
    
    # Final fallback - clean the original title
    return clean_title_fallback(title)

def extract_with_gemini(title: str) -> Optional[str]:
    """
    Extract brand and model using Gemini API with enhanced prompting.
    
    Args:
        title (str): Product title
        
    Returns:
        Optional[str]: Extracted keywords or None if failed
    """
    try:
        # Enhanced prompt with better instructions and examples
        prompt = f"""
Extract the most important search keywords from this product title for finding similar products on e-commerce sites.

Instructions:
1. Focus on: Brand name, Model name/number, Product type, Key specifications
2. Remove: Generic words, promotional text, seller information, quantities
3. Keep: Technical specifications that help identify the specific product
4. Output should be 3-6 keywords maximum

Examples:
Input: "Samsung Galaxy M14 5G (Icy Silver, 128GB) with 50MP Camera"
Output: Samsung Galaxy M14 5G 128GB

Input: "boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds"
Output: boAt Airdopes 141 Bluetooth earbuds

Input: "Xiaomi Redmi Note 12 Pro 5G (Glacier Blue, 8GB RAM, 128GB Storage)"
Output: Xiaomi Redmi Note 12 Pro 5G 8GB 128GB

Now extract keywords from:
"{title}"

Output only the keywords, nothing else:
"""
        
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content with optimized parameters
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Very low temperature for consistency
                max_output_tokens=30,  # Limit to prevent verbosity
                top_p=0.8,
                top_k=10
            )
        )
        
        # Extract and clean the result
        result = response.text.strip()
        
        # Validate the result
        if (result.lower() in ['none', 'unknown', 'not found', ''] or 
            len(result.split()) < 2 or 
            len(result) > 100):
            logger.warning(f"Gemini returned invalid result: '{result}' for title: '{title[:50]}...'")
            return None
        
        logger.info(f"Gemini extracted: '{result}' from title: '{title[:50]}...'")
        return result
        
    except Exception as e:
        logger.error(f"Error with Gemini API for title '{title[:50]}...': {e}")
        return None

def extract_with_rules(title: str) -> Optional[str]:
    """
    Rule-based keyword extraction as fallback.
    
    Args:
        title (str): Product title
        
    Returns:
        Optional[str]: Extracted keywords or None
    """
    try:
        # Common brand patterns in India
        brand_patterns = [
            r'\b(Samsung|Apple|Xiaomi|Redmi|OnePlus|Vivo|Oppo|Realme|Motorola|Nokia|Honor|Huawei)\b',
            r'\b(boAt|JBL|Sony|Bose|Sennheiser|Audio-Technica|Skullcandy)\b',
            r'\b(HP|Dell|Lenovo|Asus|Acer|MSI|Apple)\b',
            r'\b(Nike|Adidas|Puma|Reebok|Under Armour|New Balance)\b',
            r'\b(LG|Whirlpool|IFB|Bosch|Godrej|Haier|Panasonic|Voltas)\b'
        ]
        
        # Model/number patterns
        model_patterns = [
            r'\b([A-Z0-9]{2,}[-\s]?[A-Z0-9]+)\b',  # Like "M14", "Note-12", "AirPods-Pro"
            r'\b(Galaxy|iPhone|Redmi|Note|Pro|Max|Plus|Mini|Air|Studio)\s+([A-Z0-9]+)\b',
            r'\b([0-9]+GB|[0-9]+TB|[0-9]+MP|[0-9]+mAh)\b'  # Technical specs
        ]
        
        # Extract brand
        brand = None
        for pattern in brand_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                brand = match.group(1)
                break
        
        # Extract model and specs
        models = []
        for pattern in model_patterns:
            matches = re.findall(pattern, title, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    models.extend([m for m in match if m])
                else:
                    models.append(match)
        
        # Extract product category
        category_patterns = [
            r'\b(smartphone|phone|mobile|tablet|laptop|earbuds|headphones|watch|tv|camera)\b',
            r'\b(shoes|shirt|jacket|dress|jeans|t-shirt|hoodie)\b',
            r'\b(refrigerator|washing machine|ac|air conditioner|microwave)\b'
        ]
        
        category = None
        for pattern in category_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                category = match.group(1)
                break
        
        # Combine results
        keywords = []
        if brand:
            keywords.append(brand)
        if models:
            keywords.extend(models[:2])  # Take first 2 models
        if category and category not in ' '.join(keywords).lower():
            keywords.append(category)
        
        if len(keywords) >= 2:
            result = ' '.join(keywords)
            logger.info(f"Rule-based extracted: '{result}' from title: '{title[:50]}...'")
            return result
        
        return None
        
    except Exception as e:
        logger.error(f"Error in rule-based extraction: {e}")
        return None

def clean_title_fallback(title: str) -> str:
    """
    Final fallback - clean the original title by removing common noise words.
    
    Args:
        title (str): Original product title
        
    Returns:
        str: Cleaned title
    """
    # Words to remove
    noise_words = [
        'buy', 'online', 'best', 'price', 'offer', 'sale', 'discount', 'deal',
        'free', 'shipping', 'delivery', 'india', 'original', 'genuine',
        'pack', 'combo', 'set', 'piece', 'pcs', 'units', 'box',
        'with', 'and', 'or', 'for', 'in', 'on', 'at', 'by', 'from', 'to',
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]
    
    # Remove special characters except spaces and alphanumeric
    cleaned = re.sub(r'[^\w\s]', ' ', title)
    
    # Split into words and filter
    words = cleaned.split()
    filtered_words = []
    
    for word in words:
        if (len(word) > 2 and 
            word.lower() not in noise_words and 
            not word.isdigit() or 
            (word.isdigit() and len(word) > 2)):  # Keep meaningful numbers
            filtered_words.append(word)
    
    # Take first 5 meaningful words
    result = ' '.join(filtered_words[:5])
    logger.info(f"Fallback cleaning: '{result}' from title: '{title[:50]}...'")
    return result if result else title[:50]  # Ultimate fallback

def generate_search_variants(keywords: str) -> List[str]:
    """
    Generate multiple search query variants to improve product discovery.
    
    Args:
        keywords (str): Base keywords
        
    Returns:
        List[str]: List of search query variants
    """
    variants = [keywords]
    
    # Add quotes for exact match
    variants.append(f'"{keywords}"')
    
    # Add common e-commerce terms
    variants.append(f"{keywords} buy online")
    variants.append(f"{keywords} price india")
    variants.append(f"{keywords} specifications")
    
    # Split and recombine for partial matches
    words = keywords.split()
    if len(words) > 2:
        # Take first two words
        variants.append(' '.join(words[:2]))
        # Take last two words
        variants.append(' '.join(words[-2:]))
    
    return variants[:3]  # Limit to 3 variants to avoid too many API calls