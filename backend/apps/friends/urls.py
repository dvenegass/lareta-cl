from django.urls import path

from . import views

urlpatterns = [
    path("friends/", views.FriendListView.as_view(), name="friend-list"),
    path("friends/search/", views.UserSearchView.as_view(), name="friend-search"),
    path("friends/requests/", views.FriendRequestListView.as_view(), name="friend-requests"),
    path(
        "friends/requests/<int:request_id>/accept/",
        views.FriendRequestAcceptView.as_view(),
        name="friend-request-accept",
    ),
    path(
        "friends/requests/<int:request_id>/",
        views.FriendRequestDetailView.as_view(),
        name="friend-request-detail",
    ),
    path("friends/<int:user_id>/", views.FriendDetailView.as_view(), name="friend-detail"),
]
