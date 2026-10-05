from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.events.services import can_respond, respond_denied_message

from . import selectors, services
from .models import Expense
from .serializers import ExpenseCreateSerializer, ExpenseSummarySerializer


def _summary_response(request, event, status_code=status.HTTP_200_OK):
    summary = selectors.expense_summary(event)
    data = ExpenseSummarySerializer(summary, context={"request": request}).data
    return Response(data, status=status_code)


class EventExpensesView(APIView):
    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        return _summary_response(request, event)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not can_respond(event=event, user=request.user):
            raise PermissionDenied(respond_denied_message(event))
        serializer = ExpenseCreateSerializer(data=request.data, context={"event": event, "request": request})
        serializer.is_valid(raise_exception=True)

        services.add_expense(event=event, created_by=request.user, **serializer.validated_data)

        return _summary_response(request, event, status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    def delete(self, request, expense_id):
        expense = get_object_or_404(Expense.objects.select_related("event"), pk=expense_id)
        if not services.can_delete_expense(expense=expense, user=request.user):
            raise PermissionDenied("No puedes borrar este gasto.")
        event = expense.event
        services.delete_expense(expense=expense)
        return _summary_response(request, event)
