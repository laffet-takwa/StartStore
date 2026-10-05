"""
Signals for repairs app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RepairTicket, PublicRepairTracking, RepairStatus


@receiver(post_save, sender=RepairTicket)
def sync_public_tracking(sender, instance, created, **kwargs):
    """Sync PublicRepairTracking with RepairTicket."""
    if not instance.tracking_matricule:
        return

    tracking, created = PublicRepairTracking.objects.get_or_create(
        matricule=instance.tracking_matricule,
        defaults={
            'device_type': instance.device.device_type if instance.device else '',
            'brand': instance.device.brand if instance.device else '',
            'model': instance.device.model if instance.device else '',
            'status': instance.status,
            'status_label': dict(RepairStatus.choices).get(instance.status, ''),
            'received_at': instance.received_at,
            'estimated_completion_date': instance.estimated_completion_date,
            'last_updated': instance.updated_at,
            'is_ready_for_pickup': instance.status in [RepairStatus.READY, RepairStatus.DELIVERED],
        }
    )

    if not created:
        tracking.device_type = instance.device.device_type if instance.device else ''
        tracking.brand = instance.device.brand if instance.device else ''
        tracking.model = instance.device.model if instance.device else ''
        tracking.status = instance.status
        tracking.status_label = dict(RepairStatus.choices).get(instance.status, '')
        tracking.estimated_completion_date = instance.estimated_completion_date
        tracking.last_updated = instance.updated_at
        tracking.is_ready_for_pickup = instance.status in [RepairStatus.READY, RepairStatus.DELIVERED]
        tracking.save()