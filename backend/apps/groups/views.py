from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .serializers import (
    AddMemberSerializer,
    GroupCreateSerializer,
    GroupDetailSerializer,
    GroupSummarySerializer,
    GroupWriteSerializer,
)


def _get_group(request, group_id):
    """El grupo, si el usuario es miembro. Para los demás, no existe (404)."""
    return get_object_or_404(selectors.member_groups(request.user), pk=group_id)


def _detail_response(request, group_id, status_code=status.HTTP_200_OK):
    group = _get_group(request, group_id)
    return Response(GroupDetailSerializer(group, context={"request": request}).data, status=status_code)


def _require_owner(request, group):
    if not services.can_manage(group=group, user=request.user):
        raise PermissionDenied("Solo quien administra el grupo puede hacer esto.")


class GroupListCreateView(APIView):
    def get(self, request):
        groups = selectors.groups_for_user(request.user)
        return Response(GroupSummarySerializer(groups, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = GroupCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        group = services.create_group(
            owner=request.user,
            name=data["name"],
            description=data.get("description", ""),
            members=data["member_ids"],
        )

        return _detail_response(request, group.pk, status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    def get(self, request, group_id):
        return _detail_response(request, group_id)

    def patch(self, request, group_id):
        group = _get_group(request, group_id)
        _require_owner(request, group)
        serializer = GroupWriteSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        services.update_group(group=group, **serializer.validated_data)

        return _detail_response(request, group_id)

    def delete(self, request, group_id):
        group = _get_group(request, group_id)
        _require_owner(request, group)
        services.delete_group(group=group)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMembersView(APIView):
    def post(self, request, group_id):
        """Cualquier miembro puede agregar a sus amigos."""
        group = _get_group(request, group_id)
        serializer = AddMemberSerializer(data=request.data, context={"request": request, "group": group})
        serializer.is_valid(raise_exception=True)

        services.add_member(group=group, user=serializer.validated_data["user_id"], added_by=request.user)

        return _detail_response(request, group_id)


class GroupMemberDetailView(APIView):
    def delete(self, request, group_id, user_id):
        """Salirse del grupo (uno mismo) o sacar a alguien (solo quien administra)."""
        group = _get_group(request, group_id)
        membership = get_object_or_404(group.memberships.select_related("user"), user_id=user_id)

        leaving = user_id == request.user.id
        if not leaving:
            _require_owner(request, group)

        services.remove_member(group=group, user=membership.user)

        if leaving:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return _detail_response(request, group_id)
