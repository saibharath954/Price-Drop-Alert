# backend/app/scraper/base_scraper.py
from abc import ABC, abstractmethod

class BaseScraper(ABC):
    @abstractmethod
    def scrape(self, url: str) -> dict:
        pass
    
    @abstractmethod
    def generate_product_id(self, url: str) -> str:
        pass