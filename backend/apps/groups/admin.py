from django.contrib import admin

from .models import Group, GroupMembership


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    fk_name = "group"
    extra = 0


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "created_at"]
    search_fields = ["name"]
    inlines = [GroupMembershipInline]
