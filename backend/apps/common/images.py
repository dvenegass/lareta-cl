"""
Imágenes que suben los usuarios (chat de grupos y álbum de las juntas).

- `validate_uploaded_image`: tipo y peso permitidos (para los serializadores).
- `prepare_image`: las fotos del celular suelen pesar varios MB y venir giradas
  (la orientación va en los metadatos EXIF). Aquí se enderezan y se achican a un
  tamaño razonable. Los GIF animados se dejan tal cual para no perder la animación.
"""

from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps
from rest_framework import serializers

MAX_IMAGE_MB = 8
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

MAX_SIDE = 1600  # píxeles del lado más largo
SAVE_OPTIONS = {
    "JPEG": {"quality": 85, "optimize": True},
    "PNG": {"optimize": True},
    "WEBP": {"quality": 85},
}


def validate_uploaded_image(file):
    """Para usar en `validate_<campo>` de un serializador con un ImageField."""
    if file.size > MAX_IMAGE_MB * 1024 * 1024:
        raise serializers.ValidationError(f"La imagen pesa más de {MAX_IMAGE_MB} MB.")
    if getattr(file, "content_type", None) not in ALLOWED_IMAGE_TYPES:
        raise serializers.ValidationError("Usa una imagen JPG, PNG, GIF o WebP.")
    return file


def prepare_image(uploaded):
    """Devuelve el archivo listo para guardar (el mismo si no hacía falta tocarlo)."""
    uploaded.seek(0)
    with Image.open(uploaded) as original:
        image_format = original.format
        if image_format not in SAVE_OPTIONS:  # GIF (animado) u otro: se guarda tal cual
            uploaded.seek(0)
            return uploaded

        image = ImageOps.exif_transpose(original)
        image.thumbnail((MAX_SIDE, MAX_SIDE))
        if image_format == "JPEG" and image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        buffer = BytesIO()
        image.save(buffer, format=image_format, **SAVE_OPTIONS[image_format])

    return ContentFile(buffer.getvalue(), name=Path(uploaded.name).name)


def delete_file_on_delete(field_name: str):
    """
    Receptor para `post_delete`: borra el archivo de `field_name` cuando se borra
    la fila, también cuando se borra en cascada (p. ej. al eliminar un grupo).
    """

    def receiver(sender, instance, **kwargs):
        file = getattr(instance, field_name)
        if file:
            file.delete(save=False)

    return receiver
