"""Seed a small demo catalogue.

``python manage.py seed_demo`` is idempotent: re-running it updates the same
rows instead of duplicating them, so it is safe to run against a dev database
more than once.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from categories.models import Category
from products.models import Product

CATEGORIES = [
    {
        "name": "Electronics",
        "description": "Audio, computing and accessories.",
    },
    {
        "name": "Home & Kitchen",
        "description": "Everyday essentials for the kitchen and home.",
    },
    {
        "name": "Apparel",
        "description": "Clothing, footwear and accessories.",
    },
]

PRODUCTS = [
    {
        "category": "Electronics",
        "name": "Aurora Mechanical Keyboard",
        "sku": "AURORA-KB-87",
        "price": "129.00",
        "discount_price": "99.00",
        "stock": 40,
        "description": "Hot-swappable 87-key keyboard with a gasket mount.",
    },
    {
        "category": "Electronics",
        "name": "Nimbus Wireless Earbuds",
        "sku": "NIMBUS-EB-01",
        "price": "79.00",
        "discount_price": None,
        "stock": 85,
        "description": "Active noise cancelling earbuds with a 32 hour case.",
    },
    {
        "category": "Electronics",
        "name": "Vertex USB-C Hub",
        "sku": "VERTEX-HUB-8",
        "price": "45.50",
        "discount_price": None,
        "stock": 60,
        "description": "Eight port hub with 100W pass-through charging.",
    },
    {
        "category": "Home & Kitchen",
        "name": "Copper Core Frying Pan",
        "sku": "COPPER-FP-28",
        "price": "64.00",
        "discount_price": "54.00",
        "stock": 25,
        "description": "28cm pan with a copper core for even heat.",
    },
    {
        "category": "Home & Kitchen",
        "name": "Stoneware Coffee Mug Set",
        "sku": "STONE-MUG-4",
        "price": "32.00",
        "discount_price": None,
        "stock": 4,  # deliberately low so the low-stock report has something to show
        "description": "Set of four 350ml reactive glaze mugs.",
    },
    {
        "category": "Apparel",
        "name": "Meridian Rain Jacket",
        "sku": "MERID-RJ-M",
        "price": "148.00",
        "discount_price": "118.00",
        "stock": 30,
        "description": "Waterproof three-layer shell with taped seams.",
    },
    {
        "category": "Apparel",
        "name": "Everyday Cotton Tee",
        "sku": "EVERY-TEE-L",
        "price": "24.00",
        "discount_price": None,
        "stock": 120,
        "description": "Heavyweight organic cotton, pre-shrunk.",
    },
    {
        "category": "Apparel",
        "name": "Trail Runner Sneakers",
        "sku": "TRAIL-SN-42",
        "price": "110.00",
        "discount_price": None,
        "stock": 0,  # sold out on purpose, exercises `?in_stock=false`
        "description": "Neutral trainers with a cushioned responsive foam sole.",
    },
]


class Command(BaseCommand):
    help = "Create or refresh a small demo catalogue (categories + products)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Deactivate existing demo rows instead of updating them.",
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        categories: dict[str, Category] = {}
        for payload in CATEGORIES:
            category, created = Category.objects.update_or_create(
                name=payload["name"],
                defaults={
                    "description": payload["description"],
                    "is_active": True,
                },
            )
            categories[category.name] = category
            self.stdout.write(
                f"{'Created' if created else 'Updated'} category: {category.name}"
            )

        for payload in PRODUCTS:
            data = dict(payload)
            category = categories[data.pop("category")]
            defaults = {
                "name": data["name"],
                "category": category,
                "description": data["description"],
                "price": Decimal(data["price"]),
                "discount_price": (
                    Decimal(data["discount_price"]) if data["discount_price"] else None
                ),
                "stock": data["stock"],
                "is_active": True,
            }
            product, created = Product.objects.update_or_create(
                sku=data["sku"], defaults=defaults
            )
            self.stdout.write(
                f"{'Created' if created else 'Updated'} product: {product.name}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(categories)} categories and {len(PRODUCTS)} products."
            )
        )