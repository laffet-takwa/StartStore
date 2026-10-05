"""
Custom permissions for STAR STORE MANAGER.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsManagerOrAdmin(permissions.BasePermission):
    """Allow access to managers and admins."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_manager


class IsTechnicianOrAbove(permissions.BasePermission):
    """Allow access to technicians, managers, and admins."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_technician or request.user.is_manager or request.user.is_admin
        )


class IsSalesOrAbove(permissions.BasePermission):
    """Allow access to sales, managers, and admins."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_sales or request.user.is_manager or request.user.is_admin
        )


class CanManageEmployees(permissions.BasePermission):
    """Permission to manage employees."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Only admins can manage employees
        return request.user.is_admin


class CanViewOwnProfile(permissions.BasePermission):
    """Allow users to view their own profile."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.is_admin or request.user.is_manager


class IsOwnerOrManagerOrAdmin(permissions.BasePermission):
    """Allow object owner, managers, and admins."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin or request.user.is_manager:
            return True
        # Check if the object has a user/employee field
        if hasattr(obj, 'employee'):
            return obj.employee == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class ReadOnlyOrManagerOrAdmin(permissions.BasePermission):
    """Allow read-only access to all authenticated users, write to managers and admins."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_manager or request.user.is_admin