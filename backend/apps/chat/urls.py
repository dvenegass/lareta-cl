from django.urls import path

from . import views

urlpatterns = [
    path("groups/<int:group_id>/messages/", views.GroupMessagesView.as_view(), name="group-messages"),
    path("messages/<int:message_id>/", views.GroupMessageDetailView.as_view(), name="group-message-detail"),
    path("gifs/", views.GifSearchView.as_view(), name="gif-search"),
]
