"""Small shared helpers for model level concerns."""

from __future__ import annotations

from django.utils.text import slugify

#: Give up after this many suffixed attempts rather than looping forever.
MAX_SLUG_ATTEMPTS = 1000


def build_unique_slug(
    model,
    *,
    source: str,
    field_name: str = "slug",
    max_length: int = 220,
    instance=None,
) -> str:
    """Slugify ``source`` and guarantee the result is unused on ``model``.

    Two products may legitimately share a name, but ``slug`` is unique, so a
    plain :func:`slugify` would raise ``IntegrityError`` on the second insert -
    which surfaces to an admin as a 500. This appends ``-2``, ``-3``, ... until
    the slug is free. Callers only use it when the slug field is still blank,
    so public URLs stay stable across renames.
    """
    base = slugify(source)[:max_length].strip("-") or "item"
    candidates = model._default_manager.all()
    if instance is not None and instance.pk:
        candidates = candidates.exclude(pk=instance.pk)

    if not candidates.filter(**{field_name: base}).exists():
        return base

    for suffix in range(2, MAX_SLUG_ATTEMPTS):
        tail = f"-{suffix}"
        candidate = f"{base[: max_length - len(tail)]}{tail}"
        if not candidates.filter(**{field_name: candidate}).exists():
            return candidate

    raise ValueError(
        f"Could not derive a unique {field_name} for {model.__name__} {source!r}"
    )