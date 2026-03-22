from django.urls import path
from .views import TrainRecommendationsView, SimilarEquipmentView, ForMeRecommendationsView

urlpatterns = [
    path('train/', TrainRecommendationsView.as_view(), name='train-recommendations'),
    path('similar/<int:equipment_id>/', SimilarEquipmentView.as_view(), name='similar-equipment'),
    path('for-me/', ForMeRecommendationsView.as_view(), name='for-me-recommendations'),
]