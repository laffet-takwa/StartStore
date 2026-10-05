"""Cross-app reporting services.

This is the only place in ``common`` that reaches into the domain apps, and it
does so through local imports: the module stays import-cycle free while the
aggregation logic remains in one reviewable unit.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from common.constants import OrderStatus, PaymentStatus

#: Products at or below this stock level are surfaced as "low stock".
LOW_STOCK_THRESHOLD = 5

MONEY = DecimalField(max_digits=12, decimal_places=2)


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _last_month_start(now: datetime) -> datetime:
    return _month_start(now) - timedelta(days=1)


@dataclass(frozen=True, slots=True)
class DashboardReport:
    """Scalar metrics plus the collections rendered by the dashboard view."""

    metrics: dict
    recent_orders: list
    low_stock_products: list


def build_dashboard_report(*, now: datetime | None = None) -> DashboardReport:
    """Aggregate the operational numbers behind ``GET /api/admin/dashboard/``."""
    from django.conf import settings

    from accounts.constants import UserRole
    from accounts.models import Profile
    from categories.models import Category
    from orders.models import Order, OrderItem
    from products.models import Product

    now = now or timezone.now()
    this_month = _month_start(now)
    last_month = _last_month_start(now)

    # Revenue is money actually collected: an order counts as soon as its
    # payment is captured, regardless of how far fulfilment has progressed.
    paid = Q(payment_status=PaymentStatus.PAID)

    order_aggregate = Order.objects.aggregate(
        orders_total=Count("id"),
        orders_pending=Count("id", filter=Q(status=OrderStatus.PENDING)),
        orders_processing=Count("id", filter=Q(status=OrderStatus.PROCESSING)),
        orders_shipped=Count("id", filter=Q(status=OrderStatus.SHIPPED)),
        orders_delivered=Count("id", filter=Q(status=OrderStatus.DELIVERED)),
        orders_cancelled=Count("id", filter=Q(status=OrderStatus.CANCELLED)),
        awaiting_payment=Count("id", filter=Q(payment_status=PaymentStatus.PENDING)),
        orders_this_month=Count("id", filter=Q(created_at__gte=this_month)),
        revenue_total=Coalesce(Sum("total", filter=paid), Value(0), output_field=MONEY),
        revenue_this_month=Coalesce(
            Sum("total", filter=paid & Q(created_at__gte=this_month)),
            Value(0),
            output_field=MONEY,
        ),
        refunded_total=Coalesce(
            Sum("total", filter=Q(payment_status=PaymentStatus.REFUNDED)),
            Value(0),
            output_field=MONEY,
        ),
    )

    revenue_total = order_aggregate["revenue_total"] or Decimal("0")
    paid_order_count = Order.objects.filter(paid).count()
    average_order_value = (
        (revenue_total / paid_order_count).quantize(Decimal("0.01"))
        if paid_order_count
        else Decimal("0.00")
    )

    previous_month_revenue = Order.objects.filter(
        paid & Q(created_at__gte=last_month, created_at__lt=this_month)
    ).aggregate(total=Coalesce(Sum("total"), Value(0), output_field=MONEY))["total"]

    user_aggregate = Profile.objects.aggregate(
        users_total=Count("id"),
        users_customers=Count("id", filter=Q(role=UserRole.CUSTOMER)),
        users_admins=Count("id", filter=Q(role=UserRole.ADMIN)),
        users_new_this_month=Count("id", filter=Q(created_at__gte=this_month)),
    )

    catalogue_aggregate = Product.objects.aggregate(
        products_total=Count("id"),
        products_active=Count("id", filter=Q(is_active=True)),
        out_of_stock=Count("id", filter=Q(stock=0, is_active=True)),
        low_stock=Count("id", filter=Q(stock__lte=LOW_STOCK_THRESHOLD, is_active=True)),
        on_sale=Count("id", filter=Q(discount_price__isnull=False, is_active=True)),
    )

    metrics = {
        "generated_at": now,
        "currency": settings.STARTSTORE_CURRENCY,
        "low_stock_threshold": LOW_STOCK_THRESHOLD,
        **user_aggregate,
        "categories_total": Category.objects.count(),
        "categories_active": Category.objects.filter(is_active=True).count(),
        **catalogue_aggregate,
        **order_aggregate,
        "units_sold": OrderItem.objects.filter(order__status=OrderStatus.DELIVERED)
        .aggregate(total=Coalesce(Sum("quantity"), Value(0)))
        .get("total", 0),
        "average_order_value": average_order_value,
        "revenue_previous_month": previous_month_revenue,
    }

    recent_orders = list(Order.objects.select_related("user").order_by("-created_at")[:5])
    low_stock_products = list(
        Product.objects.filter(is_active=True, stock__lte=LOW_STOCK_THRESHOLD)
        .select_related("category")
        .order_by("stock", "name")[:10]
    )

    return DashboardReport(
        metrics=metrics,
        recent_orders=recent_orders,
        low_stock_products=low_stock_products,
    )