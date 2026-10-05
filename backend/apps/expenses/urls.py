from django.urls import path

from . import views

urlpatterns = [
    path("events/<uuid:event_id>/expenses/", views.EventExpensesView.as_view(), name="event-expenses"),
    path("expenses/<int:expense_id>/", views.ExpenseDetailView.as_view(), name="expense-detail"),
]
