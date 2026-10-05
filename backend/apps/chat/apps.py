from django.apps import AppConfig
from django.db.models.signals import post_delete


class ChatConfig(AppConfig):
    name = "apps.chat"
    label = "chat"
    verbose_name = "Chat de grupos"

    def ready(self):
        from apps.common.images import delete_file_on_delete

        from .models import GroupMessage

        # Al borrar un mensaje (o el grupo entero) se borra también su imagen.
        post_delete.connect(delete_file_on_delete("image"), sender=GroupMessage, weak=False)
