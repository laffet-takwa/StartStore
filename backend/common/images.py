"""Server side image processing built on Pillow.

Product and category records store a plain ``image_url`` so the frontend can
point at any CDN or Supabase Storage object. When an admin uploads a file
instead of pasting a URL, Django normalises it here: EXIF orientation is
applied, oversized images are downscaled and a WebP variant plus a thumbnail
are produced before the public URL is persisted.

Keeping this logic in one place means every upload path (product image,
category image, product gallery) behaves identically.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from io import BytesIO
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger("startstore.images")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
DEFAULT_MAX_DIMENSION = 1600
DEFAULT_THUMBNAIL_DIMENSION = 480

try:  # pragma: no cover - depends on the Pillow build
    from PIL import features

    _WEBP_SUPPORTED = bool(features.check("webp"))
except Exception:  # pragma: no cover
    _WEBP_SUPPORTED = False

_PREFERRED_ENCODER = "WEBP" if _WEBP_SUPPORTED else "JPEG"


@dataclass(frozen=True, slots=True)
class ProcessedImage:
    """Result of :func:`process_and_store_image`."""

    url: str
    width: int
    height: int
    thumbnail_url: str
    size_bytes: int
    content_type: str
    format: str


def _encode(image: Image.Image, destination_format: str, quality: int) -> bytes:
    buffer = BytesIO()
    options = {"quality": quality, "optimize": True}
    if destination_format == "JPEG":
        image.convert("RGB").save(buffer, format="JPEG", progressive=True, **options)
    else:
        image.save(buffer, format=destination_format, **options)
    return buffer.getvalue()


def _fit(image: Image.Image, max_dimension: int) -> Image.Image:
    """Downscale so the longest edge is at most ``max_dimension``."""
    longest_edge = max(image.size)
    if longest_edge <= max_dimension:
        return image
    ratio = max_dimension / float(longest_edge)
    return image.resize(
        (max(1, round(image.width * ratio)), max(1, round(image.height * ratio))),
        Image.Resampling.LANCZOS,
    )


def _store(prefix: str, payload: bytes, extension: str) -> str:
    name = f"{prefix.strip('/')}/{uuid4().hex}.{extension}"
    return default_storage.save(name, BytesIO(payload))


def process_and_store_image(
    uploaded_file,
    *,
    prefix: str = "images",
    max_dimension: int = DEFAULT_MAX_DIMENSION,
    thumbnail_dimension: int = DEFAULT_THUMBNAIL_DIMENSION,
    quality: int = 82,
) -> ProcessedImage:
    """Validate, normalise and persist an uploaded image.

    Raises :class:`django.core.exceptions.ValidationError` for non-images,
    empty files or files above :data:`MAX_UPLOAD_BYTES`.
    """
    if uploaded_file is None:
        raise ValidationError("No image was uploaded.", code="image_missing")

    size = getattr(uploaded_file, "size", 0) or 0
    if size == 0:
        raise ValidationError("The uploaded image is empty.", code="image_empty")
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError(
            f"Images must be {MAX_UPLOAD_BYTES // (1024 * 1024)}MB or smaller.",
            code="image_too_large",
        )

    content_type = (getattr(uploaded_file, "content_type", "") or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise ValidationError("Only image uploads are supported.", code="image_type")

    try:
        with Image.open(uploaded_file) as opened:
            opened.load()
            image = ImageOps.exif_transpose(opened) or opened
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError(
            "The uploaded file is not a valid image.", code="image_invalid"
        ) from exc
    except Exception as exc:  # noqa: BLE001 - Pillow raises many decode errors
        logger.warning("Image decoding failed: %s", exc)
        raise ValidationError(
            "The uploaded file is not a valid image.", code="image_invalid"
        ) from exc

    has_alpha = image.mode in {"RGBA", "LA", "PA"} or "transparency" in image.info
    if not has_alpha:
        image = image.convert("RGB")

    image = _fit(image, max_dimension)
    thumbnail = _fit(image.copy(), min(thumbnail_dimension, max_dimension))
    thumbnail.thumbnail((thumbnail_dimension, thumbnail_dimension), Image.Resampling.LANCZOS)

    extension = "webp" if _PREFERRED_ENCODER == "WEBP" else "jpg"
    content_type_out = "image/webp" if _PREFERRED_ENCODER == "WEBP" else "image/jpeg"

    payload = _encode(image, _PREFERRED_ENCODER, quality)
    thumbnail_payload = _encode(thumbnail, _PREFERRED_ENCODER, max(quality - 8, 60))

    url = default_storage.url(_store(prefix, payload, extension))
    thumbnail_url = default_storage.url(
        _store(f"{prefix}/thumbs", thumbnail_payload, extension)
    )

    return ProcessedImage(
        url=url,
        width=image.width,
        height=image.height,
        thumbnail_url=thumbnail_url,
        size_bytes=len(payload),
        content_type=content_type_out,
        format=_PREFERRED_ENCODER,
    )