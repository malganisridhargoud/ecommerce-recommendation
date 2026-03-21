import stripe
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from .models import VendorSubscription, SubscriptionTier
from .serializers import (
    SubscriptionTierSerializer, VendorSubscriptionSerializer,
    UpgradeSubscriptionSerializer
)
from apps.equipment.models import Vendor
from apps.equipment.serializers import VendorSerializer


class SubscriptionTierListView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        tiers = SubscriptionTier.objects.filter(is_active=True).order_by('order')
        serializer = SubscriptionTierSerializer(tiers, many=True)
        return Response(serializer.data)


class VendorSubscriptionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        subscription, created = VendorSubscription.objects.get_or_create(
            vendor=vendor,
            defaults={'tier': SubscriptionTier.objects.first()}
        )
        serializer = VendorSubscriptionSerializer(subscription)
        return Response(serializer.data)


class UpgradeSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = UpgradeSubscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        tier = serializer.validated_data['tier_slug']
        billing_cycle = serializer.validated_data['billing_cycle']
        
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        subscription, _ = VendorSubscription.objects.get_or_create(vendor=vendor)
        
        price = tier.price_monthly if billing_cycle == 'monthly' else tier.price_yearly
        
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': f"{tier.name} ({billing_cycle.title()})"
                        },
                        'unit_amount': int(price * 100),
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.FRONTEND_URL}/vendor?success=true&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/vendor?canceled=true",
                metadata={
                    'vendor_id': vendor.id,
                    'tier_slug': tier.slug,
                    'billing_cycle': billing_cycle,
                }
            )
            return Response({
                'url': session.url,
                'session_id': session.id
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionUsageCheckView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        subscription = VendorSubscription.objects.filter(vendor=vendor).first()
        
        if not subscription or not subscription.is_active:
            return Response({'can_create': False, 'reason': 'inactive'}, status=status.HTTP_402_PAYMENT_REQUIRED)
        
        return Response({
            'can_create': subscription.can_create_listing(),
            'listings_used': subscription.listings_used,
            'max_listings': subscription.tier.max_listings,
            'usage_pct': subscription.usage_pct
        })


class CancelSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        subscription = get_object_or_404(VendorSubscription, vendor=vendor)
        
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
            subscription.cancel_at_period_end = True
            subscription.save()
            return Response({'message': 'Cancellation scheduled for period end'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

