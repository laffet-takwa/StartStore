"""Payment endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsSales
from payments.models import Payment
from payments.serializers import PaymentCreateSerializer, PaymentSerializer


PAYMENT_FILTER_PARAMETERS = [
    OpenApiParameter("sale", str, description="Filter by sale id."),
    OpenApiParameter("repair", str, description="Filter by repair id."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    filterset_fields = ["sale", "repair", "payment_method"]
    ordering_fields = ["paid_at", "amount"]
    ordering = ["-paid_at"]
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action in ("create",):
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        return super().get_queryset().select_related("sale", "repair")

    def get_serializer_class(self):
        if self.action in ("create",):
            return PaymentCreateSerializer
        return PaymentSerializer

    @extend_schema(
        tags=["payments"],
        summary="List payments",
        parameters=PAYMENT_FILTER_PARAMETERS,
        responses={200: PaymentSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["payments"],
        summary="Create a payment",
        request=PaymentCreateSerializer,
        responses={201: PaymentSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
