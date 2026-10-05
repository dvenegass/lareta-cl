from django.urls import path

from . import views

urlpatterns = [
    path("events/<uuid:event_id>/polls/", views.EventPollsView.as_view(), name="event-polls"),
    path("polls/<int:poll_id>/", views.PollDetailView.as_view(), name="poll-detail"),
    path("polls/<int:poll_id>/vote/", views.PollVoteView.as_view(), name="poll-vote"),
]
