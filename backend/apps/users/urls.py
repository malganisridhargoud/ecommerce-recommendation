from django.urls import path
from .views import AddressDetailView, AddressListCreateView, ClerkWebhookView, UpdateRoleView, UserMeView, AdminLoginView, UserRoleSyncView

urlpatterns = [
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("me/", UserMeView.as_view(), name="user-me"),
    path("role/", UpdateRoleView.as_view(), name="user-role"),
    path("role/sync/", UserRoleSyncView.as_view(), name="user-role-sync"),
    path("addresses/", AddressListCreateView.as_view(), name="buyer-address-list"),
    path("addresses/<int:pk>/", AddressDetailView.as_view(), name="buyer-address-detail"),
    path("webhook/clerk/", ClerkWebhookView.as_view(), name="clerk-webhook"),
]
