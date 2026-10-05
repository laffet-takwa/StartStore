"""Shared pagination policy."""

from __future__ import annotations

from rest_framework.pagination import PageNumberPagination
from rest_framework.settings import api_settings


class DefaultPagination(PageNumberPagination):
    """Page-number pagination with a client configurable, capped page size."""

    page_size = api_settings.PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = 100