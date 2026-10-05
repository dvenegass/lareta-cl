from rest_framework import serializers

from apps.events.models import Event, EventParticipant
from apps.users.serializers import UserSerializer

from .models import Expense
from .services import can_delete_expense


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ["id", "description", "amount", "paid_by", "created_at", "can_delete"]

    def get_can_delete(self, expense):
        return can_delete_expense(expense=expense, user=self.context["request"].user)


class BalanceSerializer(serializers.Serializer):
    user = UserSerializer()
    paid = serializers.IntegerField()
    share = serializers.IntegerField()
    balance = serializers.IntegerField()


class SettlementSerializer(serializers.Serializer):
    from_user = UserSerializer()
    to_user = UserSerializer()
    amount = serializers.IntegerField()


class ExpenseSummarySerializer(serializers.Serializer):
    expenses = ExpenseSerializer(many=True)
    total = serializers.IntegerField()
    people_count = serializers.IntegerField()
    per_person = serializers.IntegerField()
    balances = BalanceSerializer(many=True)
    settlements = SettlementSerializer(many=True)


class ExpenseCreateSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=120)
    amount = serializers.IntegerField(min_value=1, max_value=100_000_000)
    # Quién pagó. Si no viene, se asume quien lo anota.
    paid_by = serializers.IntegerField(required=False)

    def validate(self, attrs):
        event = self.context["event"]
        if event.money_mode != Event.MoneyMode.SHARED:
            raise serializers.ValidationError({"detail": "Esta junta no usa gastos compartidos."})

        payer_id = attrs.get("paid_by", self.context["request"].user.id)
        payer = EventParticipant.objects.filter(event=event, user_id=payer_id).select_related("user").first()
        if payer is None:
            raise serializers.ValidationError({"paid_by": "Quien pagó tiene que ser parte de la junta."})
        attrs["paid_by"] = payer.user
        return attrs
