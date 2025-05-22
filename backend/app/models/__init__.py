# backend/app/models/__init__.py
"""
Data Models Module
"""
from .product import Product
from .alert import Alert

__all__ = ["Product", "Alert"]