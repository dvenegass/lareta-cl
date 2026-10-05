from django.urls import path

from . import share_views

urlpatterns = [
    path("events/<uuid:event_id>/", share_views.EventSharePageView.as_view(), name="event-share"),
    path("events/<uuid:event_id>/image.png", share_views.EventShareImageView.as_view(), name="event-share-image"),
]
