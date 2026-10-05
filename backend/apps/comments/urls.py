from django.urls import path

from . import views

urlpatterns = [
    path("events/<uuid:event_id>/comments/", views.EventCommentsView.as_view(), name="event-comments"),
    path("comments/<int:comment_id>/", views.CommentDetailView.as_view(), name="comment-detail"),
]
