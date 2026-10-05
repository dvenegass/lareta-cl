from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.groups.selectors import member_groups

from . import gifs, selectors, services
from .models import GroupMessage
from .serializers import (
    GifSearchQuerySerializer,
    GroupMessageCreateSerializer,
    GroupMessageSerializer,
    MessagesQuerySerializer,
)


def _get_group(request, group_id):
    """Igual que en grupos: si no eres miembro, el grupo (y su chat) no existe."""
    return get_object_or_404(member_groups(request.user), pk=group_id)


class GroupMessagesView(APIView):
    def get(self, request, group_id):
        group = _get_group(request, group_id)
        query = MessagesQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        after = query.validated_data.get("after")
        before = query.validated_data.get("before")

        if after is not None:
            messages = selectors.messages_after(group, after)
        elif before is not None:
            messages = selectors.messages_before(group, before)
        else:
            messages = selectors.latest_messages(group)

        return Response(GroupMessageSerializer(messages, many=True, context={"request": request}).data)

    def post(self, request, group_id):
        group = _get_group(request, group_id)
        serializer = GroupMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = services.send_message(group=group, author=request.user, **serializer.validated_data)

        return Response(
            GroupMessageSerializer(message, context={"request": request}).data, status=status.HTTP_201_CREATED
        )


class GifSearchView(APIView):
    """Buscador de GIFs del chat: ?q=texto (vacío = los del momento) y ?page=."""

    def get(self, request):
        query = GifSearchQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        try:
            data = gifs.search(query.validated_data["q"].strip(), query.validated_data["page"])
        except gifs.GifsUnavailable as error:
            return Response({"detail": str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(data)


class GroupMessageDetailView(APIView):
    def delete(self, request, message_id):
        message = get_object_or_404(
            GroupMessage.objects.select_related("group").filter(group__in=member_groups(request.user)),
            pk=message_id,
        )
        if not services.can_delete_message(message=message, user=request.user):
            raise PermissionDenied("Solo quien lo escribió (o quien administra el grupo) puede borrarlo.")
        services.delete_message(message=message)
        return Response(status=status.HTTP_204_NO_CONTENT)
