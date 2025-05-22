# backend/app/scraper/__init__.py
"""
Product Scrapers Module
"""
from .amazon import AmazonScraper
from .base_scraper import BaseScraper

__all__ = ["AmazonScraper", "BaseScraper"]