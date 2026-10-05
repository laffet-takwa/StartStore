"""Views that aggregate across domain apps."""

from __future__ import annotations

from decimal import Decimal

from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdmin
from common.services.dashboard import build_dashboard_report


def jsonify_metrics(metrics: dict) -> dict:
    """Render datetimes as ISO-8601 and decimals as fixed precision strings."""
    rendered: dict = {}
    for key, value in metrics.items():
        if isinstance(value, Decimal):
            rendered[key] = f"{value:.2f}"
        elif hasattr(value, "isoformat"):
            rendered[key] = value.isoformat()
        else:
            rendered[key] = value
    return rendered


class AdminDashboardView(APIView):
    """Operational snapshot for staff: KPIs, recent orders and low stock.

    Nested collections reuse the domain serializers so an admin sees exactly the
    same product/order shape as the rest of the API.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["admin"],
        summary="Admin dashboard KPIs",
        description=(
            "Aggregated counts, revenue figures, the 5 most recent orders and the "
            "10 lowest-stock active products. Staff only."
        ),
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request, *args, **kwargs) -> Response:
        # Imported here to keep `common` import-cycle free at startup.
        from orders.serializers import OrderSerializer
        from products.serializers import ProductSummarySerializer

        report = build_dashboard_report()
        context = {"request": request, "view": self}

        return Response(
            {
                "metrics": jsonify_metrics(report.metrics),
                "recent_orders": OrderSerializer(
                    report.recent_orders, many=True, context=context
                ).data,
                "low_stock_products": ProductSummarySerializer(
                    report.low_stock_products, many=True, context=context
                ).data,
            }
        )