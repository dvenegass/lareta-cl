from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "kind", "actor", "created_at", "read_at"]
    list_filter = ["kind"]
