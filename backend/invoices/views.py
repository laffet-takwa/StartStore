"""Invoice endpoints."""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from django.db import transaction
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsSales
from invoices.models import Invoice
from invoices.serializers import InvoiceSerializer, InvoiceWriteSerializer


INVOICE_FILTER_PARAMETERS = [
    OpenApiParameter("type", str, description="Filter by invoice type."),
    OpenApiParameter("payment_status", str, description="Filter by payment status."),
    OpenApiParameter("search", str, description="Search by invoice number."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    filterset_fields = ["type", "payment_status"]
    search_fields = ["invoice_number"]
    ordering_fields = ["issued_at", "total", "payment_status"]
    ordering = ["-issued_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        self.permission_classes = [IsAdmin | IsManager | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        return super().get_queryset().select_related("customer", "sale", "repair")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return InvoiceWriteSerializer
        return InvoiceSerializer

    @extend_schema(
        tags=["invoices"],
        summary="List invoices",
        parameters=INVOICE_FILTER_PARAMETERS,
        responses={200: InvoiceSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["invoices"],
        summary="Create an invoice",
        request=InvoiceWriteSerializer,
        responses={201: InvoiceSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
