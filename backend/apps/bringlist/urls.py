from django.urls import path

from . import views

urlpatterns = [
    path("events/<uuid:event_id>/items/", views.EventItemsView.as_view(), name="event-items"),
    path("items/<int:item_id>/", views.ItemDetailView.as_view(), name="item-detail"),
]
