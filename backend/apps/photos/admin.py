from django.contrib import admin

from .models import EventPhoto


@admin.register(EventPhoto)
class EventPhotoAdmin(admin.ModelAdmin):
    list_display = ["event", "uploaded_by", "created_at"]
