"""
Invoice models for STAR STORE MANAGER.
"""
import uuid
import secrets
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.customers.models import Customer
from apps.sales.models import Sale
from apps.repairs.models import RepairTicket


class Invoice(models.Model):
    """Invoice model for sales and repairs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(_('invoice number'), max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='invoices',
        verbose_name=_('customer')
    )
    sale = models.ForeignKey(
        Sale,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name=_('sale')
    )
    repair = models.ForeignKey(
        RepairTicket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name=_('repair')
    )
    subtotal = models.DecimalField(_('subtotal'), max_digits=12, decimal_places=3, default=0)
    discount = models.DecimalField(_('discount'), max_digits=12, decimal_places=3, default=0)
    tax = models.DecimalField(_('tax'), max_digits=12, decimal_places=3, default=0)
    total = models.DecimalField(_('total'), max_digits=12, decimal_places=3, default=0)
    issued_at = models.DateTimeField(_('issued at'), default=timezone.now)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('invoice')
        verbose_name_plural = _('invoices')
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['customer', 'issued_at']),
            models.Index(fields=['sale']),
            models.Index(fields=['repair']),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.get_full_name()} - {self.total} TND"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    def generate_invoice_number(self):
        """Generate unique invoice number: INV-YYYYMMDD-XXXXXX"""
        date_part = timezone.now().strftime('%Y%m%d')
        random_part = secrets.token_hex(3).upper()
        invoice_number = f"INV-{date_part}-{random_part}"

        while Invoice.objects.filter(invoice_number=invoice_number).exists():
            random_part = secrets.token_hex(3).upper()
            invoice_number = f"INV-{date_part}-{random_part}"

        return invoice_number

    @classmethod
    def create_from_sale(cls, sale, notes=''):
        """Create invoice from confirmed sale."""
        from django.db import transaction

        with transaction.atomic():
            invoice = cls.objects.create(
                customer=sale.customer,
                sale=sale,
                subtotal=sale.subtotal,
                discount=sale.discount,
                tax=sale.tax,
                total=sale.total,
                notes=notes,
            )
            return invoice

    @classmethod
    def create_from_repair(cls, repair, notes=''):
        """Create invoice from completed repair."""
        from django.db import transaction

        with transaction.atomic():
            final_cost = repair.final_cost or repair.estimated_cost or 0
            invoice = cls.objects.create(
                customer=repair.customer,
                repair=repair,
                subtotal=final_cost,
                discount=0,
                tax=0,
                total=final_cost,
                notes=notes,
            )
            return invoice