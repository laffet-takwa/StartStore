"""
Views for audit app.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.accounts.permissions import IsManagerOrAdmin


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for AuditLog (read-only)."""

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'action', 'entity_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return AuditLog.objects.select_related('employee').all()

    @action(detail=False, methods=['get'])
    def entity_history(self, request):
        """Get audit history for a specific entity."""
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')

        if not entity_type or not entity_id:
            return Response(
                {'detail': 'entity_type and entity_id are required.'},
                status=400
            )

        logs = self.get_queryset().filter(
            entity_type=entity_type,
            entity_id=entity_id
        )
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)