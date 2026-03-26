from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from django.db.models import F
from django.db import models
from django.core.cache import cache
from django.core.signals import Signal
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Equipment, Vendor, Review, ReviewComment, WishlistItem, CartItem, ModerationStatus
from .serializers import (
    EquipmentSerializer,
    EquipmentCreateSerializer,
    VendorSerializer,
    ReviewSerializer,
    ReviewCommentSerializer,
    WishlistItemSerializer,
    CartItemSerializer,
)
from apps.bookings.models import Booking, BookingStatus
from core.subscriptions import ensure_vendor_can_list, vendor_subscription_required
from core.authentication.clerk_auth import LenientClerkAuthentication


# Cache key generators
def equipment_list_cache_key(view, request):
    """Generate cache key based on query params."""
    params = request.query_params
    return f"equipment_list:{params.get('category', '')}:{params.get('search', '')}:{params.get('sort', '')}:{params.get('max_price', '')}:{params.get('location', '')}:{params.get('section', '')}"


# Cache invalidation signal
equipment_cache_invalidated = Signal()


def broadcast_equipment_update(action, equipment_id, data=None):
    """Broadcast equipment update to WebSocket group."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "equipment_updates",
        {
            "type": "equipment_update",
            "action": action,
            "equipment_id": equipment_id,
            "data": data,
        }
    )


class EquipmentListView(generics.ListAPIView):
    """Public endpoint: list all active equipment."""
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [LenientClerkAuthentication]

    def get_queryset(self):
        from .models import ModerationStatus
        # Relaxed for demo: show all active equipment (ignore moderation_status)
        qs = Equipment.objects.filter(is_active=True).select_related("vendor")
        # if vendor_subscription_required():  # Commented for demo
        #     qs = qs.filter(vendor__subscription_active=True)
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        sort = self.request.query_params.get("sort")
        max_price = self.request.query_params.get("max_price")
        location = self.request.query_params.get("location")
        section = self.request.query_params.get("section")
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(
                models.Q(name__icontains=search)
                | models.Q(description__icontains=search)
                | models.Q(tags__icontains=search)
                | models.Q(location__icontains=search)
            )
        if max_price:
            try:
                qs = qs.filter(price_per_day__lte=float(max_price))
            except ValueError:
                pass
        if location:
            qs = qs.filter(location__icontains=location)
        if section == "new":
            qs = qs.order_by("-created_at")
        elif section == "popular":
            qs = qs.order_by("-booking_count", "-views_count")
        elif section == "featured":
            qs = (
                qs.annotate(avg_rating=models.Avg("reviews__rating"))
                .filter(models.Q(avg_rating__gte=4) | models.Q(booking_count__gte=3))
                .order_by("-avg_rating", "-booking_count", "-views_count")
            )
        if sort == "price_asc":
            qs = qs.order_by("price_per_day")
        elif sort == "price_desc":
            qs = qs.order_by("-price_per_day")
        elif sort == "popular":
            qs = qs.order_by("-booking_count", "-views_count")
        return qs

    def get(self, request, *args, **kwargs):
        # Try to get from cache for non-filtered requests
        cache_key = equipment_list_cache_key(self, request)
        
        # Only cache simple list requests (no search, no filters)
        if not any([request.query_params.get(k) for k in ['search', 'max_price', 'location']]):
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
        
        response = super().get(request, *args, **kwargs)
        
        # Cache the response for 5 minutes
        if not any([request.query_params.get(k) for k in ['search', 'max_price', 'location']]):
            cache.set(cache_key, response.data, 300)
        
        return response


class EquipmentDetailView(generics.RetrieveAPIView):
    """Public endpoint: single equipment detail."""
    queryset = Equipment.objects.filter(is_active=True).select_related("vendor")
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [LenientClerkAuthentication]

    def get_queryset(self):
        from .models import ModerationStatus
        # Relaxed for demo: show all active equipment
        qs = Equipment.objects.filter(is_active=True).select_related("vendor")
        # if vendor_subscription_required():
        #     qs = qs.filter(vendor__subscription_active=True)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Equipment.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# Cache invalidation helper
def invalidate_equipment_cache():
    """Invalidate all equipment list caches."""
    # Clear common cache keys
    cache.delete("equipment_list:::::::")
    cache.delete("equipment_list::::::")
    cache.delete("equipment_list:::::")
    cache.delete("equipment_list::::")
    cache.delete("equipment_list:::")
    cache.delete("equipment_list::")
    cache.delete("equipment_list:")
    # For more thorough clearing, we could iterate but this covers most cases


class EquipmentCreateView(generics.CreateAPIView):
    """Vendor-only: create new equipment listing."""
    serializer_class = EquipmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user_id = self.request.user.id
        from apps.users.models import UserProfile, UserRole

        profile, _ = UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={"role": UserRole.BUYER},
        )
        if profile.role == UserRole.ADMIN:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admin accounts cannot create vendor listings.")
        if profile.role != UserRole.VENDOR:
            profile.role = UserRole.VENDOR
            profile.save(update_fields=["role"])

        vendor, _ = Vendor.objects.get_or_create(
            user_id=user_id,
            defaults={"company_name": "New Vendor"},
        )
        ensure_vendor_can_list(vendor)
        instance = serializer.save(vendor=vendor)
        # Invalidate cache after creating new equipment
        invalidate_equipment_cache()
        # Broadcast equipment creation
        broadcast_equipment_update("created", instance.id, EquipmentSerializer(instance).data)


class VendorEquipmentListView(generics.ListAPIView):
    """Vendor: list their own equipment."""
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, user_id=self.request.user.id)
        return Equipment.objects.filter(vendor=vendor).order_by("-created_at")


class EquipmentUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Vendor: update or delete own equipment."""
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, user_id=self.request.user.id)
        return Equipment.objects.filter(vendor=vendor)

    def perform_update(self, serializer):
        instance = self.get_object()
        next_is_active = serializer.validated_data.get("is_active", instance.is_active)
        if next_is_active:
            ensure_vendor_can_list(instance.vendor, action="publish equipment")
        instance = serializer.save()
        invalidate_equipment_cache()
        # Broadcast equipment update
        broadcast_equipment_update("updated", instance.id, EquipmentSerializer(instance).data)

    def perform_destroy(self, instance):
        equipment_id = instance.id
        instance.delete()
        invalidate_equipment_cache()
        # Broadcast equipment deletion
        broadcast_equipment_update("deleted", equipment_id)


class EquipmentReviewListCreateView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [LenientClerkAuthentication]

    def get(self, request, equipment_id):
        equipment = get_object_or_404(Equipment, pk=equipment_id, is_active=True)
        reviews = Review.objects.filter(equipment=equipment)
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, equipment_id):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can submit reviews."}, status=status.HTTP_403_FORBIDDEN)

        equipment = get_object_or_404(Equipment, pk=equipment_id, is_active=True)
        has_booking = Booking.objects.filter(
            equipment=equipment,
            user_id=request.user.id,
            status__in=[BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.COMPLETED],
        ).exists()
        if not has_booking:
            return Response(
                {"error": "Review allowed only after booking this equipment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        review = Review.objects.filter(equipment=equipment, user_id=request.user.id).first()
        serializer = ReviewSerializer(instance=review, data=request.data, partial=bool(review))
        serializer.is_valid(raise_exception=True)
        serializer.save(equipment=equipment, user_id=request.user.id)
        return Response(serializer.data, status=status.HTTP_200_OK if review else status.HTTP_201_CREATED)


class ReviewCommentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        comments = ReviewComment.objects.filter(review=review).order_by("created_at")
        return Response(ReviewCommentSerializer(comments, many=True).data)

    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        text = (request.data.get("comment") or "").strip()
        if not text:
            return Response({"error": "comment is required."}, status=status.HTTP_400_BAD_REQUEST)

        parent_id = request.data.get("parent")
        parent = None
        if parent_id is not None:
            parent = get_object_or_404(ReviewComment, id=parent_id, review=review)

        comment = ReviewComment.objects.create(
            review=review,
            user_id=request.user.id,
            parent=parent,
            comment=text,
        )
        return Response(ReviewCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class VendorReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        vendor = get_object_or_404(Vendor, user_id=self.request.user.id)
        return Review.objects.filter(equipment__vendor=vendor).select_related("equipment")


class BuyerReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user_id=self.request.user.id).select_related("equipment")


class WishlistListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Normalize role if needed
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        qs = WishlistItem.objects.filter(user_id=request.user.id).select_related("equipment", "equipment__vendor")
        return Response(WishlistItemSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        # Normalize role if needed
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        equipment_id = request.data.get("equipment_id")
        equipment = get_object_or_404(Equipment, pk=equipment_id, is_active=True)
        item, created = WishlistItem.objects.get_or_create(user_id=request.user.id, equipment=equipment)
        serializer = WishlistItemSerializer(item, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WishlistDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, equipment_id):
        WishlistItem.objects.filter(user_id=request.user.id, equipment_id=equipment_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Normalize role if needed
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        items = CartItem.objects.filter(user_id=request.user.id).select_related("equipment", "equipment__vendor")
        return Response(CartItemSerializer(items, many=True, context={"request": request}).data)

    def post(self, request):
        # Normalize role if needed
        from apps.users.models import UserProfile, UserRole
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        equipment = get_object_or_404(Equipment, pk=request.data.get("equipment_id"), is_active=True)
        serializer = CartItemSerializer(data={
            "equipment": equipment.id,
            "quantity": request.data.get("quantity", 1),
            "start_date": request.data.get("start_date"),
            "end_date": request.data.get("end_date"),
        })
        serializer.is_valid(raise_exception=True)
        item, _ = CartItem.objects.update_or_create(
            user_id=request.user.id,
            equipment=equipment,
            start_date=serializer.validated_data["start_date"],
            end_date=serializer.validated_data["end_date"],
            defaults={"quantity": serializer.validated_data.get("quantity", 1)},
        )
        return Response(CartItemSerializer(item, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        item = get_object_or_404(CartItem, id=item_id, user_id=request.user.id)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, item_id):
        get_object_or_404(CartItem, id=item_id, user_id=request.user.id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VendorSeedProductsView(APIView):
    permission_classes = [permissions.AllowAny]  # Made public for demo seeding
    authentication_classes = [LenientClerkAuthentication]

    def post(self, request):
        # Create demo vendor if needed
        vendor, created = Vendor.objects.get_or_create(
            user_id="demo-seed-vendor",
            defaults={"company_name": "Demo Catalog", "subscription_active": True}
        )
        # Skip subscription check for demo
        # ensure_vendor_can_list(vendor, action="seed listings")
        samples = [
            {
                "name": "Sony FX6 Cinema Camera Kit",
                "description": "Production-ready cinema camera package popular for Indian ad films, wedding shoots, and branded content.",
                "category": "camera",
                "price_per_day": 14000,
                "deposit_amount": 35000,
                "quantity": 2,
                "location": "Mumbai",
                "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
                "tags": "camera,cinema,shoot,mumbai",
            },
            {
                "name": "Canon EOS R5 Wedding Creator Kit",
                "description": "High-demand mirrorless kit for wedding photography, reels, and premium event coverage across Indian metros.",
                "category": "camera",
                "price_per_day": 6500,
                "deposit_amount": 18000,
                "quantity": 3,
                "location": "Bengaluru",
                "image_url": "https://images.unsplash.com/photo-1516724562728-afc824a36e84",
                "tags": "camera,wedding,creator,bengaluru",
            },
            {
                "name": "JCB 3DX Backhoe Loader",
                "description": "India's go-to backhoe loader for excavation, trenching, and contractor site work.",
                "category": "construction",
                "price_per_day": 18000,
                "deposit_amount": 45000,
                "quantity": 1,
                "location": "Hyderabad",
                "image_url": "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375",
                "tags": "jcb,construction,earthwork,hyderabad",
            },
            {
                "name": "Ajax Fiori Concrete Mixer",
                "description": "Self-loading concrete mixer commonly rented for villa projects, apartment works, and local infra jobs.",
                "category": "industrial",
                "price_per_day": 9500,
                "deposit_amount": 22000,
                "quantity": 2,
                "location": "Pune",
                "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
                "tags": "mixer,industrial,concrete,pune",
            },
            {
                "name": "Saregama Event Line Array + DJ Console",
                "description": "Large-format sound setup for sangeet nights, college fests, live bands, and outdoor events.",
                "category": "audio",
                "price_per_day": 15000,
                "deposit_amount": 30000,
                "quantity": 2,
                "location": "Delhi",
                "image_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
                "tags": "audio,dj,event,delhi",
            },
            {
                "name": "Force Tempo Traveller 17 Seater",
                "description": "Reliable crew transport for destination weddings, film units, and corporate offsites.",
                "category": "vehicles",
                "price_per_day": 9500,
                "deposit_amount": 20000,
                "quantity": 2,
                "location": "Chennai",
                "image_url": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
                "tags": "tempo traveller,crew transport,chennai",
            },
        ]

        created = 0
        for payload in samples:
            _, was_created = Equipment.objects.get_or_create(
                vendor=vendor,
                name=payload["name"],
                defaults={
                    **payload,
                    "moderation_status": ModerationStatus.APPROVED,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
        return Response({"created": created, "message": "Sample products synced."})


class VendorReviewReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, review_id):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        review = get_object_or_404(Review, id=review_id, equipment__vendor=vendor)
        reply = (request.data.get("vendor_reply") or "").strip()
        if not reply:
            return Response({"error": "vendor_reply is required."}, status=status.HTTP_400_BAD_REQUEST)
        review.vendor_reply = reply
        review.vendor_reply_updated_at = timezone.now()
        review.save(update_fields=["vendor_reply", "vendor_reply_updated_at", "updated_at"])
        return Response(ReviewSerializer(review).data)
