"""Reusable DRF permission classes.

Every rule in the StartStore specification maps to one of these so that the
same logic is never re-implemented inside a view.
"""

from __future__ import annotations

from collections.abc import Sequence

from rest_framework import permissions


def is_admin(user) -> bool:
    """Return whether ``user`` may perform staff level operations.

    ``role`` is the single source of truth: there is no ``is_staff`` column in
    ``public.profiles``, so :attr:`accounts.models.Profile.is_staff` is derived
    from it.
    """
    return bool(getattr(user, "is_admin", False))


class IsAdmin(permissions.BasePermission):
    """Allow staff members only."""

    message = "Administrator privileges are required for this operation."

    def has_permission(self, request, view) -> bool:
        return is_admin(request.user)


class IsCustomer(permissions.BasePermission):
    """Allow authenticated customers only (staff are rejected)."""

    message = "A customer account is required for this operation."

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return not is_admin(user)


class IsOwner(permissions.BasePermission):
    """Object level guard: the request user must own the object.

    The owning attribute is resolved automatically (``user``, then ``owner``)
    and may be a dotted path, which is how nested ownership works - a cart item
    is owned by whoever owns its cart (``cart.user``). A view can point the
    check elsewhere with ``owner_field``.

    Detail routes using this permission must also scope ``get_queryset`` to the
    requester, so probing another object's id returns 404 rather than a 403 that
    would confirm it exists.
    """

    message = "You can only access your own resources."

    #: Candidate attribute paths, checked in order.
    owner_fields: Sequence[str] = ("user", "owner")

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False

        declared = getattr(view, "owner_field", None)
        candidates = (declared,) if declared else self.owner_fields

        for path in candidates:
            owner = _resolve_path(obj, path)
            if owner is not _MISSING:
                return owner == user
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """Public catalogue reads, admin-only writes."""

    message = "Only administrators can modify this resource."

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user)


class ReadOnly(permissions.BasePermission):
    """Block every unsafe HTTP method."""

    message = "This endpoint is read-only."

    def has_permission(self, request, view) -> bool:
        return request.method in permissions.SAFE_METHODS


class _Missing:
    """Sentinel distinguishing "attribute absent" from an attribute set to None."""

    __slots__ = ()

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return "<missing>"


_MISSING = _Missing()


def _resolve_path(obj, path: str):
    """Resolve a dotted attribute path, returning ``_MISSING`` if it is absent."""
    current = obj
    for segment in path.split("."):
        if current is None or not hasattr(current, segment):
            return _MISSING
        current = getattr(current, segment)
    return current