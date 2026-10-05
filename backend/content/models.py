"""Content models."""

from __future__ import annotations

import uuid

from django.db import models

from employees.models import Employee


class EducationalContentQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status="published")

    def drafts(self):
        return self.filter(status="draft")


class EducationalContent(models.Model):
    CONTENT_TYPES = [
        ("article", "Article"),
        ("tutorial", "Tutorial"),
        ("video", "Video"),
    ]
    CONTENT_STATUSES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField()
    content = models.TextField()
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, default="article", db_index=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    cover_image_url = models.TextField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    source_code_url = models.URLField(null=True, blank=True)
    author = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="educational_contents",
    )
    status = models.CharField(max_length=20, choices=CONTENT_STATUSES, default="draft", db_index=True)
    views = models.IntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = EducationalContentQuerySet.as_manager()

    class Meta:
        db_table = "educational_contents"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status", "-created_at"], name="content_status_created_idx"),
            models.Index(fields=["content_type"], name="content_type_idx"),
            models.Index(fields=["slug"], name="content_slug_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(views__gte=0), name="content_views_non_negative"),
        ]

    def __str__(self) -> str:
        return self.title
