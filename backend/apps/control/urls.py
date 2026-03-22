from django.urls import path
from .views import KYCSubmitView, KYCApproveView, VendorListView, KYCDetailView, EquipmentListView, EquipmentModerateView, UserActionView
from apps.communications.views import SupportTicketListCreateView
from apps.bookings.views import DisputeListView

urlpatterns = [
    path('vendors/kyc/submit/', KYCSubmitView.as_view(), name='kyc-submit'),
    path('vendors/kyc/<int:vendor_id>/', KYCDetailView.as_view(), name='kyc-detail'),
    path('vendors/kyc/<int:vendor_id>/approve/', KYCApproveView.as_view(), name='kyc-approve'),
    path('vendors/', VendorListView.as_view(), name='vendor-list'),
    path('equipment/', EquipmentListView.as_view(), name='equipment-list'),
    path('equipment/<int:equipment_id>/moderate/', EquipmentModerateView.as_view(), name='equipment-moderate'),
    path('users/action/', UserActionView.as_view(), name='user-action'),
    path('support/tickets/', SupportTicketListCreateView.as_view(), name='support-tickets'),
    path('disputes/', DisputeListView.as_view(), name='control-disputes'),
]

