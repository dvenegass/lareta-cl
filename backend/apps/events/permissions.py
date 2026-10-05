from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEventCreatorOrReadOnly(BasePermission):
    """Cualquiera puede ver la junta; solo su creador puede editarla o borrarla."""

    message = "Solo quien creó la junta puede modificarla."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.creator_id == request.user.id
