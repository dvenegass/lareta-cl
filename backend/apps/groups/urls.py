from django.urls import path

from . import views

urlpatterns = [
    path("groups/", views.GroupListCreateView.as_view(), name="group-list"),
    path("groups/<int:group_id>/", views.GroupDetailView.as_view(), name="group-detail"),
    path("groups/<int:group_id>/members/", views.GroupMembersView.as_view(), name="group-members"),
    path(
        "groups/<int:group_id>/members/<int:user_id>/",
        views.GroupMemberDetailView.as_view(),
        name="group-member-detail",
    ),
]
