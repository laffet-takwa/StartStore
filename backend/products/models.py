"""Product models (``public.products`` and ``public.product_images``).

Notes on matching the live schema:

* ``products.category_id`` is **nullable**, so a product may exist without a
  category and the relationship uses ``SET_NULL``.
* ``products.sku`` is nullable and unique. Postgres allows any number of NULLs in
  a unique column, so uncatalogued items may omit it.
* ``products.price`` only carries a ``>= 0`` CHECK in the database; the stricter
  "must be greater than zero" rule lives in the serializer as a business rule.
* ``products.search_vector`` is a generated ``tsvector`` maintained by Postgres
  and therefore deliberately not declared here - Django never writes it.
* ``product_images`` has ``created_at`` only, no ``updated_at``, and requires
  ``image_url``.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Case, DecimalField, F, Q, Value, When

from categories.models import Category
from common.utils import build_unique_slug
from common.validators import normalize_sku, validate_sku
from products.validators import validate_price_rules


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_effective_price(self):
        """Annotate ``effective_price``: the price a customer actually pays."""
        return self.annotate(
            effective_price=Case(
                When(discount_price__isnull=True, then=F("price")),
                When(discount_price__gte=F("price"), then=F("price")),
                default=F("discount_price"),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )

    def with_related(self):
        return self.select_related("category").prefetch_related("images")


class Product(models.Model):
    """A sellable catalogue item."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    sku = models.CharField(
        max_length=32, null=True, blank=True, unique=True, validators=[validate_sku]
    )
    image_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        db_table = "products"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["is_active", "category"], name="product_active_cat_idx"),
            models.Index(fields=["is_active", "price"], name="product_active_price_idx"),
        ]

    def __str__(self) -> str:
        return self.name

    # --- Normalisation & integrity ------------------------------------------ #
    def save(self, *args, **kwargs) -> None:
        if self.sku:
            self.sku = normalize_sku(self.sku)
        if not self.slug:
            self.slug = build_unique_slug(
                Product, source=self.name, max_length=220, instance=self
            )
        if (
            self.discount_price is not None
            and self.price is not None
            and self.discount_price >= self.price
        ):
            # A "discount" that is not cheaper is meaningless; treat as none.
            self.discount_price = None
        super().save(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        validate_price_rules(price=self.price, discount_price=self.discount_price)

    # --- Derived values ------------------------------------------------------ #
    @property
    def final_price(self) -> Decimal:
        """The unit price charged at checkout: discount when cheaper, else price."""
        if (
            self.discount_price is not None
            and self.price is not None
            and self.discount_price < self.price
        ):
            return self.discount_price
        return self.price

    @property
    def is_on_sale(self) -> bool:
        return (
            self.discount_price is not None
            and self.price is not None
            and self.discount_price < self.price
        )

    @property
    def discount_percentage(self) -> Decimal:
        """Whole percentage off, or ``0`` when the item is not discounted."""
        if not self.is_on_sale or not self.price:
            return Decimal("0")
        return (((self.price - self.discount_price) / self.price) * 100).quantize(Decimal("1"))

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def primary_image_url(self) -> str:
        if self.image_url:
            return self.image_url
        images = list(self.images.all())
        return images[0].image_url if images else ""


class ProductImage(models.Model):
    """An additional gallery image (``public.product_images``)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image_url = models.TextField()
    alt_text = models.CharField(max_length=200, null=True, blank=True)
    display_order = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ("display_order", "id")
        indexes = [
            models.Index(fields=["product", "display_order"], name="pimage_order_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.product.name} image #{self.pk}"
