from django.urls import path
from .views import (
    CreatePaymentIntentView,
    ConfirmPaymentView,
    CreateVendorSubscriptionView,
    StripeWebhookView,
    CreateCheckoutSessionView,
    ConfirmVendorSubscriptionSessionView,
)

urlpatterns = [
    path("intent/<int:booking_id>/", CreatePaymentIntentView.as_view(), name="payment-intent"),
    path("confirm/", ConfirmPaymentView.as_view(), name="payment-confirm"),
    path("subscribe/", CreateVendorSubscriptionView.as_view(), name="vendor-subscribe"),
    path("create-checkout/", CreateCheckoutSessionView.as_view(), name="create-checkout"),
    path("confirm-subscription-session/", ConfirmVendorSubscriptionSessionView.as_view(), name="confirm-subscription-session"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
