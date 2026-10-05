from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import serializers

from apps.groups.models import Group
from apps.groups.selectors import is_member
from apps.groups.serializers import GroupRefSerializer
from apps.users.serializers import UserSerializer

from .models import Event, EventParticipant
from .services import can_respond


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = EventParticipant
        fields = ["user", "status", "arrival", "fee_paid", "updated_at"]


class EventListSerializer(serializers.ModelSerializer):
    """Resumen para las tarjetas del dashboard."""

    creator = UserSerializer(read_only=True)
    group = GroupRefSerializer(read_only=True, allow_null=True)
    going_count = serializers.IntegerField(read_only=True)
    my_status = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "starts_at",
            "location",
            "creator",
            "group",
            "going_count",
            "my_status",
            "is_cancelled",
        ]


class EventHistorySerializer(EventListSerializer):
    """Para el historial: además, cuántas fotos tiene el álbum y su portada."""

    photo_count = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + ["photo_count", "cover_image"]

    def get_photo_count(self, event):
        return event.photo_count or 0

    def get_cover_image(self, event):
        # `cover_image` viene de una subconsulta: es la ruta del archivo, no un ImageField.
        return default_storage.url(event.cover_image) if event.cover_image else None


class EventDetailSerializer(EventListSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    is_creator = serializers.SerializerMethodField()
    has_started = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + [
            "description",
            "money_mode",
            "fee_amount",
            "bring_list_enabled",
            "polls_enabled",
            "comments_enabled",
            "cancelled_at",
            "cancel_reason",
            "participants",
            "is_creator",
            "has_started",
            "can_join",
            "created_at",
            "updated_at",
        ]

    def get_is_creator(self, event):
        return event.creator_id == self.context["request"].user.id

    def get_has_started(self, event):
        return event.starts_at <= timezone.now()

    def get_can_join(self, event):
        return can_respond(event=event, user=self.context["request"].user)


class EventWriteSerializer(serializers.ModelSerializer):
    """Valida los datos para crear o editar una junta. Necesita `request` en el contexto."""

    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Event
        fields = [
            "title",
            "description",
            "starts_at",
            "location",
            "group",
            "money_mode",
            "fee_amount",
            "bring_list_enabled",
            "polls_enabled",
            "comments_enabled",
        ]

    def validate_group(self, value):
        is_unchanged = self.instance is not None and value == self.instance.group
        if value is not None and not is_unchanged and not is_member(self.context["request"].user, value.pk):
            raise serializers.ValidationError("Solo puedes crear juntas en tus grupos.")
        return value

    def validate_starts_at(self, value):
        # Solo se valida si la fecha es nueva: editar la descripción de una
        # junta pasada no debería fallar.
        is_new_value = self.instance is None or value != self.instance.starts_at
        if is_new_value and value < timezone.now():
            raise serializers.ValidationError("La junta no puede ser en el pasado.")
        return value

    def validate(self, attrs):
        # En una edición parcial, lo que no viene se toma de la junta actual.
        current = self.instance
        money_mode = attrs.get("money_mode", current.money_mode if current else Event.MoneyMode.NONE)
        fee_amount = attrs.get("fee_amount", current.fee_amount if current else None)

        if money_mode == Event.MoneyMode.FIXED:
            if not fee_amount:
                raise serializers.ValidationError({"fee_amount": "Indica cuánto pone cada uno."})
        else:
            attrs["fee_amount"] = None
        return attrs


class EventCreateSerializer(EventWriteSerializer):
    """Al crear también se puede armar la lista de "qué llevar" de una vez."""

    bring_items = serializers.ListField(
        # allow_blank: los vacíos se descartan en validate_bring_items en vez de dar error.
        child=serializers.CharField(max_length=80, allow_blank=True),
        required=False,
        default=list,
        max_length=30,
        write_only=True,
    )

    class Meta(EventWriteSerializer.Meta):
        fields = EventWriteSerializer.Meta.fields + ["bring_items"]

    def validate_bring_items(self, value):
        # Sin vacíos ni repetidos ("Hielo" y "hielo" son lo mismo).
        cleaned, seen = [], set()
        for name in (item.strip() for item in value):
            if name and name.lower() not in seen:
                seen.add(name.lower())
                cleaned.append(name)
        return cleaned


class CancelEventSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")

    def validate_reason(self, value):
        return value.strip()


class AttendanceSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=EventParticipant.Status.choices)


class ParticipantUpdateSerializer(serializers.Serializer):
    """Lo que el organizador puede marcar de cada participante."""

    arrival = serializers.ChoiceField(choices=EventParticipant.Arrival.choices, allow_null=True, required=False)
    fee_paid = serializers.BooleanField(required=False)

    def validate_arrival(self, value):
        if value is not None and self.context["event"].starts_at > timezone.now():
            raise serializers.ValidationError("La llegada se marca cuando la junta ya empezó.")
        return value

    def validate_fee_paid(self, value):
        if self.context["event"].money_mode != Event.MoneyMode.FIXED:
            raise serializers.ValidationError("Esta junta no tiene cuota fija.")
        return value
