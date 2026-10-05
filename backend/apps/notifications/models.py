"""
Notification models for STAR STORE MANAGER.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Employee


class Notification(models.Model):
    """System notifications for employees."""
    class Type(models.TextChoices):
        INFO = 'info', _('Information')
        WARNING = 'warning', _('Avertissement')
        SUCCESS = 'success', _('Succès')
        ERROR = 'error', _('Erreur')
        LOW_STOCK = 'low_stock', _('Stock faible')
        REPAIR_READY = 'repair_ready', _('Réparation prête')
        REPAIR_ASSIGNED = 'repair_assigned', _('Réparation assignée')
        REPAIR_WAITING = 'repair_waiting', _('En attente client')
        PAYMENT_PENDING = 'payment_pending', _('Paiement en attente')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('employee')
    )
    title = models.CharField(_('title'), max_length=200)
    message = models.TextField(_('message'))
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=Type.choices,
        default=Type.INFO
    )
    is_read = models.BooleanField(_('read'), default=False)
    reference_type = models.CharField(_('reference type'), max_length=50, blank=True)
    reference_id = models.UUIDField(_('reference ID'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'is_read']),
            models.Index(fields=['employee', 'created_at']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.title} - {self.employee.get_full_name()}"


def create_notification(employee, title, message, type=Notification.Type.INFO, reference_type='', reference_id=None):
    """Helper function to create notifications."""
    return Notification.objects.create(
        employee=employee,
        title=title,
        message=message,
        type=type,
        reference_type=reference_type,
        reference_id=reference_id,
    )


def notify_low_stock(product):
    """Notify managers about low stock."""
    from apps.accounts.models import Employee
    managers = Employee.objects.filter(role__in=[Employee.Role.ADMIN, Employee.Role.MANAGER], is_active=True)
    for manager in managers:
        create_notification(
            employee=manager,
            title="Stock faible",
            message=f"Le produit '{product.name}' (SKU: {product.sku}) a un stock de {product.stock_quantity} (minimum: {product.minimum_stock}).",
            type=Notification.Type.LOW_STOCK,
            reference_type='product',
            reference_id=product.id,
        )


def notify_repair_assigned(repair):
    """Notify technician about assigned repair."""
    if repair.technician:
        create_notification(
            employee=repair.technician,
            title="Nouvelle réparation assignée",
            message=f"La réparation {repair.ticket_number} pour {repair.customer.get_full_name()} vous a été assignée.",
            type=Notification.Type.REPAIR_ASSIGNED,
            reference_type='repair',
            reference_id=repair.id,
        )


def notify_repair_waiting_customer(repair):
    """Notify about repair waiting for customer."""
    from apps.accounts.models import Employee
    managers = Employee.objects.filter(role__in=[Employee.Role.ADMIN, Employee.Role.MANAGER], is_active=True)
    for manager in managers:
        create_notification(
            employee=manager,
            title="Réparation en attente client",
            message=f"La réparation {repair.ticket_number} attend l'approbation du client.",
            type=Notification.Type.REPAIR_WAITING,
            reference_type='repair',
            reference_id=repair.id,
        )


def notify_repair_ready(repair):
    """Notify about repair ready for pickup."""
    from apps.accounts.models import Employee
    # Notify managers
    managers = Employee.objects.filter(role__in=[Employee.Role.ADMIN, Employee.Role.MANAGER], is_active=True)
    for manager in managers:
        create_notification(
            employee=manager,
            title="Réparation prête",
            message=f"La réparation {repair.ticket_number} est prête à être récupérée par {repair.customer.get_full_name()}.",
            type=Notification.Type.REPAIR_READY,
            reference_type='repair',
            reference_id=repair.id,
        )


def notify_payment_pending(sale):
    """Notify about pending payment."""
    from apps.accounts.models import Employee
    sales_team = Employee.objects.filter(role__in=[Employee.Role.ADMIN, Employee.Role.MANAGER, Employee.Role.SALES], is_active=True)
    for employee in sales_team:
        create_notification(
            employee=employee,
            title="Paiement en attente",
            message=f"La vente {sale.sale_number} de {sale.customer.get_full_name()} a un paiement en attente de {sale.remaining_amount:.3f} TND.",
            type=Notification.Type.PAYMENT_PENDING,
            reference_type='sale',
            reference_id=sale.id,
        )