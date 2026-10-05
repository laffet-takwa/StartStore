"""Report endpoints."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Iterable

from django.db.models import Count, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdmin, IsManager
from repairs.constants import RepairStatus
from sales.models import Sale
from repairs.models import Repair
from products.models import Product
from inventory.models import StockMovement
from customers.models import Customer


class DashboardView(APIView):
    """Aggregated dashboard endpoint."""

    permission_classes = [IsAdmin | IsManager]

    @extend_schema(
        tags=["dashboard"],
        summary="Dashboard metrics",
        responses={200: {"type": "object"}},
    )
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        total_revenue = Sale.objects.filter(status="confirmed").aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        monthly_revenue = Sale.objects.filter(status="confirmed", created_at__gte=month_start).aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        active_repairs = Repair.objects.exclude(status__in=[RepairStatus.DELIVERED, RepairStatus.CANCELLED]).count()
        pending_repairs = Repair.objects.filter(status=RepairStatus.RECEIVED).count()
        total_customers = Customer.objects.filter(is_active=True).count()
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(is_active=True, stock__lte=models.F("minimum_stock")).count()

        recent_repairs = Repair.objects.select_related("customer").order_by("-created_at")[:10]
        recent_sales = Sale.objects.select_related("customer").order_by("-created_at")[:10]
        low_stock_products = Product.objects.filter(is_active=True, stock__lte=models.F("minimum_stock")).select_related("category")[:10]

        return Response({
            "generated_at": now.isoformat(),
            "total_revenue": str(total_revenue),
            "monthly_revenue": str(monthly_revenue),
            "active_repairs": active_repairs,
            "pending_repairs": pending_repairs,
            "total_customers": total_customers,
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "recent_repairs": [
                {
                    "id": str(r.id),
                    "ticket_number": r.ticket_number,
                    "customer_name": str(r.customer),
                    "status": r.status,
                    "estimated_cost": str(r.estimated_cost),
                }
                for r in recent_repairs
            ],
            "recent_sales": [
                {
                    "id": str(s.id),
                    "sale_number": s.sale_number,
                    "customer_name": str(s.customer) if s.customer else None,
                    "total": str(s.total),
                    "status": s.status,
                }
                for s in recent_sales
            ],
            "low_stock_products": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "stock": p.stock,
                    "minimum_stock": p.minimum_stock,
                }
                for p in low_stock_products
            ],
        })


class SalesReportView(APIView):
    permission_classes = [IsAdmin | IsManager]

    @extend_schema(
        tags=["reports"],
        summary="Sales report",
        responses={200: {"type": "object"}},
    )
    def get(self, request, *args, **kwargs):
        period = request.query_params.get("period", "30_days")
        now = timezone.now()
        if period == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "7_days":
            start = now - timedelta(days=7)
        elif period == "30_days":
            start = now - timedelta(days=30)
        elif period == "3_months":
            start = now - timedelta(days=90)
        else:
            start = now - timedelta(days=30)

        sales = Sale.objects.filter(created_at__gte=start, status="confirmed")
        total_sales = sales.count()
        total_revenue = sales.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        top_products = (
            SaleItem.objects.filter(sale__in=sales)
            .values("product__name")
            .annotate(quantity=Sum("quantity"), revenue=Sum("total_price"))
            .order_by("-quantity")[:10]
        )

        return Response({
            "period": period,
            "start": start.isoformat(),
            "end": now.isoformat(),
            "total_sales": total_sales,
            "total_revenue": str(total_revenue),
            "top_products": list(top_products),
        })


class RepairsReportView(APIView):
    permission_classes = [IsAdmin | IsManager]

    @extend_schema(
        tags=["reports"],
        summary="Repairs report",
        responses={200: {"type": "object"}},
    )
    def get(self, request, *args, **kwargs):
        period = request.query_params.get("period", "30_days")
        now = timezone.now()
        if period == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "7_days":
            start = now - timedelta(days=7)
        elif period == "30_days":
            start = now - timedelta(days=30)
        elif period == "3_months":
            start = now - timedelta(days=90)
        else:
            start = now - timedelta(days=30)

        repairs = Repair.objects.filter(created_at__gte=start)
        total_repairs = repairs.count()
        completed = repairs.filter(status=RepairStatus.DELIVERED).count()
        pending = repairs.filter(status=RepairStatus.RECEIVED).count()

        return Response({
            "period": period,
            "start": start.isoformat(),
            "end": now.isoformat(),
            "total_repairs": total_repairs,
            "completed": completed,
            "pending": pending,
        })
