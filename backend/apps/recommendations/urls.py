from django.urls import path
from .views import (
    ContentBasedRecommendationsView,
    CollaborativeRecommendationsView,
    TrainRecommendationModelView,
)

urlpatterns = [
    path("similar/<int:equipment_id>/", ContentBasedRecommendationsView.as_view(), name="similar"),
    path("for-me/", CollaborativeRecommendationsView.as_view(), name="for-me"),
    path("train/", TrainRecommendationModelView.as_view(), name="recommendations-train"),
]
