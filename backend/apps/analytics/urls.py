from django.urls import path
from .views import VendorAnalyticsView, AdminAnalyticsView

urlpatterns = [
    path("vendor/", VendorAnalyticsView.as_view(), name="vendor-analytics"),
    path("admin/", AdminAnalyticsView.as_view(), name="admin-analytics"),
]