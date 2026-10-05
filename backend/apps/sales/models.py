"""
Sales models for STAR STORE MANAGER.
"""
import uuid
import secrets
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.customers.models import Customer
from apps.accounts.models import Employee
from apps.repairs.models import RepairTicket


class Sale(models.Model):
    """Sale model for POS."""
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Brouillon')
        CONFIRMED = 'confirmed', _('Confirmé')
        CANCELLED = 'cancelled', _('Annulé')

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', _('Non payé')
        PARTIAL = 'partial', _('Partiellement payé')
        PAID = 'paid', _('Payé')
        REFUNDED = 'refunded', _('Remboursé')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale_number = models.CharField(_('sale number'), max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales',
        verbose_name=_('customer')
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales',
        verbose_name=_('employee')
    )
    subtotal = models.DecimalField(_('subtotal'), max_digits=12, decimal_places=3, default=0)
    discount = models.DecimalField(_('discount'), max_digits=12, decimal_places=3, default=0)
    tax = models.DecimalField(_('tax'), max_digits=12, decimal_places=3, default=0)
    total = models.DecimalField(_('total'), max_digits=12, decimal_places=3, default=0)
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    payment_status = models.CharField(
        _('payment status'),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    confirmed_at = models.DateTimeField(_('confirmed at'), null=True, blank=True)
    cancelled_at = models.DateTimeField(_('cancelled at'), null=True, blank=True)

    class Meta:
        verbose_name = _('sale')
        verbose_name_plural = _('sales')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sale_number']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.sale_number} - {self.get_status_display()} - {self.total} TND"

    def save(self, *args, **kwargs):
        if not self.sale_number:
            self.sale_number = self.generate_sale_number()
        super().save(*args, **kwargs)

    def generate_sale_number(self):
        """Generate unique sale number: SALE-YYYYMMDD-XXXXXX"""
        date_part = timezone.now().strftime('%Y%m%d')
        random_part = secrets.token_hex(3).upper()
        sale_number = f"SALE-{date_part}-{random_part}"

        while Sale.objects.filter(sale_number=sale_number).exists():
            random_part = secrets.token_hex(3).upper()
            sale_number = f"SALE-{date_part}-{random_part}"

        return sale_number

    @property
    def paid_amount(self):
        from django.db.models import Sum
        from .models import Payment
        result = Payment.objects.filter(sale=self).aggregate(total=Sum('amount'))
        return result['total'] or 0

    @property
    def remaining_amount(self):
        return self.total - self.paid_amount

    def update_payment_status(self):
        """Update payment status based on payments."""
        paid = self.paid_amount
        if paid <= 0:
            self.payment_status = self.PaymentStatus.UNPAID
        elif paid >= self.total:
            self.payment_status = self.PaymentStatus.PAID
        else:
            self.payment_status = self.PaymentStatus.PARTIAL
        self.save(update_fields=['payment_status', 'updated_at'])


class SaleItem(models.Model):
    """Individual items in a sale."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('sale')
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        related_name='sale_items',
        verbose_name=_('product')
    )
    quantity = models.PositiveIntegerField(_('quantity'))
    unit_price = models.DecimalField(_('unit price'), max_digits=12, decimal_places=3)
    discount = models.DecimalField(_('discount'), max_digits=12, decimal_places=3, default=0)
    total_price = models.DecimalField(_('total price'), max_digits=12, decimal_places=3)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('sale item')
        verbose_name_plural = _('sale items')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.product.name} x{self.quantity} in {self.sale.sale_number}"

    def save(self, *args, **kwargs):
        self.total_price = (self.unit_price * self.quantity) - self.discount
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Payment model for sales and repairs."""
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('Espèces')
        CARD = 'card', _('Carte bancaire')
        BANK_TRANSFER = 'bank_transfer', _('Virement bancaire')
        OTHER = 'other', _('Autre')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='payments',
        verbose_name=_('sale')
    )
    repair = models.ForeignKey(
        RepairTicket,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='payments',
        verbose_name=_('repair')
    )
    amount = models.DecimalField(_('amount'), max_digits=12, decimal_places=3)
    payment_method = models.CharField(
        _('payment method'),
        max_length=20,
        choices=PaymentMethod.choices
    )
    reference = models.CharField(_('reference'), max_length=100, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    paid_at = models.DateTimeField(_('paid at'), default=timezone.now)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('payment')
        verbose_name_plural = _('payments')
        ordering = ['-paid_at']
        indexes = [
            models.Index(fields=['sale', 'paid_at']),
            models.Index(fields=['repair', 'paid_at']),
            models.Index(fields=['payment_method']),
        ]

    def __str__(self):
        target = self.sale.sale_number if self.sale else f"Repair {self.repair.ticket_number}"
        return f"{self.amount} TND - {target} ({self.get_payment_method_display()})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.sale and not self.repair:
            raise ValidationError("Payment must be linked to either a sale or a repair.")
        if self.sale and self.repair:
            raise ValidationError("Payment cannot be linked to both a sale and a repair.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

        # Update sale payment status
        if self.sale:
            self.sale.update_payment_status()

        # Update repair final cost if fully paid
        if self.repair:
            from django.db.models import Sum
            paid = self.repair.payments.aggregate(total=Sum('amount'))['total'] or 0
            if paid >= (self.repair.final_cost or self.repair.estimated_cost or 0):
                self.repair.final_cost = paid
                self.repair.save(update_fields=['final_cost', 'updated_at'])