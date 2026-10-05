"""
Inventory models for STAR STORE MANAGER.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Employee


class Category(models.Model):
    """Product category model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('name'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True)
    image = models.ImageField(_('image'), upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class Supplier(models.Model):
    """Product supplier model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_('name'), max_length=200)
    contact_person = models.CharField(_('contact person'), max_length=100, blank=True)
    phone = models.CharField(_('phone'), max_length=20, blank=True)
    email = models.EmailField(_('email'), blank=True)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('supplier')
        verbose_name_plural = _('suppliers')
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model for inventory and sales."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_('category')
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_('supplier')
    )
    name = models.CharField(_('name'), max_length=200)
    sku = models.CharField(_('SKU'), max_length=50, unique=True)
    barcode = models.CharField(_('barcode'), max_length=100, unique=True, blank=True, null=True)
    brand = models.CharField(_('brand'), max_length=100, blank=True)
    description = models.TextField(_('description'), blank=True)
    purchase_price = models.DecimalField(_('purchase price'), max_digits=12, decimal_places=3, default=0)
    selling_price = models.DecimalField(_('selling price'), max_digits=12, decimal_places=3, default=0)
    stock_quantity = models.PositiveIntegerField(_('stock quantity'), default=0)
    minimum_stock = models.PositiveIntegerField(_('minimum stock'), default=5)
    image = models.ImageField(_('image'), upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('product')
        verbose_name_plural = _('products')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['barcode']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_active']),
            models.Index(fields=['stock_quantity']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.minimum_stock

    @property
    def stock_value(self):
        return self.stock_quantity * self.purchase_price


class ProductImage(models.Model):
    """Additional images for products."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('product')
    )
    image = models.ImageField(_('image'), upload_to='products/images/')
    alt_text = models.CharField(_('alt text'), max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('product image')
        verbose_name_plural = _('product images')
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"


class InventoryMovement(models.Model):
    """Track all inventory movements for audit trail."""
    class MovementType(models.TextChoices):
        PURCHASE = 'purchase', _('Purchase')
        SALE = 'sale', _('Sale')
        REPAIR_USAGE = 'repair_usage', _('Repair Usage')
        RETURN = 'return', _('Return')
        ADJUSTMENT = 'adjustment', _('Adjustment')
        DAMAGED = 'damaged', _('Damaged')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='inventory_movements',
        verbose_name=_('product')
    )
    movement_type = models.CharField(
        _('movement type'),
        max_length=20,
        choices=MovementType.choices
    )
    quantity = models.IntegerField(_('quantity'))
    reference_type = models.CharField(_('reference type'), max_length=50, blank=True)
    reference_id = models.UUIDField(_('reference ID'), null=True, blank=True)
    reason = models.TextField(_('reason'), blank=True)
    created_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_movements',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('inventory movement')
        verbose_name_plural = _('inventory movements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['reference_type', 'reference_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name} ({self.quantity})"