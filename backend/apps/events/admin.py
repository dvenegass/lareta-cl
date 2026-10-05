from django.contrib import admin

from .models import Event, EventParticipant


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "starts_at", "location", "creator"]
    search_fields = ["title", "location"]
    inlines = [EventParticipantInline]
