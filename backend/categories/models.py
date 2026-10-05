"""Category model (``public.categories``)."""

from __future__ import annotations

import uuid

from django.db import models

from common.utils import build_unique_slug


class CategoryQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_product_counts(self):
        return self.annotate(
            product_count=models.Count(
                "products", filter=models.Q(products__is_active=True), distinct=True
            )
        )


class Category(models.Model):
    """A catalogue category, e.g. "Electronics"."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(null=True, blank=True)
    image_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CategoryQuerySet.as_manager()

    class Meta:
        db_table = "categories"
        ordering = ("name",)
        indexes = [models.Index(fields=["is_active", "name"], name="category_active_name_idx")]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = build_unique_slug(
                Category, source=self.name, max_length=140, instance=self
            )
        super().save(*args, **kwargs)
