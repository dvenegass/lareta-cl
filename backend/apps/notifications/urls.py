from django.urls import path

from . import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/unread-count/", views.UnreadCountView.as_view(), name="notification-unread-count"),
    path("notifications/read-all/", views.NotificationReadAllView.as_view(), name="notification-read-all"),
    path(
        "notifications/<int:notification_id>/read/",
        views.NotificationReadView.as_view(),
        name="notification-read",
    ),
]
