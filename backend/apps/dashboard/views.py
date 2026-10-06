"""
Views for dashboard app - metrics and reports.
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta, date

from apps.customers.models import Customer
from apps.repairs.models import RepairTicket, RepairStatus
from apps.inventory.models import Product, InventoryMovement
from apps.sales.models import Sale, Payment
from apps.invoices.models import Invoice
from apps.accounts.permissions import IsManagerOrAdmin, IsSalesOrAbove


class DashboardViewSet(viewsets.GenericViewSet):
    """Dashboard metrics and overview."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get main dashboard overview metrics."""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)

        # Revenue metrics
        sales_confirmed = Sale.objects.filter(status=Sale.Status.CONFIRMED)
        total_revenue = sales_confirmed.aggregate(total=Sum('total'))['total'] or 0
        today_revenue = sales_confirmed.filter(confirmed_at__date=today).aggregate(total=Sum('total'))['total'] or 0
        month_revenue = sales_confirmed.filter(confirmed_at__date__gte=month_start).aggregate(total=Sum('total'))['total'] or 0
        year_revenue = sales_confirmed.filter(confirmed_at__date__gte=year_start).aggregate(total=Sum('total'))['total'] or 0

        # Customer metrics
        total_customers = Customer.objects.filter(is_active=True).count()
        new_customers_month = Customer.objects.filter(is_active=True, created_at__date__gte=month_start).count()

        # Repair metrics
        all_repairs = RepairTicket.objects.all()
        active_repairs = all_repairs.exclude(status__in=[RepairStatus.DELIVERED, RepairStatus.CANCELLED]).count()
        completed_repairs = all_repairs.filter(status=RepairStatus.DELIVERED).count()
        pending_repairs = all_repairs.filter(status__in=[
            RepairStatus.RECEIVED, RepairStatus.DIAGNOSIS,
            RepairStatus.WAITING_CUSTOMER, RepairStatus.APPROVED
        ]).count()
        in_progress_repairs = all_repairs.filter(status__in=[
            RepairStatus.REPAIRING, RepairStatus.TESTING
        ]).count()
        ready_repairs = all_repairs.filter(status=RepairStatus.READY).count()

        # Inventory metrics
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_products = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=F('minimum_stock')
        ).count()
        out_of_stock_products = Product.objects.filter(is_active=True, stock_quantity=0).count()

        # Recent items
        recent_repairs = RepairTicket.objects.select_related('customer', 'device', 'technician').order_by('-created_at')[:5]
        recent_sales = Sale.objects.filter(status=Sale.Status.CONFIRMED).select_related('customer', 'employee').order_by('-confirmed_at')[:5]
        low_stock = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=F('minimum_stock')
        ).select_related('category').order_by('stock_quantity')[:10]

        from apps.repairs.serializers import RepairListSerializer
        from apps.sales.serializers import SaleListSerializer
        from apps.inventory.serializers import ProductListSerializer

        return Response({
            'revenue': {
                'total': float(total_revenue),
                'today': float(today_revenue),
                'month': float(month_revenue),
                'year': float(year_revenue),
            },
            'customers': {
                'total': total_customers,
                'new_this_month': new_customers_month,
            },
            'repairs': {
                'active': active_repairs,
                'completed': completed_repairs,
                'pending': pending_repairs,
                'in_progress': in_progress_repairs,
                'ready': ready_repairs,
            },
            'inventory': {
                'total_products': total_products,
                'low_stock': low_stock_products,
                'out_of_stock': out_of_stock_products,
            },
            'recent_repairs': RepairListSerializer(recent_repairs, many=True).data,
            'recent_sales': SaleListSerializer(recent_sales, many=True).data,
            'low_stock_products': ProductListSerializer(low_stock, many=True).data,
        })


class ReportsViewSet(viewsets.GenericViewSet):
    """Business reports and analytics."""

    permission_classes = [IsManagerOrAdmin]

    def get_date_range(self, request):
        """Parse date range from query params."""
        period = request.query_params.get('period', '30_days')
        today = timezone.now().date()

        if period == 'today':
            start = today
        elif period == '7_days':
            start = today - timedelta(days=7)
        elif period == '30_days':
            start = today - timedelta(days=30)
        elif period == '3_months':
            start = today - timedelta(days=90)
        elif period == 'custom':
            start = request.query_params.get('start_date')
            end = request.query_params.get('end_date')
            if start:
                start = date.fromisoformat(start)
            if end:
                end = date.fromisoformat(end)
            else:
                end = today
            return start, end
        else:
            start = today - timedelta(days=30)

        return start, today

    @action(detail=False, methods=['get'])
    def sales(self, request):
        """Sales report with charts data."""
        start, end = self.get_date_range(request)

        sales = Sale.objects.filter(
            status=Sale.Status.CONFIRMED,
            confirmed_at__date__gte=start,
            confirmed_at__date__lte=end
        )

        # Daily revenue
        daily_revenue = sales.extra(
            select={'date': "DATE(confirmed_at)"}
        ).values('date').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('date')

        # By payment method
        payment_methods = Payment.objects.filter(
            sale__in=sales
        ).values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        # Top products
        from apps.inventory.models import Product
        top_products = SaleItem.objects.filter(
            sale__in=sales
        ).values('product__name', 'product__sku').annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('total_price')
        ).order_by('-revenue')[:10]

        # Top customers
        top_customers = sales.values(
            'customer__first_name', 'customer__last_name', 'customer__phone'
        ).annotate(
            total_spent=Sum('total'),
            orders_count=Count('id')
        ).order_by('-total_spent')[:10]

        return Response({
            'period': {'start': start.isoformat(), 'end': end.isoformat()},
            'summary': {
                'total_revenue': float(sales.aggregate(total=Sum('total'))['total'] or 0),
                'total_orders': sales.count(),
                'avg_order_value': float(sales.aggregate(avg=Avg('total'))['avg'] or 0),
            },
            'daily_revenue': list(daily_revenue),
            'payment_methods': list(payment_methods),
            'top_products': list(top_products),
            'top_customers': list(top_customers),
        })

    @action(detail=False, methods=['get'])
    def repairs(self, request):
        """Repairs report with charts data."""
        start, end = self.get_date_range(request)

        repairs = RepairTicket.objects.filter(
            created_at__date__gte=start,
            created_at__date__lte=end
        )

        # By status
        status_counts = repairs.values('status').annotate(count=Count('id')).order_by('-count')

        # By technician
        technician_stats = repairs.values(
            'technician__first_name', 'technician__last_name'
        ).annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(status=RepairStatus.DELIVERED)),
            avg_completion_days=Avg(
                (F('delivered_at') - F('received_at')) / 86400000,
                filter=Q(status=RepairStatus.DELIVERED)
            )
        ).order_by('-total')

        # Daily intake
        daily_intake = repairs.extra(
            select={'date': "DATE(received_at)"}
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        # Revenue from repairs
        repair_revenue = repairs.filter(
            status=RepairStatus.DELIVERED
        ).aggregate(total=Sum('final_cost'))['total'] or 0

        # Average repair time
        avg_repair_days = repairs.filter(
            status=RepairStatus.DELIVERED
        ).aggregate(
            avg=Avg((F('delivered_at') - F('received_at')) / 86400000)
        )['avg']

        return Response({
            'period': {'start': start.isoformat(), 'end': end.isoformat()},
            'summary': {
                'total_repairs': repairs.count(),
                'completed': repairs.filter(status=RepairStatus.DELIVERED).count(),
                'cancelled': repairs.filter(status=RepairStatus.CANCELLED).count(),
                'repair_revenue': float(repair_revenue),
                'avg_repair_days': round(avg_repair_days, 1) if avg_repair_days else 0,
            },
            'by_status': list(status_counts),
            'by_technician': list(technician_stats),
            'daily_intake': list(daily_intake),
        })

    @action(detail=False, methods=['get'])
    def inventory(self, request):
        """Inventory report."""
        # Stock valuation
        total_stock_value = Product.objects.filter(is_active=True).aggregate(
            total=Sum(F('stock_quantity') * F('purchase_price'))
        )['total'] or 0

        total_retail_value = Product.objects.filter(is_active=True).aggregate(
            total=Sum(F('stock_quantity') * F('selling_price'))
        )['total'] or 0

        # Low stock products
        low_stock = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=F('minimum_stock')
        ).select_related('category').order_by('stock_quantity')

        # Top selling products (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        top_selling = SaleItem.objects.filter(
            sale__status=Sale.Status.CONFIRMED,
            sale__confirmed_at__date__gte=thirty_days_ago
        ).values('product__name', 'product__sku').annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('total_price')
        ).order_by('-quantity_sold')[:10]

        # Movement summary
        movements = InventoryMovement.objects.filter(
            created_at__date__gte=thirty_days_ago
        ).values('movement_type').annotate(
            total_quantity=Sum('quantity'),
            count=Count('id')
        ).order_by('-total_quantity')

        return Response({
            'summary': {
                'total_stock_value': float(total_stock_value),
                'total_retail_value': float(total_retail_value),
                'potential_profit': float(total_retail_value - total_stock_value),
                'low_stock_count': low_stock.count(),
            },
            'low_stock_products': [
                {
                    'id': str(p.id),
                    'name': p.name,
                    'sku': p.sku,
                    'stock': p.stock_quantity,
                    'minimum': p.minimum_stock,
                    'category': p.category.name if p.category else None,
                }
                for p in low_stock[:20]
            ],
            'top_selling': list(top_selling),
            'movements': list(movements),
        })

    @action(detail=False, methods=['get'])
    def customers(self, request):
        """Customers report."""
        start, end = self.get_date_range(request)

        # New customers
        new_customers = Customer.objects.filter(
            is_active=True,
            created_at__date__gte=start,
            created_at__date__lte=end
        ).count()

        # Active customers (with sales in period)
        active_customers = Customer.objects.filter(
            sales__status=Sale.Status.CONFIRMED,
            sales__confirmed_at__date__gte=start,
            sales__confirmed_at__date__lte=end
        ).distinct().count()

        # Top customers by spending
        top_customers = Customer.objects.filter(
            sales__status=Sale.Status.CONFIRMED,
            sales__confirmed_at__date__gte=start,
            sales__confirmed_at__date__lte=end
        ).values('id', 'first_name', 'last_name', 'phone', 'email').annotate(
            total_spent=Sum('sales__total'),
            orders_count=Count('sales')
        ).order_by('-total_spent')[:10]

        # Customers with repairs
        customers_with_repairs = Customer.objects.filter(
            repairs__created_at__date__gte=start,
            repairs__created_at__date__lte=end
        ).distinct().count()

        return Response({
            'period': {'start': start.isoformat(), 'end': end.isoformat()},
            'summary': {
                'new_customers': new_customers,
                'active_customers': active_customers,
                'customers_with_repairs': customers_with_repairs,
            },
            'top_customers': list(top_customers),
        })