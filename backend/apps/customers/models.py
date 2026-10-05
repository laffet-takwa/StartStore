"""
Customer and Device models for STAR STORE MANAGER.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Employee


class Governorate(models.TextChoices):
    """Tunisian governorates."""
    ARIANA = 'ariana', _('Ariana')
    BEJA = 'beja', _('Béja')
    BEN_AROUS = 'ben_arous', _('Ben Arous')
    BIZERTE = 'bizerte', _('Bizerte')
    GABES = 'gabes', _('Gabès')
    GAFSA = 'gafsa', _('Gafsa')
    JENDOUBA = 'jendouba', _('Jendouba')
    KAIROUAN = 'kairouan', _('Kairouan')
    KASSERINE = 'kasserine', _('Kasserine')
    KEBILI = 'kebili', _('Kébili')
    KEF = 'kef', _('Le Kef')
    MAHDIA = 'mahdia', _('Mahdia')
    MANOUBA = 'manouba', _('Manouba')
    MEDENINE = 'medenine', _('Medenine')
    MONASTIR = 'monastir', _('Monastir')
    NABEUL = 'nabeul', _('Nabeul')
    SFAX = 'sfax', _('Sfax')
    SIDI_BOUZID = 'sidi_bouzid', _('Sidi Bouzid')
    SILIANA = 'siliana', _('Siliana')
    SOUSSE = 'sousse', _('Sousse')
    TATAOUINE = 'tataouine', _('Tataouine')
    TOZEUR = 'tozeur', _('Tozeur')
    TUNIS = 'tunis', _('Tunis')
    ZAGHOUAN = 'zaghouan', _('Zaghouan')


class DeviceType(models.TextChoices):
    """Types of devices."""
    LAPTOP = 'laptop', _('Laptop')
    DESKTOP = 'desktop', _('Desktop')
    TABLET = 'tablet', _('Tablet')
    PRINTER = 'printer', _('Printer')
    SERVER = 'server', _('Server')
    PHONE = 'phone', _('Phone')
    OTHER = 'other', _('Other')


class Customer(models.Model):
    """
    Customer model for STAR STORE.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(_('first name'), max_length=100)
    last_name = models.CharField(_('last name'), max_length=100)
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'), blank=True)
    company_name = models.CharField(_('company name'), max_length=200, blank=True)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    governorate = models.CharField(
        _('governorate'),
        max_length=20,
        choices=Governorate.choices,
        blank=True
    )
    postal_code = models.CharField(_('postal code'), max_length=10, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('customer')
        verbose_name_plural = _('customers')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['governorate']),
        ]

    def __str__(self):
        name = self.get_full_name()
        if self.company_name:
            return f"{name} ({self.company_name})"
        return name

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def device_count(self):
        return self.devices.count()

    @property
    def repair_count(self):
        return self.repairs.count()

    @property
    def total_spent(self):
        from django.db.models import Sum
        from apps.sales.models import Sale
        result = Sale.objects.filter(customer=self, status=Sale.Status.CONFIRMED).aggregate(
            total=Sum('total')
        )
        return result['total'] or 0


class Device(models.Model):
    """
    Customer device model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='devices',
        verbose_name=_('customer')
    )
    device_type = models.CharField(
        _('device type'),
        max_length=20,
        choices=DeviceType.choices
    )
    brand = models.CharField(_('brand'), max_length=100)
    model = models.CharField(_('model'), max_length=100)
    serial_number = models.CharField(_('serial number'), max_length=100, blank=True)
    device_password = models.CharField(_('device password'), max_length=200, blank=True)
    accessories = models.TextField(_('accessories'), blank=True)
    physical_condition = models.TextField(_('physical condition'), blank=True)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('device')
        verbose_name_plural = _('devices')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'device_type']),
            models.Index(fields=['serial_number']),
            models.Index(fields=['brand', 'model']),
        ]

    def __str__(self):
        return f"{self.get_device_type_display()} - {self.brand} {self.model} ({self.customer.get_full_name()})"

    @property
    def repair_count(self):
        return self.repairs.count()

    @property
    def last_repair(self):
        return self.repairs.order_by('-created_at').first()