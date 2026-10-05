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
from products.models import Product, ProductImage

CATEGORIES = [
    {
        "name": "Electronics",
        "description": "Audio, computing and accessories.",
        "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    },
    {
        "name": "Home & Kitchen",
        "description": "Everyday essentials for the kitchen and home.",
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    },
    {
        "name": "Apparel",
        "description": "Clothing, footwear and accessories.",
        "image_url": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop",
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
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Electronics",
        "name": "Nimbus Wireless Earbuds",
        "sku": "NIMBUS-EB-01",
        "price": "79.00",
        "discount_price": None,
        "stock": 85,
        "description": "Active noise cancelling earbuds with a 32 hour case.",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Electronics",
        "name": "Vertex USB-C Hub",
        "sku": "VERTEX-HUB-8",
        "price": "45.50",
        "discount_price": None,
        "stock": 60,
        "description": "Eight port hub with 100W pass-through charging.",
        "image_url": "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Home & Kitchen",
        "name": "Copper Core Frying Pan",
        "sku": "COPPER-FP-28",
        "price": "64.00",
        "discount_price": "54.00",
        "stock": 25,
        "description": "28cm pan with a copper core for even heat.",
        "image_url": "https://images.unsplash.com/photo-1584990358298-2cbe5aa7d47b?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1584990358298-2cbe5aa7d47b?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1584267947725-8f33d5e5c8a5?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Home & Kitchen",
        "name": "Stoneware Coffee Mug Set",
        "sku": "STONE-MUG-4",
        "price": "32.00",
        "discount_price": None,
        "stock": 4,
        "description": "Set of four 350ml reactive glaze mugs.",
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Apparel",
        "name": "Meridian Rain Jacket",
        "sku": "MERID-RJ-M",
        "price": "148.00",
        "discount_price": "118.00",
        "stock": 30,
        "description": "Waterproof three-layer shell with taped seams.",
        "image_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Apparel",
        "name": "Everyday Cotton Tee",
        "sku": "EVERY-TEE-L",
        "price": "24.00",
        "discount_price": None,
        "stock": 120,
        "description": "Heavyweight organic cotton, pre-shrunk.",
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=800&h=800&fit=crop",
        ],
    },
    {
        "category": "Apparel",
        "name": "Trail Runner Sneakers",
        "sku": "TRAIL-SN-42",
        "price": "110.00",
        "discount_price": None,
        "stock": 0,
        "description": "Neutral trainers with a cushioned responsive foam sole.",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
            "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
        ],
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
                    "image_url": payload.get("image_url"),
                    "is_active": True,
                },
            )
            categories[category.name] = category
            self.stdout.write(
                f"{'Created' if created else 'Updated'} category: {category.name}"
            )

        for payload in PRODUCTS:
            data = dict(payload)
            images = data.pop("images", [])
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
                "image_url": data.get("image_url"),
            }
            product, created = Product.objects.update_or_create(
                sku=data["sku"], defaults=defaults
            )
            self.stdout.write(
                f"{'Created' if created else 'Updated'} product: {product.name}"
            )

            # Create gallery images
            if images:
                ProductImage.objects.filter(product=product).delete()
                for idx, image_url in enumerate(images):
                    ProductImage.objects.create(
                        product=product,
                        image_url=image_url,
                        alt_text=f"{product.name} — view {idx + 1}",
                        display_order=idx,
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(categories)} categories and {len(PRODUCTS)} products."
            )
        )