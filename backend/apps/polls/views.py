from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.events.services import can_respond, respond_denied_message

from . import selectors, services
from .models import Poll
from .serializers import PollCreateSerializer, PollSerializer, VoteSerializer


def _poll_response(request, poll_id, status_code=status.HTTP_200_OK):
    poll = selectors.get_poll(poll_id)
    context = {"request": request, "my_votes": selectors.votes_by_user(request.user, [poll])}
    return Response(PollSerializer(poll, context=context).data, status=status_code)


def _require_can_participate(request, event):
    """Votaciones activadas y, en juntas de grupo, solo los miembros participan."""
    if not event.polls_enabled:
        raise ValidationError({"detail": "Esta junta no tiene votaciones activadas."})
    if not can_respond(event=event, user=request.user):
        raise PermissionDenied(respond_denied_message(event))


class EventPollsView(APIView):
    """Votaciones de una junta: cualquiera con el enlace las ve; participan quienes pueden unirse."""

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        polls = selectors.polls_for_event(event)
        context = {"request": request, "my_votes": selectors.votes_by_user(request.user, polls)}
        return Response(PollSerializer(polls, many=True, context=context).data)

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        _require_can_participate(request, event)
        serializer = PollCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        poll = services.create_poll(event=event, created_by=request.user, **serializer.validated_data)

        return _poll_response(request, poll.pk, status.HTTP_201_CREATED)


class PollDetailView(APIView):
    def delete(self, request, poll_id):
        poll = get_object_or_404(Poll.objects.select_related("event"), pk=poll_id)
        if not services.can_delete_poll(poll=poll, user=request.user):
            raise PermissionDenied("Solo quien creó la votación o quien organiza la junta puede borrarla.")
        services.delete_poll(poll=poll)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PollVoteView(APIView):
    def put(self, request, poll_id):
        poll = get_object_or_404(Poll.objects.select_related("event"), pk=poll_id)
        _require_can_participate(request, poll.event)
        serializer = VoteSerializer(data=request.data, context={"poll": poll})
        serializer.is_valid(raise_exception=True)

        services.vote(poll=poll, user=request.user, option=serializer.validated_data["option"])

        return _poll_response(request, poll_id)

    def delete(self, request, poll_id):
        poll = get_object_or_404(Poll, pk=poll_id)
        services.remove_vote(poll=poll, user=request.user)
        return _poll_response(request, poll_id)
