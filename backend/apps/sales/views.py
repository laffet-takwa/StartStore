"""
Views for sales app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import Sale, SaleItem, Payment
from .serializers import (
    SaleListSerializer,
    SaleDetailSerializer,
    SaleCreateSerializer,
    SaleUpdateSerializer,
    SaleConfirmSerializer,
    PaymentSerializer,
    PaymentCreateSerializer,
    SaleItemSerializer,
)
from apps.accounts.permissions import IsSalesOrAbove, IsManagerOrAdmin


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Sale management."""

    queryset = Sale.objects.all()
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'customer', 'employee']
    search_fields = ['sale_number', 'customer__first_name', 'customer__last_name', 'customer__phone']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        elif self.action == 'create':
            return SaleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SaleUpdateSerializer
        return SaleDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Sale.objects.select_related('customer', 'employee').prefetch_related(
            'items__product', 'payments'
        )

        if user.is_sales:
            queryset = queryset.filter(employee=user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a draft sale."""
        sale = self.get_object()

        if sale.status != Sale.Status.DRAFT:
            return Response(
                {'detail': 'Only draft sales can be confirmed.', 'code': 'INVALID_STATUS'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            sale.status = Sale.Status.CONFIRMED
            sale.confirmed_at = timezone.now()
            sale.save(update_fields=['status', 'confirmed_at', 'updated_at'])

        return Response(SaleDetailSerializer(sale, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a sale and restore stock."""
        sale = self.get_object()

        if sale.status == Sale.Status.CANCELLED:
            return Response(
                {'detail': 'Sale is already cancelled.', 'code': 'ALREADY_CANCELLED'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sale.status == Sale.Status.CONFIRMED:
            with transaction.atomic():
                from apps.inventory.models import Product, InventoryMovement

                # Restore stock for each item
                for item in sale.items.select_related('product'):
                    product = Product.objects.select_for_update().get(pk=item.product.pk)
                    product.stock_quantity += item.quantity
                    product.save(update_fields=['stock_quantity', 'updated_at'])

                    InventoryMovement.objects.create(
                        product=product,
                        movement_type=InventoryMovement.MovementType.RETURN,
                        quantity=item.quantity,
                        reference_type='sale',
                        reference_id=sale.id,
                        reason=f'Sale {sale.sale_number} cancelled',
                        created_by=request.user,
                    )

        sale.status = Sale.Status.CANCELLED
        sale.cancelled_at = timezone.now()
        sale.save(update_fields=['status', 'cancelled_at', 'updated_at'])

        return Response({'detail': 'Sale cancelled and stock restored.'})

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get sales dashboard statistics."""
        user = request.user
        queryset = self.get_queryset()

        today = timezone.now().date()
        month_start = today.replace(day=1)

        stats = {
            'total_sales': queryset.count(),
            'confirmed_sales': queryset.filter(status=Sale.Status.CONFIRMED).count(),
            'draft_sales': queryset.filter(status=Sale.Status.DRAFT).count(),
            'cancelled_sales': queryset.filter(status=Sale.Status.CANCELLED).count(),
            'total_revenue': queryset.filter(status=Sale.Status.CONFIRMED).aggregate(
                total=Sum('total')
            )['total'] or 0,
            'today_revenue': queryset.filter(
                status=Sale.Status.CONFIRMED,
                confirmed_at__date=today
            ).aggregate(total=Sum('total'))['total'] or 0,
            'month_revenue': queryset.filter(
                status=Sale.Status.CONFIRMED,
                confirmed_at__date__gte=month_start
            ).aggregate(total=Sum('total'))['total'] or 0,
            'pending_payments': queryset.filter(
                status=Sale.Status.CONFIRMED,
                payment_status__in=[Sale.PaymentStatus.UNPAID, Sale.PaymentStatus.PARTIAL]
            ).count(),
        }

        if user.is_sales:
            my_sales = queryset.filter(employee=user)
            stats['my_sales'] = my_sales.count()
            stats['my_revenue'] = my_sales.filter(status=Sale.Status.CONFIRMED).aggregate(
                total=Sum('total')
            )['total'] or 0

        return Response(stats)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management."""

    queryset = Payment.objects.all()
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_method', 'sale', 'repair']
    search_fields = ['reference', 'sale__sale_number', 'repair__ticket_number']
    ordering_fields = ['paid_at', 'amount']
    ordering = ['-paid_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_queryset(self):
        return Payment.objects.select_related('sale', 'repair').all()


class SaleItemViewSet(viewsets.ModelViewSet):
    """ViewSet for SaleItem management (nested under sale)."""

    queryset = SaleItem.objects.all()
    serializer_class = SaleItemSerializer
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sale']