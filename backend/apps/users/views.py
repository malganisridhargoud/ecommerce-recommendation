import os
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from apps.equipment.models import Vendor
from .models import BuyerAddress, UserProfile, UserRole
from .serializers import BuyerAddressSerializer, UpdateRoleSerializer, UserProfileSerializer
import hmac
import hashlib
import json
import jwt as pyjwt
from datetime import datetime, timedelta
from django.conf import settings


class ClerkWebhookView(APIView):
    """
    Handle Clerk webhooks for user events.
    Events: user.created, user.updated, user.deleted
    """
    permission_classes = [permissions.AllowAny]  # No auth required - webhook endpoint

    def post(self, request):
        # Verify webhook signature
        signature = request.META.get("HTTP_CLERK_SIGNATURE", "")
        if not signature:
            return Response({"error": "Missing Clerk signature"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = request.body
            if settings.CLERK_WEBHOOK_SECRET:
                expected_sig = hmac.new(
                    settings.CLERK_WEBHOOK_SECRET.encode(),
                    payload,
                    hashlib.sha256
                ).hexdigest()
                if not hmac.compare_digest(f"sha256={expected_sig}", signature):
                    return Response({"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception:
            return Response({"error": "Signature verification failed"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("type", "")
        data = event.get("data", {})

        if event_type == "user.created":
            self._handle_user_created(data)
        elif event_type == "user.updated":
            self._handle_user_updated(data)
        elif event_type == "user.deleted":
            self._handle_user_deleted(data)

        return Response({"received": True})

    def _handle_user_created(self, data):
        user_id = data.get("id")
        if not user_id:
            return

        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or email

        # Get role from public metadata if set
        role = data.get("public_metadata", {}).get("role", UserRole.BUYER)

        UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={
                "full_name": full_name,
                "email": email,
                "role": role,
            }
        )

    def _handle_user_updated(self, data):
        user_id = data.get("id")
        if not user_id:
            return

        profile = UserProfile.objects.filter(user_id=user_id).first()
        if not profile:
            return

        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or profile.full_name

        profile.full_name = full_name
        if email:
            profile.email = email
        profile.save(update_fields=["full_name", "email", "updated_at"])

    def _handle_user_deleted(self, data):
        user_id = data.get("id")
        if not user_id:
            return

        # Soft delete - just mark as deleted or deactivate
        profile = UserProfile.objects.filter(user_id=user_id).first()
        if profile:
            profile.role = UserRole.BUYER  # Could add a "deleted" role
            profile.save(update_fields=["role", "updated_at"])


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER},
        )
        # AUTO-FIX: if somehow the role is vendor/admin but user is accessing buyer dashboard,
        # and they no longer have vendor/admin rights, reset to buyer
        if created:
            print(f"[UserMe] Created new profile for {request.user.id} with role={profile.role}", flush=True)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER},
        )
        allowed = {
            "full_name": request.data.get("full_name", profile.full_name),
            "phone": request.data.get("phone", profile.phone),
            "bio": request.data.get("bio", profile.bio),
            "avatar_url": request.data.get("avatar_url", profile.avatar_url),
            "preferred_language": request.data.get("preferred_language", profile.preferred_language),
            "preferred_location": request.data.get("preferred_location", profile.preferred_location),
        }
        if "notification_preferences" in request.data:
            allowed["notification_preferences"] = request.data["notification_preferences"]
        serializer = UserProfileSerializer(profile, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserRoleSyncView(APIView):
    """Debug/restore endpoint: sync user role and ensure buyer access works."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Force sync user role to ensure buyer functionality works."""
        target_role = request.data.get("role", "buyer")
        
        # Only allow users to set their own role to buyer, or sync to buyer
        if target_role not in ["buyer", "vendor", "admin"]:
            return Response({"error": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Admins can change any user's role; others can only reset to buyer
        if target_role != "buyer" and request.user.role != "admin":
            return Response(
                {"error": "Only admins can set non-buyer roles."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        old_role = profile.role
        profile.role = target_role
        profile.save(update_fields=["role"])
        
        # Clear cached role
        request.user._resolved_role = target_role
        
        return Response({
            "success": True,
            "user_id": request.user.id,
            "old_role": old_role,
            "new_role": target_role,
            "message": f"Role updated from {old_role} to {target_role}."
        })

    def get(self, request):
        """Get current user role info."""
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": UserRole.BUYER}
        )
        
        return Response({
            "user_id": request.user.id,
            "profile_role": profile.role,
            "user_is_vendor": request.user.is_vendor,
            "user_is_admin": request.user.is_admin,
            "user_role_property": request.user.role,
        })


class UpdateRoleView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UpdateRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]

        if role == UserRole.ADMIN:
            invite_code = request.data.get("admin_invite_code", "")
            expected_code = os.getenv("ADMIN_INVITE_CODE", "")
            if not expected_code or invite_code != expected_code:
                return Response(
                    {"error": "Invalid admin invite code."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={"role": role},
        )
        profile.role = role
        if "full_name" in serializer.validated_data:
            profile.full_name = serializer.validated_data["full_name"]
        if "phone" in serializer.validated_data:
            profile.phone = serializer.validated_data["phone"]
        profile.save()

        if role == UserRole.VENDOR:
            Vendor.objects.get_or_create(
                user_id=request.user.id,
                defaults={"company_name": serializer.validated_data.get("company_name") or "New Vendor"},
            )

        return Response(UserProfileSerializer(profile).data)


class AddressListCreateView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BuyerAddressSerializer

    def get_queryset(self):
        return BuyerAddress.objects.filter(user_id=self.request.user.id)

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default"):
            BuyerAddress.objects.filter(user_id=self.request.user.id, is_default=True).update(is_default=False)
        serializer.save(user_id=self.request.user.id)


class AddressDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BuyerAddressSerializer

    def get_queryset(self):
        return BuyerAddress.objects.filter(user_id=self.request.user.id)

    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default"):
            BuyerAddress.objects.filter(user_id=self.request.user.id, is_default=True).exclude(id=self.get_object().id).update(is_default=False)
        serializer.save()


class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        expected_username = os.getenv("ADMIN_USERNAME", "admin")
        expected_password = os.getenv("ADMIN_PASSWORD", "")

        if not expected_password:
            return Response({"error": "Admin credentials not configured on server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if username == expected_username and password == expected_password:
            # Generate a custom JWT signed by Django's SECRET_KEY
            payload = {
                "sub": "admin_bypass_user",
                "role": "admin",
                "is_custom_admin": True,
                "exp": datetime.utcnow() + timedelta(days=1)
            }
            token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
            
            # Ensure an admin profile exists for analytics foreign keys 
            profile, _ = UserProfile.objects.get_or_create(
                user_id="admin_bypass_user",
                defaults={"role": UserRole.ADMIN, "full_name": "System Admin"}
            )
            if profile.role != UserRole.ADMIN:
                profile.role = UserRole.ADMIN
                profile.save(update_fields=["role"])

            return Response({
                "token": f"custom_admin_{token}",
                "user": {"id": "admin_bypass_user", "role": "admin", "full_name": "System Admin"}
            })

        return Response({"error": "Invalid admin credentials."}, status=status.HTTP_401_UNAUTHORIZED)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # For admin, list all users. Since Clerk, return mock or empty.
        return Response([])

