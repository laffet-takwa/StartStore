"""
Repair models for STAR STORE MANAGER - Core module.
"""
import uuid
import secrets
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from apps.customers.models import Customer, Device
from apps.accounts.models import Employee


class RepairStatus(models.TextChoices):
    """Repair status workflow."""
    RECEIVED = 'received', _('Reçu')
    DIAGNOSIS = 'diagnosis', _('Diagnostic')
    WAITING_CUSTOMER = 'waiting_customer', _('En attente du client')
    APPROVED = 'approved', _('Réparation approuvée')
    REPAIRING = 'repairing', _('En réparation')
    TESTING = 'testing', _('Test en cours')
    READY = 'ready', _('Prêt à récupérer')
    DELIVERED = 'delivered', _('Livré')
    CANCELLED = 'cancelled', _('Annulé')


class RepairTicket(models.Model):
    """
    Main repair ticket model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(_('ticket number'), max_length=30, unique=True, editable=False)
    tracking_matricule = models.CharField(_('tracking matricule'), max_length=30, unique=True, editable=False)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='repairs',
        verbose_name=_('customer')
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.PROTECT,
        related_name='repairs',
        verbose_name=_('device')
    )
    technician = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_repairs',
        verbose_name=_('technician')
    )

    problem_description = models.TextField(_('problem description'))
    diagnosis = models.TextField(_('diagnosis'), blank=True)
    repair_solution = models.TextField(_('repair solution'), blank=True)
    internal_notes = models.TextField(_('internal notes'), blank=True)

    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RepairStatus.choices,
        default=RepairStatus.RECEIVED
    )

    estimated_cost = models.DecimalField(_('estimated cost'), max_digits=12, decimal_places=3, default=0)
    final_cost = models.DecimalField(_('final cost'), max_digits=12, decimal_places=3, null=True, blank=True)

    estimated_completion_date = models.DateField(_('estimated completion date'), null=True, blank=True)

    received_at = models.DateTimeField(_('received at'), default=timezone.now)
    diagnosed_at = models.DateTimeField(_('diagnosed at'), null=True, blank=True)
    approved_at = models.DateTimeField(_('approved at'), null=True, blank=True)
    started_at = models.DateTimeField(_('started at'), null=True, blank=True)
    tested_at = models.DateTimeField(_('tested at'), null=True, blank=True)
    ready_at = models.DateTimeField(_('ready at'), null=True, blank=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    delivered_at = models.DateTimeField(_('delivered at'), null=True, blank=True)
    cancelled_at = models.DateTimeField(_('cancelled at'), null=True, blank=True)

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('repair ticket')
        verbose_name_plural = _('repair tickets')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['tracking_matricule']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['technician', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['received_at']),
        ]

    def __str__(self):
        return f"{self.ticket_number} - {self.customer.get_full_name()} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
        if not self.tracking_matricule:
            self.tracking_matricule = self.generate_tracking_matricule()
        super().save(*args, **kwargs)

    def generate_ticket_number(self):
        """Generate unique ticket number: REP-YYYYMMDD-XXXXXX"""
        date_part = timezone.now().strftime('%Y%m%d')
        random_part = secrets.token_hex(3).upper()
        ticket_number = f"REP-{date_part}-{random_part}"

        # Ensure uniqueness
        while RepairTicket.objects.filter(ticket_number=ticket_number).exists():
            random_part = secrets.token_hex(3).upper()
            ticket_number = f"REP-{date_part}-{random_part}"

        return ticket_number

    def generate_tracking_matricule(self):
        """Generate unique customer-facing tracking matricule: ST-YYYYMMDD-XXXXXX"""
        date_part = timezone.now().strftime('%Y%m%d')
        random_part = secrets.token_hex(3).upper()
        matricule = f"ST-{date_part}-{random_part}"

        # Ensure uniqueness
        while RepairTicket.objects.filter(tracking_matricule=matricule).exists():
            random_part = secrets.token_hex(3).upper()
            matricule = f"ST-{date_part}-{random_part}"

        return matricule

    @property
    def is_active(self):
        """Check if repair is in active workflow."""
        return self.status not in [RepairStatus.DELIVERED, RepairStatus.CANCELLED]

    @property
    def can_transition(self):
        """Get valid next statuses based on current status."""
        transitions = {
            RepairStatus.RECEIVED: [RepairStatus.DIAGNOSIS, RepairStatus.CANCELLED],
            RepairStatus.DIAGNOSIS: [RepairStatus.WAITING_CUSTOMER, RepairStatus.CANCELLED],
            RepairStatus.WAITING_CUSTOMER: [RepairStatus.APPROVED, RepairStatus.CANCELLED],
            RepairStatus.APPROVED: [RepairStatus.REPAIRING, RepairStatus.CANCELLED],
            RepairStatus.REPAIRING: [RepairStatus.TESTING, RepairStatus.WAITING_CUSTOMER, RepairStatus.CANCELLED],
            RepairStatus.TESTING: [RepairStatus.READY, RepairStatus.REPAIRING, RepairStatus.CANCELLED],
            RepairStatus.READY: [RepairStatus.DELIVERED, RepairStatus.CANCELLED],
            RepairStatus.DELIVERED: [],
            RepairStatus.CANCELLED: [],
        }
        return transitions.get(self.status, [])


class RepairImage(models.Model):
    """
    Images attached to a repair ticket.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        RepairTicket,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('repair')
    )
    image = models.ImageField(_('image'), upload_to='repairs/%Y/%m/%d/')
    caption = models.CharField(_('caption'), max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_repair_images',
        verbose_name=_('uploaded by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('repair image')
        verbose_name_plural = _('repair images')
        ordering = ['-created_at']

    def __str__(self):
        return f"Image for {self.repair.ticket_number}"


class RepairPart(models.Model):
    """
    Parts used in a repair.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        RepairTicket,
        on_delete=models.CASCADE,
        related_name='parts',
        verbose_name=_('repair')
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        related_name='repair_parts',
        verbose_name=_('product')
    )
    quantity = models.PositiveIntegerField(_('quantity'), default=1)
    unit_price = models.DecimalField(_('unit price'), max_digits=12, decimal_places=3)
    total_price = models.DecimalField(_('total price'), max_digits=12, decimal_places=3)
    added_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='added_repair_parts',
        verbose_name=_('added by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('repair part')
        verbose_name_plural = _('repair parts')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} x{self.quantity} for {self.repair.ticket_number}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class RepairStatusHistory(models.Model):
    """
    Audit trail for repair status changes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        RepairTicket,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name=_('repair')
    )
    old_status = models.CharField(_('old status'), max_length=20, choices=RepairStatus.choices)
    new_status = models.CharField(_('new status'), max_length=20, choices=RepairStatus.choices)
    changed_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='status_changes',
        verbose_name=_('changed by')
    )
    note = models.TextField(_('note'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('repair status history')
        verbose_name_plural = _('repair status histories')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['repair', 'created_at']),
        ]

    def __str__(self):
        return f"{self.repair.ticket_number}: {self.get_old_status_display()} → {self.get_new_status_display()}"


class PublicRepairTracking(models.Model):
    """
    Minimal public tracking information for customer-facing tracking.
    This is a view-like model that can be used for fast public lookups.
    """
    matricule = models.CharField(_('matricule'), max_length=30, unique=True)
    device_type = models.CharField(_('device type'), max_length=20)
    brand = models.CharField(_('brand'), max_length=100)
    model = models.CharField(_('model'), max_length=100)
    status = models.CharField(_('status'), max_length=20, choices=RepairStatus.choices)
    status_label = models.CharField(_('status label'), max_length=50)
    received_at = models.DateTimeField(_('received at'))
    estimated_completion_date = models.DateField(_('estimated completion date'), null=True, blank=True)
    last_updated = models.DateTimeField(_('last updated'))
    is_ready_for_pickup = models.BooleanField(_('ready for pickup'), default=False)

    class Meta:
        verbose_name = _('public repair tracking')
        verbose_name_plural = _('public repair tracking')
        indexes = [
            models.Index(fields=['matricule']),
        ]

    def __str__(self):
        return f"{self.matricule} - {self.status_label}"