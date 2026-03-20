from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Case, IntegerField, Value, When
from apps.equipment.models import Equipment
from apps.equipment.serializers import EquipmentSerializer
from .services import get_similar_equipment, get_user_recommendations, train_recommendation_model


def _ordered_equipment_queryset(ids):
    if not ids:
        return Equipment.objects.none()
    whens = [When(id=pk, then=Value(index)) for index, pk in enumerate(ids)]
    ordering = Case(*whens, output_field=IntegerField())
    return Equipment.objects.filter(id__in=ids, is_active=True).order_by(ordering)


class ContentBasedRecommendationsView(APIView):
    """Get similar equipment based on content features."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, equipment_id):
        get_object_or_404(Equipment, pk=equipment_id)
        ids = get_similar_equipment(equipment_id)
        equipment = _ordered_equipment_queryset(ids)
        return Response(EquipmentSerializer(equipment, many=True).data)


class CollaborativeRecommendationsView(APIView):
    """Get personalized recommendations for the logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ids = get_user_recommendations(request.user.id)
        equipment = _ordered_equipment_queryset(ids)
        return Response(EquipmentSerializer(equipment, many=True).data)


class TrainRecommendationModelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Admin only."}, status=403)
        try:
            result = train_recommendation_model()
            return Response(result)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=400)
