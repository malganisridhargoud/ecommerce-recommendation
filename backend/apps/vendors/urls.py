from django.urls import path
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.equipment.models import Vendor
from apps.equipment.serializers import VendorSerializer


class VendorProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor, _ = Vendor.objects.get_or_create(
            user_id=request.user.id,
            defaults={"company_name": "My Company"},
        )
        return Response(VendorSerializer(vendor).data)

    def patch(self, request):
        vendor = get_object_or_404(Vendor, user_id=request.user.id)
        serializer = VendorSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


urlpatterns = [
    path("profile/", VendorProfileView.as_view(), name="vendor-profile"),
]