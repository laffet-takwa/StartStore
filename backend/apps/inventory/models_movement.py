from django.db import models

class InventoryMovement(models.Model):
    MOVEMENT_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('repair_usage', 'Repair Usage'),
        ('return', 'Return'),
        ('adjustment', 'Adjustment'),
        ('damaged', 'Damaged'),
    ]

    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE, related_name='inventory_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.PositiveIntegerField()
    reference_type = models.CharField(max_length=50, blank=True, help_text="e.g., 'sale', 'repair', 'adjustment'")
    reference_id = models.UUIDField(blank=True, null=True, help_text="ID of the related object")
    reason = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey('accounts.Employee', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.quantity})"