from django.urls import path

from . import views

urlpatterns = [
    path("events/<uuid:event_id>/photos/", views.EventPhotosView.as_view(), name="event-photos"),
    path("photos/<int:photo_id>/", views.PhotoDetailView.as_view(), name="photo-detail"),
]
