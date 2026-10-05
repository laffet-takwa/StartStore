"""
Audit models for STAR STORE MANAGER.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Employee


class AuditLog(models.Model):
    """Audit log for tracking important actions."""
    class Action(models.TextChoices):
        CREATE = 'create', _('Création')
        UPDATE = 'update', _('Modification')
        DELETE = 'delete', _('Suppression')
        STATUS_CHANGE = 'status_change', _('Changement de statut')
        LOGIN = 'login', _('Connexion')
        LOGOUT = 'logout', _('Déconnexion')
        CONFIRM = 'confirm', _('Confirmation')
        CANCEL = 'cancel', _('Annulation')
        PAYMENT = 'payment', _('Paiement')
        INVOICE = 'invoice', _('Facturation')
        INVENTORY_ADJUSTMENT = 'inventory_adjustment', _('Ajustement stock')
        EXPORT = 'export', _('Export')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_('employee')
    )
    action = models.CharField(_('action'), max_length=30, choices=Action.choices)
    entity_type = models.CharField(_('entity type'), max_length=50)
    entity_id = models.UUIDField(_('entity ID'), null=True, blank=True)
    old_data = models.JSONField(_('old data'), null=True, blank=True)
    new_data = models.JSONField(_('new data'), null=True, blank=True)
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'created_at']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - {self.entity_type} - {self.created_at}"


def log_action(employee, action, entity_type, entity_id=None, old_data=None, new_data=None, request=None):
    """Helper function to create audit log entries."""
    ip_address = None
    user_agent = ''

    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

    return AuditLog.objects.create(
        employee=employee,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# Signal handlers for automatic audit logging
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from apps.customers.models import Customer, Device
from apps.repairs.models import RepairTicket, RepairPart, RepairStatusHistory
from apps.inventory.models import Product, InventoryMovement
from apps.sales.models import Sale, SaleItem, Payment
from apps.invoices.models import Invoice


# Store old data before save
_pre_save_data = {}


@receiver(pre_save, sender=Customer)
@receiver(pre_save, sender=Device)
@receiver(pre_save, sender=Product)
@receiver(pre_save, sender=RepairTicket)
@receiver(pre_save, sender=Sale)
@receiver(pre_save, sender=Invoice)
def capture_old_data(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            _pre_save_data[(sender, instance.pk)] = {
                field.name: getattr(old_instance, field.name)
                for field in old_instance._meta.fields
                if field.name not in ['created_at', 'updated_at']
            }
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=Customer)
@receiver(post_save, sender=Device)
@receiver(post_save, sender=Product)
@receiver(post_save, sender=RepairTicket)
@receiver(post_save, sender=Sale)
@receiver(post_save, sender=Invoice)
def log_model_save(sender, instance, created, **kwargs):
    if not hasattr(instance, '_audit_user'):
        return

    key = (sender, instance.pk)
    old_data = _pre_save_data.pop(key, None)

    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    entity_type = sender.__name__

    log_action(
        employee=instance._audit_user,
        action=action,
        entity_type=entity_type,
        entity_id=instance.pk,
        old_data=old_data,
        new_data=None,  # Could serialize instance here if needed
    )


@receiver(post_delete, sender=Customer)
@receiver(post_delete, sender=Device)
@receiver(post_delete, sender=Product)
@receiver(post_delete, sender=RepairTicket)
@receiver(post_delete, sender=Sale)
@receiver(post_delete, sender=Invoice)
def log_model_delete(sender, instance, **kwargs):
    # Note: We don't have the user in post_delete, so we'd need middleware or thread-local
    pass