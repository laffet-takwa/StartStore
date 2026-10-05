"""
Serializers for accounts app.
"""
from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee model."""
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'avatar', 'is_active',
            'is_staff', 'date_joined', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for employee lists."""
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'avatar', 'is_active',
            'created_at',
        ]


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employees."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Employee
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'role', 'password', 'avatar',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        employee = Employee.objects.create_user(**validated_data, password=password)
        return employee


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating employees."""

    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'phone', 'role', 'avatar', 'is_active',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials', code='authentication_failed')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled', code='account_disabled')
        else:
            raise serializers.ValidationError('Must include email and password', code='missing_credentials')
        attrs['user'] = user
        return attrs