from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from apps.control.serializers import VendorKYCSerializer, VendorListSerializer, EquipmentModerationSerializer
from apps.equipment.models import Vendor, KYCStatus, Equipment, ModerationStatus
from apps.vendors.models import VendorKYC

class KYCSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        vendor = Vendor.objects.get(user_id=request.user.id)
        kyc, created = VendorKYC.objects.get_or_create(vendor=vendor, defaults={'status': 'pending'})
        serializer = VendorKYCSerializer(kyc, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            vendor.kyc_status = KYCStatus.PENDING
            vendor.save(update_fields=['kyc_status'])
            return Response({'message': 'KYC submitted for review', 'status': 'pending'}, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KYCApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(Vendor, id=vendor_id)
        status = request.data.get('status')
        reason = request.data.get('rejection_reason', '')
        if status not in ['verified', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        vendor.kyc_status = status
        vendor.save(update_fields=['kyc_status'])
        kyc, _ = VendorKYC.objects.get_or_create(vendor=vendor)
        kyc.status = 'approved' if status == 'verified' else 'rejected'
        kyc.rejection_reason = reason if status == 'rejected' else ''
        kyc.documents_verified = (status == 'verified')
        kyc.save()
        return Response({'message': f'KYC {status} for {vendor.company_name}'})

class VendorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        kyc_status = request.query_params.get('kyc_status')
        qs = Vendor.objects.select_related('kyc').all()
        if kyc_status:
            qs = qs.filter(kyc_status=kyc_status)
        serializer = VendorListSerializer(qs, many=True)
        return Response(serializer.data)

class KYCDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vendor_id):
        vendor = get_object_or_404(Vendor, id=vendor_id)
        serializer = VendorListSerializer(vendor)
        return Response(serializer.data)

class EquipmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        moderation_status = request.query_params.get('moderation_status')
        qs = Equipment.objects.select_related('vendor').all()
        if moderation_status:
            qs = qs.filter(moderation_status=moderation_status)
        serializer = EquipmentModerationSerializer(qs, many=True)
        return Response(serializer.data)

class EquipmentModerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, equipment_id):
        equipment = get_object_or_404(Equipment, id=equipment_id)
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        if action not in ['approve', 'reject']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        equipment.moderation_status = ModerationStatus.APPROVED if action == 'approve' else ModerationStatus.REJECTED
        equipment.moderation_notes = notes
        equipment.save()
        return Response({'message': f'Equipment {action}d'})

class UserActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Mock user action
        return Response({'message': 'Action performed'})

