from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.groups.selectors import member_groups

from . import selectors
from .serializers import ProfileStatsSerializer, RankingsSerializer


class MyStatsView(APIView):
    def get(self, request):
        data = selectors.profile_stats(request.user)
        return Response(ProfileStatsSerializer(data).data)


class RankingsView(APIView):
    def get(self, request):
        # ?group=<id> → ranking del grupo (solo para sus miembros). Sin él: entre amigos.
        group_id = request.query_params.get("group")
        group = get_object_or_404(member_groups(request.user), pk=group_id) if group_id else None

        data = selectors.rankings_for(request.user, group=group)
        return Response(RankingsSerializer(data, context={"request": request}).data)
