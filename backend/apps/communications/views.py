from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.equipment.models import Equipment
from .models import ChatMessage, ChatThread
from .serializers import ChatMessageSerializer, ChatThreadSerializer


class ChatThreadListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        threads = (
            ChatThread.objects.filter(Q(buyer_id=user_id) | Q(vendor_id=user_id))
            .select_related("equipment", "equipment__vendor")
            .order_by("-updated_at")
        )
        return Response(ChatThreadSerializer(threads, many=True).data)

    def post(self, request):
        if request.user.is_vendor or request.user.is_admin:
            return Response({"error": "Only buyers can initiate chat from equipment detail."}, status=status.HTTP_403_FORBIDDEN)
        equipment = get_object_or_404(Equipment, pk=request.data.get("equipment_id"), is_active=True)
        buyer_id = request.user.id
        vendor_id = equipment.vendor.user_id
        if buyer_id == vendor_id:
            return Response({"error": "Cannot start chat on your own listing."}, status=status.HTTP_400_BAD_REQUEST)
        thread, _ = ChatThread.objects.get_or_create(
            equipment=equipment,
            buyer_id=buyer_id,
            vendor_id=vendor_id,
        )
        return Response(ChatThreadSerializer(thread).data, status=status.HTTP_201_CREATED)


class ChatMessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, thread_id):
        thread = get_object_or_404(ChatThread, pk=thread_id)
        if request.user.id not in {thread.buyer_id, thread.vendor_id} and not request.user.is_admin:
            return Response({"error": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        messages = ChatMessage.objects.filter(thread=thread).order_by("created_at")
        return Response(ChatMessageSerializer(messages, many=True).data)

    def post(self, request, thread_id):
        thread = get_object_or_404(ChatThread, pk=thread_id)
        if request.user.id not in {thread.buyer_id, thread.vendor_id} and not request.user.is_admin:
            return Response({"error": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        text = (request.data.get("message") or "").strip()
        if not text:
            return Response({"error": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(thread=thread, sender_id=request.user.id)
        thread.save(update_fields=["updated_at"])
        return Response(serializer.data, status=status.HTTP_201_CREATED)
