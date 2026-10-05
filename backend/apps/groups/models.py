from django.conf import settings
from django.db import models


class Group(models.Model):
    """Un grupo de amigos, p. ej. "Chilensios". Sus juntas salen en el feed de todos los miembros."""

    name = models.CharField(max_length=60)
    description = models.CharField(max_length=200, blank=True)
    # Foto del grupo (opcional). Solo quien administra puede cambiarla.
    photo = models.ImageField(upload_to="groups/", blank=True)
    # Quien administra el grupo (puede editarlo, sacar gente y borrarlo).
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="owned_groups"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_memberships")
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(fields=["group", "user"], name="unique_group_member"),
        ]

    def __str__(self):
        return f"{self.user} en {self.group}"
