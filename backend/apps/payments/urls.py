from django.urls import path
from . import views

urlpatterns = [
    path('intent/<int:booking_id>/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm/', views.ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('checkout/', views.CreateCheckoutSessionView.as_view(), name='create-checkout'),
    path('confirm-subscription-session/', views.ConfirmVendorSubscriptionSessionView.as_view(), name='confirm-subscription-session'),
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    # Payout endpoints
    path('payouts/', views.PayoutListView.as_view(), name='payout-list'),
    path('payouts/<int:pk>/', views.PayoutDetailView.as_view(), name='payout-detail'),
    path('payouts/schedule/', views.SchedulePayoutView.as_view(), name='schedule-payout'),
    path('bank/', views.VendorBankAccountView.as_view(), name='bank-account'),
]

