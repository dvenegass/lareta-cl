from django.urls import path

from . import views

urlpatterns = [
    path("stats/me/", views.MyStatsView.as_view(), name="stats-me"),
    path("stats/rankings/", views.RankingsView.as_view(), name="stats-rankings"),
]
