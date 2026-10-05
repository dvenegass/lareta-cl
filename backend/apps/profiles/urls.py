from django.urls import path

from . import views

urlpatterns = [
    path("users/<str:username>/profile/", views.UserProfileView.as_view(), name="user-profile"),
]
