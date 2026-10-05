from django.contrib import admin

from .models import BringItem


@admin.register(BringItem)
class BringItemAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "assigned_to", "created_at"]
