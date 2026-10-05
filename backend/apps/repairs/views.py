"""
Views for repairs app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.utils import timezone

from .models import RepairTicket, RepairImage, RepairPart, RepairStatus, RepairStatusHistory, PublicRepairTracking
from .serializers import (
    RepairListSerializer,
    RepairDetailSerializer,
    RepairCreateSerializer,
    RepairUpdateSerializer,
    RepairStatusUpdateSerializer,
    RepairImageSerializer,
    RepairPartSerializer,
    RepairPartCreateSerializer,
    RepairStatusHistorySerializer,
    PublicRepairTrackingSerializer,
    PublicRepairStatusSerializer,
)
from .permissions import IsTechnicianOrOwner, CanManageRepairParts, CanUpdateRepairStatus
from apps.accounts.permissions import IsManagerOrAdmin, IsSalesOrAbove


class RepairViewSet(viewsets.ModelViewSet):
    """ViewSet for Repair Ticket management."""

    queryset = RepairTicket.objects.all()
    permission_classes = [IsTechnicianOrOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'technician', 'customer']
    search_fields = ['ticket_number', 'tracking_matricule', 'customer__first_name', 'customer__last_name', 'customer__phone']
    ordering_fields = ['created_at', 'received_at', 'estimated_completion_date', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RepairListSerializer
        elif self.action == 'create':
            return RepairCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RepairUpdateSerializer
        return RepairDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = RepairTicket.objects.select_related(
            'customer', 'device', 'technician'
        ).prefetch_related('parts__product', 'images', 'status_history__changed_by')

        if user.is_technician:
            queryset = queryset.filter(technician=user)

        return queryset

    def perform_create(self, serializer):
        repair = serializer.save()
        # Create initial status history
        RepairStatusHistory.objects.create(
            repair=repair,
            old_status='',
            new_status=repair.status,
            changed_by=self.request.user,
            note='Repair ticket created'
        )

    @action(detail=True, methods=['post'], permission_classes=[CanUpdateRepairStatus])
    def update_status(self, request, pk=None):
        """Update repair status with validation."""
        repair = self.get_object()
        serializer = RepairStatusUpdateSerializer(data=request.data, context={'repair': repair})
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        old_status = repair.status

        with transaction.atomic():
            repair.status = new_status
            now = timezone.now()

            # Update timestamp fields based on new status
            if new_status == RepairStatus.DIAGNOSIS:
                repair.diagnosed_at = now
            elif new_status == RepairStatus.APPROVED:
                repair.approved_at = now
            elif new_status == RepairStatus.REPAIRING:
                repair.started_at = now
            elif new_status == RepairStatus.TESTING:
                repair.tested_at = now
            elif new_status == RepairStatus.READY:
                repair.ready_at = now
            elif new_status == RepairStatus.DELIVERED:
                repair.delivered_at = now
                repair.completed_at = now
            elif new_status == RepairStatus.CANCELLED:
                repair.cancelled_at = now

            repair.save()

            # Create status history
            RepairStatusHistory.objects.create(
                repair=repair,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                note=note
            )

            # Update public tracking if exists
            PublicRepairTracking.objects.filter(matricule=repair.tracking_matricule).update(
                status=new_status,
                status_label=dict(RepairStatus.choices).get(new_status),
                last_updated=now,
                is_ready_for_pickup=new_status in [RepairStatus.READY, RepairStatus.DELIVERED]
            )

        return Response(RepairDetailSerializer(repair, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Get repair status history."""
        repair = self.get_object()
        history = repair.status_history.all()
        serializer = RepairStatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[CanManageRepairParts])
    def add_part(self, request, pk=None):
        """Add a part to the repair."""
        repair = self.get_object()
        serializer = RepairPartCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.inventory.models import Product, InventoryMovement

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        unit_price = serializer.validated_data['unit_price']

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)

            if product.stock_quantity < quantity:
                return Response(
                    {'detail': 'Insufficient stock.', 'code': 'INSUFFICIENT_STOCK'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            product.stock_quantity -= quantity
            product.save(update_fields=['stock_quantity', 'updated_at'])

            part = RepairPart.objects.create(
                repair=repair,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=unit_price * quantity,
                added_by=request.user,
            )

            InventoryMovement.objects.create(
                product=product,
                movement_type=InventoryMovement.MovementType.REPAIR_USAGE,
                quantity=-quantity,
                reference_type='repair',
                reference_id=repair.id,
                reason=f'Part used in repair {repair.ticket_number}',
                created_by=request.user,
            )

        return Response(RepairPartSerializer(part).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[CanManageRepairParts], url_path='parts/(?P<part_id>[^/.]+)')
    def remove_part(self, request, pk=None, part_id=None):
        """Remove a part from the repair and restore stock."""
        repair = self.get_object()

        try:
            part = repair.parts.get(id=part_id)
        except RepairPart.DoesNotExist:
            return Response(
                {'detail': 'Part not found.', 'code': 'PART_NOT_FOUND'},
                status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=part.product.pk)
            product.stock_quantity += part.quantity
            product.save(update_fields=['stock_quantity', 'updated_at'])

            from apps.inventory.models import InventoryMovement
            InventoryMovement.objects.create(
                product=product,
                movement_type=InventoryMovement.MovementType.RETURN,
                quantity=part.quantity,
                reference_type='repair',
                reference_id=repair.id,
                reason=f'Part returned from repair {repair.ticket_number}',
                created_by=request.user,
            )

            part.delete()

        return Response({'detail': 'Part removed and stock restored.'})

    @action(detail=True, methods=['post'])
    def add_image(self, request, pk=None):
        """Add an image to the repair."""
        repair = self.get_object()
        serializer = RepairImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(repair=repair, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def remove_image(self, request, pk=None, image_id=None):
        """Remove an image from the repair."""
        repair = self.get_object()
        try:
            image = repair.images.get(id=image_id)
            image.delete()
            return Response({'detail': 'Image removed.'})
        except RepairImage.DoesNotExist:
            return Response(
                {'detail': 'Image not found.', 'code': 'IMAGE_NOT_FOUND'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_repairs(self, request):
        """Get repairs assigned to current technician."""
        if not request.user.is_technician:
            return Response(
                {'detail': 'Only technicians can access this endpoint.', 'code': 'PERMISSION_DENIED'},
                status=status.HTTP_403_FORBIDDEN
            )

        repairs = self.get_queryset().filter(technician=request.user)
        page = self.paginate_queryset(repairs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(repairs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get repair dashboard statistics."""
        user = request.user
        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'received': queryset.filter(status=RepairStatus.RECEIVED).count(),
            'diagnosis': queryset.filter(status=RepairStatus.DIAGNOSIS).count(),
            'waiting_customer': queryset.filter(status=RepairStatus.WAITING_CUSTOMER).count(),
            'approved': queryset.filter(status=RepairStatus.APPROVED).count(),
            'repairing': queryset.filter(status=RepairStatus.REPAIRING).count(),
            'testing': queryset.filter(status=RepairStatus.TESTING).count(),
            'ready': queryset.filter(status=RepairStatus.READY).count(),
            'delivered': queryset.filter(status=RepairStatus.DELIVERED).count(),
            'cancelled': queryset.filter(status=RepairStatus.CANCELLED).count(),
        }

        if user.is_technician:
            my_repairs = queryset.filter(technician=user)
            stats['my_active'] = my_repairs.exclude(
                status__in=[RepairStatus.DELIVERED, RepairStatus.CANCELLED]
            ).count()

        return Response(stats)


class RepairImageViewSet(viewsets.ModelViewSet):
    """ViewSet for Repair Image management."""

    queryset = RepairImage.objects.all()
    serializer_class = RepairImageSerializer
    permission_classes = [IsTechnicianOrOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['repair']


class RepairPartViewSet(viewsets.ModelViewSet):
    """ViewSet for Repair Part management."""

    queryset = RepairPart.objects.all()
    permission_classes = [CanManageRepairParts]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['repair']

    def get_serializer_class(self):
        if self.action == 'create':
            return RepairPartCreateSerializer
        return RepairPartSerializer


class PublicRepairTrackingViewSet(viewsets.GenericViewSet):
    """Public API for customer repair tracking."""

    permission_classes = [AllowAny]
    throttle_scope = 'public_tracking'

    def get_throttles(self):
        from rest_framework.throttling import AnonRateThrottle
        return [AnonRateThrottle()]

    @action(detail=False, methods=['get'], url_path='status')
    def track(self, request):
        """Track repair by matricule."""
        serializer = PublicRepairStatusSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        matricule = serializer.validated_data['matricule']

        try:
            tracking = PublicRepairTracking.objects.get(matricule=matricule)
        except PublicRepairTracking.DoesNotExist:
            return Response(
                {'detail': 'Repair tracking information not found.', 'code': 'TRACKING_NOT_FOUND'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PublicRepairTrackingSerializer(tracking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='history/(?P<matricule>[^/.]+)')
    def history(self, request, matricule=None):
        """Get public status history for a repair."""
        matricule = matricule.upper().strip()

        try:
            repair = RepairTicket.objects.get(tracking_matricule=matricule)
        except RepairTicket.DoesNotExist:
            return Response(
                {'detail': 'Repair tracking information not found.', 'code': 'TRACKING_NOT_FOUND'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only return public-safe history
        history = repair.status_history.filter(
            new_status__in=[
                RepairStatus.RECEIVED, RepairStatus.DIAGNOSIS,
                RepairStatus.WAITING_CUSTOMER, RepairStatus.APPROVED,
                RepairStatus.REPAIRING, RepairStatus.TESTING,
                RepairStatus.READY, RepairStatus.DELIVERED
            ]
        ).order_by('created_at')

        public_history = []
        for h in history:
            public_history.append({
                'status': h.new_status,
                'status_label': h.get_new_status_display(),
                'date': h.created_at,
            })

        return Response({
            'matricule': matricule,
            'history': public_history,
        })