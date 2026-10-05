"""
Permissions for repairs app.
"""
from rest_framework import permissions
from apps.accounts.permissions import IsTechnicianOrAbove, IsSalesOrAbove


class IsTechnicianOrOwner(permissions.BasePermission):
    """
    Allow access to:
    - Technicians for their assigned repairs
    - Managers and admins for all repairs
    - Sales for viewing repairs of their customers
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_technician or request.user.is_manager or request.user.is_admin or request.user.is_sales

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin or request.user.is_manager:
            return True
        if request.user.is_technician:
            # Technicians can only access their assigned repairs
            return obj.technician == request.user
        if request.user.is_sales:
            # Sales can access repairs of their customers
            return True
        return False


class CanManageRepairParts(permissions.BasePermission):
    """Permission to add/remove repair parts."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_technician or request.user.is_manager or request.user.is_admin


class CanUpdateRepairStatus(permissions.BasePermission):
    """Permission to update repair status."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_technician or request.user.is_manager or request.user.is_admin

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin or request.user.is_manager:
            return True
        if request.user.is_technician:
            # Technicians can update status of their assigned repairs
            return obj.technician == request.user
        return False