from django.conf import settings
from django.db import models

from apps.groups.models import Group


class GroupMessage(models.Model):
    """
    Un mensaje en el chat de un grupo. Solo los miembros lo ven.

    Puede llevar texto, una imagen subida o un GIF de KLIPY (o texto + uno de
    los dos). Se guardan las dimensiones para que el navegador reserve el
    espacio y el chat no "salte" mientras cargan.
    """

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_messages")
    body = models.TextField(max_length=1000, blank=True)

    image = models.ImageField(
        upload_to="chat/%Y/%m/", blank=True, width_field="image_width", height_field="image_height"
    )
    image_width = models.PositiveIntegerField(null=True, blank=True)
    image_height = models.PositiveIntegerField(null=True, blank=True)

    gif_url = models.URLField(max_length=500, blank=True)
    gif_width = models.PositiveIntegerField(null=True, blank=True)
    gif_height = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Se ordena por id: es creciente y sirve para pedir "los mensajes nuevos desde X".
        ordering = ["id"]

    def __str__(self):
        return f"{self.author} en {self.group}: {self.body[:40] or '[imagen]'}"
