"""Robotics models."""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import models

from employees.models import Employee

ZERO = Decimal("0.00")


class RoboticsProjectQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status="published")

    def drafts(self):
        return self.filter(status="draft")


class RoboticsProject(models.Model):
    DIFFICULTY_LEVELS = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
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
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default="beginner", db_index=True)
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    components = models.TextField()
    instructions = models.TextField()
    image_url = models.TextField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    source_code_url = models.URLField(null=True, blank=True)
    author = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="robotics_projects",
    )
    status = models.CharField(max_length=20, choices=CONTENT_STATUSES, default="draft", db_index=True)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = RoboticsProjectQuerySet.as_manager()

    class Meta:
        db_table = "robotics_projects"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["difficulty", "status"], name="robotics_difficulty_status_idx"),
            models.Index(fields=["slug"], name="robotics_slug_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(estimated_cost__gte=0), name="robotics_cost_non_negative"),
            models.CheckConstraint(condition=models.Q(views__gte=0), name="robotics_views_non_negative"),
        ]

    def __str__(self) -> str:
        return self.title
