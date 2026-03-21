from django.urls import path
from . import views

urlpatterns = [
    path('tiers/', views.SubscriptionTierListView.as_view(), name='tier-list'),
    path('me/', views.VendorSubscriptionDetailView.as_view(), name='subscription-detail'),
    path('upgrade/', views.UpgradeSubscriptionView.as_view(), name='upgrade'),
    path('usage/', views.SubscriptionUsageCheckView.as_view(), name='usage-check'),
    path('cancel/', views.CancelSubscriptionView.as_view(), name='cancel'),
]

