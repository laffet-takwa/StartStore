"""
Views for inventory app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum, Count, Q

from .models import Category, Supplier, Product, InventoryMovement
from .serializers import (
    CategorySerializer,
    CategoryListSerializer,
    SupplierSerializer,
    SupplierListSerializer,
    ProductSerializer,
    ProductListSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    InventoryMovementSerializer,
    InventoryAdjustmentSerializer,
)
from apps.accounts.permissions import IsManagerOrAdmin, IsSalesOrAbove


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category management."""

    queryset = Category.objects.all()
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count('products', distinct=True)
        ).all()


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for Supplier management."""

    queryset = Supplier.objects.all()
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierListSerializer
        return SupplierSerializer

    def get_queryset(self):
        return Supplier.objects.annotate(
            product_count=Count('products', distinct=True)
        ).all()


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product management."""

    queryset = Product.objects.all()
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier', 'is_active']
    search_fields = ['name', 'sku', 'barcode', 'brand', 'description']
    ordering_fields = ['name', 'sku', 'selling_price', 'stock_quantity', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'create':
            return ProductCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer

    def get_queryset(self):
        return Product.objects.select_related('category', 'supplier').all()

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock."""
        products = Product.objects.filter(
            is_active=True,
            stock_quantity__lte=models.F('minimum_stock')
        ).select_related('category', 'supplier')
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        """Adjust inventory for a product."""
        serializer = InventoryAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        quantity_change = serializer.validated_data['quantity']
        reason = serializer.validated_data['reason']

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)
            old_quantity = product.stock_quantity
            new_quantity = old_quantity + quantity_change

            if new_quantity < 0:
                return Response(
                    {'detail': 'Insufficient stock.', 'code': 'INSUFFICIENT_STOCK'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            product.stock_quantity = new_quantity
            product.save(update_fields=['stock_quantity', 'updated_at'])

            movement_type = (
                InventoryMovement.MovementType.ADJUSTMENT
                if quantity_change > 0
                else InventoryMovement.MovementType.DAMAGED
            )

            InventoryMovement.objects.create(
                product=product,
                movement_type=movement_type,
                quantity=abs(quantity_change),
                reference_type='adjustment',
                reason=reason,
                created_by=request.user if hasattr(request, 'user') else None,
            )

        return Response({
            'detail': 'Inventory adjusted successfully.',
            'product': ProductListSerializer(product).data,
            'old_quantity': old_quantity,
            'new_quantity': new_quantity,
        })


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing inventory movements."""

    queryset = InventoryMovement.objects.all()
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'product', 'reference_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return InventoryMovement.objects.select_related('product', 'created_by').all()