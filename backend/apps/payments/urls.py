from django.urls import path
from . import views

urlpatterns = [
    path('intent/<int:booking_id>/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm/', views.ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('checkout/', views.CreateCheckoutSessionView.as_view(), name='create-checkout'),
    path('confirm-subscription-session/', views.ConfirmVendorSubscriptionSessionView.as_view(), name='confirm-subscription-session'),
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]

