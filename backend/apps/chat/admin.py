from django.contrib import admin

from .models import GroupMessage


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ["author", "group", "body", "created_at"]
    list_filter = ["group"]
