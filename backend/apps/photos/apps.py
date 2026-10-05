from django.apps import AppConfig
from django.db.models.signals import post_delete


class PhotosConfig(AppConfig):
    name = "apps.photos"
    label = "photos"
    verbose_name = "Álbum de las juntas"

    def ready(self):
        from apps.common.images import delete_file_on_delete

        from .models import EventPhoto

        # Al borrar una foto (o la junta entera) se borra también el archivo.
        post_delete.connect(delete_file_on_delete("image"), sender=EventPhoto, weak=False)
