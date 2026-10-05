from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .selectors import user_profile
from .serializers import UserProfileSerializer


class UserProfileView(APIView):
    def get(self, request, username):
        user = get_object_or_404(User, username=username, is_active=True)
        data = user_profile(viewer=request.user, user=user)
        return Response(UserProfileSerializer(data, context={"request": request}).data)
