"""
Serializers for inventory app.
"""
from rest_framework import serializers
from .models import Category, Supplier, Product, ProductImage, InventoryMovement


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'is_active', 'product_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for category lists."""

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'is_active']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email',
            'address', 'city', 'notes', 'is_active',
            'product_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupplierListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for supplier lists."""

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'is_active']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model."""

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'barcode', 'name', 'brand',
            'category', 'category_name', 'supplier', 'supplier_name',
            'selling_price', 'stock_quantity', 'minimum_stock',
            'is_low_stock', 'image', 'is_active', 'created_at',
        ]


class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer with nested images."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    stock_value = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'supplier', 'supplier_name',
            'name', 'sku', 'barcode', 'brand', 'description',
            'purchase_price', 'selling_price', 'stock_quantity',
            'minimum_stock', 'is_low_stock', 'stock_value',
            'image', 'images', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""

    class Meta:
        model = Product
        fields = [
            'category', 'supplier', 'name', 'sku', 'barcode', 'brand',
            'description', 'purchase_price', 'selling_price',
            'stock_quantity', 'minimum_stock', 'image',
        ]

    def validate_sku(self, value):
        if Product.objects.filter(sku=value).exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value

    def validate_barcode(self, value):
        if value and Product.objects.filter(barcode=value).exists():
            raise serializers.ValidationError("A product with this barcode already exists.")
        return value


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating products."""

    class Meta:
        model = Product
        fields = [
            'category', 'supplier', 'name', 'sku', 'barcode', 'brand',
            'description', 'purchase_price', 'selling_price',
            'minimum_stock', 'image', 'is_active',
        ]

    def validate_sku(self, value):
        instance = self.instance
        if Product.objects.filter(sku=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value

    def validate_barcode(self, value):
        instance = self.instance
        if value and Product.objects.filter(barcode=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("A product with this barcode already exists.")
        return value


class InventoryMovementSerializer(serializers.ModelSerializer):
    """Serializer for InventoryMovement model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    movement_type_label = serializers.CharField(source='get_movement_type_display', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'movement_type', 'movement_type_label', 'quantity',
            'reference_type', 'reference_id', 'reason',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class InventoryAdjustmentSerializer(serializers.Serializer):
    """Serializer for manual inventory adjustments."""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(help_text="Positive for increase, negative for decrease")
    reason = serializers.CharField(max_length=500)

    def validate(self, attrs):
        from .models import Product
        try:
            product = Product.objects.get(id=attrs['product_id'])
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")

        new_quantity = product.stock_quantity + attrs['quantity']
        if new_quantity < 0:
            raise serializers.ValidationError("Adjustment would result in negative stock.")

        attrs['product'] = product
        return attrs