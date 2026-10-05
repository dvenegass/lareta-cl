from django.urls import path

from . import views

urlpatterns = [
    path("", views.EventListCreateView.as_view(), name="event-list"),
    path("<uuid:event_id>/", views.EventDetailView.as_view(), name="event-detail"),
    path("<uuid:event_id>/attendance/", views.EventAttendanceView.as_view(), name="event-attendance"),
    path("<uuid:event_id>/cancel/", views.EventCancelView.as_view(), name="event-cancel"),
    path(
        "<uuid:event_id>/participants/<int:user_id>/",
        views.EventParticipantView.as_view(),
        name="event-participant",
    ),
]
