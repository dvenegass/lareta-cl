from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.serializers import UserSerializer

from . import selectors, services
from .models import Friendship
from .serializers import FriendRequestCreateSerializer, FriendRequestSerializer, UserSearchResultSerializer

MIN_SEARCH_LENGTH = 2


class FriendListView(APIView):
    def get(self, request):
        friends = selectors.friends_of(request.user)
        return Response(UserSerializer(friends, many=True, context={"request": request}).data)


class FriendDetailView(APIView):
    def delete(self, request, user_id):
        """Dejar de ser amigos."""
        other = get_object_or_404(User, pk=user_id)
        friendship = selectors.find_friendship(request.user, other)
        if friendship is None or friendship.status != Friendship.Status.ACCEPTED:
            return Response({"detail": "No son amigos."}, status=status.HTTP_404_NOT_FOUND)
        services.delete_friendship(friendship=friendship)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestListView(APIView):
    def get(self, request):
        pending = selectors.pending_requests(request.user)
        context = {"request": request}
        return Response(
            {
                "incoming": FriendRequestSerializer(pending["incoming"], many=True, context=context).data,
                "outgoing": FriendRequestSerializer(pending["outgoing"], many=True, context=context).data,
            }
        )

    def post(self, request):
        serializer = FriendRequestCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        friendship = services.send_friend_request(
            requester=request.user, addressee=serializer.validated_data["username"]
        )

        return Response(
            {"status": friendship.status},
            status=status.HTTP_201_CREATED,
        )


class FriendRequestAcceptView(APIView):
    def post(self, request, request_id):
        friendship = get_object_or_404(
            Friendship, pk=request_id, addressee=request.user, status=Friendship.Status.PENDING
        )
        services.accept_friend_request(friendship=friendship)
        return Response({"status": friendship.status})


class FriendRequestDetailView(APIView):
    def delete(self, request, request_id):
        """Rechazar (si me la enviaron) o cancelar (si la envié yo)."""
        friendship = get_object_or_404(Friendship, pk=request_id, status=Friendship.Status.PENDING)
        if request.user.id not in (friendship.requester_id, friendship.addressee_id):
            return Response(status=status.HTTP_404_NOT_FOUND)
        services.delete_friendship(friendship=friendship)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < MIN_SEARCH_LENGTH:
            return Response([])

        users = selectors.search_users(request.user, query)
        relationships = selectors.relationship_with(request.user, users)
        results = [{"user": user, "relationship": relationships[user.id]} for user in users]
        return Response(UserSearchResultSerializer(results, many=True, context={"request": request}).data)
