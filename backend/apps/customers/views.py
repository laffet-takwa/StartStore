"""
Views for customers app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from .models import Customer, Device, DeviceType, Governorate
from .serializers import (
    CustomerSerializer,
    CustomerListSerializer,
    CustomerCreateSerializer,
    CustomerUpdateSerializer,
    DeviceSerializer,
    DeviceListSerializer,
    DeviceCreateSerializer,
    GovernorateSerializer,
    DeviceTypeSerializer,
)
from apps.accounts.permissions import IsManagerOrAdmin, IsSalesOrAbove


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer management."""

    queryset = Customer.objects.all()
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'governorate', 'city']
    search_fields = ['first_name', 'last_name', 'phone', 'email', 'company_name']
    ordering_fields = ['created_at', 'last_name', 'first_name', 'phone']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        elif self.action == 'create':
            return CustomerCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CustomerUpdateSerializer
        return CustomerSerializer

    def get_queryset(self):
        queryset = Customer.objects.annotate(
            device_count=Count('devices', distinct=True),
            repair_count=Count('repairs', distinct=True),
        ).select_related().prefetch_related('devices')

        # Filter by active status by default
        if self.action == 'list':
            is_active = self.request.query_params.get('is_active')
            if is_active is None:
                queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=True, methods=['get'])
    def devices(self, request, pk=None):
        """Get customer's devices."""
        customer = self.get_object()
        devices = customer.devices.all()
        serializer = DeviceListSerializer(devices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def repairs(self, request, pk=None):
        """Get customer's repairs."""
        customer = self.get_object()
        from apps.repairs.serializers import RepairListSerializer
        from apps.repairs.models import Repair
        repairs = Repair.objects.filter(customer=customer).select_related('device', 'technician')
        serializer = RepairListSerializer(repairs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def sales(self, request, pk=None):
        """Get customer's sales."""
        customer = self.get_object()
        from apps.sales.serializers import SaleListSerializer
        from apps.sales.models import Sale
        sales = Sale.objects.filter(customer=customer).select_related('employee')
        serializer = SaleListSerializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get customer's payments."""
        customer = self.get_object()
        from apps.sales.serializers import PaymentSerializer
        from apps.sales.models import Payment
        payments = Payment.objects.filter(sale__customer=customer).select_related('sale')
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get customer summary statistics."""
        customer = self.get_object()
        from apps.sales.models import Sale
        from apps.repairs.models import Repair
        from django.db.models import Sum, Count

        sales_stats = Sale.objects.filter(customer=customer, status=Sale.Status.CONFIRMED).aggregate(
            total_sales=Count('id'),
            total_spent=Sum('total')
        )

        repair_stats = Repair.objects.filter(customer=customer).aggregate(
            total_repairs=Count('id'),
            completed_repairs=Count('id', filter=Q(status=Repair.Status.DELIVERED)),
            total_repair_cost=Sum('final_cost')
        )

        return Response({
            'customer': CustomerSerializer(customer).data,
            'sales': {
                'total_sales': sales_stats['total_sales'] or 0,
                'total_spent': sales_stats['total_spent'] or 0,
            },
            'repairs': {
                'total_repairs': repair_stats['total_repairs'] or 0,
                'completed_repairs': repair_stats['completed_repairs'] or 0,
                'total_repair_cost': repair_stats['total_repair_cost'] or 0,
            },
            'devices': customer.devices.count(),
        })

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Get governorate and device type choices."""
        governorates = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Governorate.choices
        ]
        device_types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in DeviceType.choices
        ]
        return Response({
            'governorates': governorates,
            'device_types': device_types,
        })


class DeviceViewSet(viewsets.ModelViewSet):
    """ViewSet for Device management."""

    queryset = Device.objects.all()
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['device_type', 'customer']
    search_fields = ['brand', 'model', 'serial_number']
    ordering_fields = ['created_at', 'brand', 'model']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DeviceListSerializer
        elif self.action == 'create':
            return DeviceCreateSerializer
        return DeviceSerializer

    def get_queryset(self):
        return Device.objects.select_related('customer').all()

    @action(detail=True, methods=['get'])
    def repairs(self, request, pk=None):
        """Get device's repair history."""
        device = self.get_object()
        from apps.repairs.serializers import RepairListSerializer
        from apps.repairs.models import Repair
        repairs = Repair.objects.filter(device=device).select_related('customer', 'technician')
        serializer = RepairListSerializer(repairs, many=True)
        return Response(serializer.data)