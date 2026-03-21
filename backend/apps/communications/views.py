from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.equipment.models import Equipment
from .models import ChatMessage, ChatThread
from .serializers import ChatMessageSerializer, ChatThreadSerializer
import json
import os


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
        if request.user.is_vendor:
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


class FAQView(APIView):
    """Get all FAQ items."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faq_file = os.path.join(os.path.dirname(__file__), 'faq_data.json')
        try:
            with open(faq_file, 'r') as f:
                faq_data = json.load(f)
            return Response(faq_data)
        except FileNotFoundError:
            return Response({"error": "FAQ data not found"}, status=status.HTTP_404_NOT_FOUND)
        except json.JSONDecodeError:
            return Response({"error": "Invalid FAQ data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FAQAssistantView(APIView):
    """AI-powered FAQ assistant that finds relevant answers."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_question = request.data.get('question', '').strip()
        if not user_question:
            return Response({"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST)

        faq_file = os.path.join(os.path.dirname(__file__), 'faq_data.json')
        try:
            with open(faq_file, 'r') as f:
                faq_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return Response({"answer": "I'm sorry, I'm having trouble accessing my knowledge base right now. Please try again later or contact our support team."})

        # Simple keyword matching for relevant FAQs
        user_question_lower = user_question.lower()
        relevant_faqs = []

        for faq in faq_data:
            question_lower = faq['question'].lower()
            answer_lower = faq['answer'].lower()

            # Check if question contains keywords from FAQ
            if any(keyword in user_question_lower for keyword in question_lower.split()):
                relevant_faqs.append(faq)
            # Check if answer contains relevant information
            elif any(keyword in user_question_lower for keyword in ['how', 'what', 'when', 'where', 'why', 'can', 'do', 'is', 'are'] + question_lower.split()[:3]):
                # Simple relevance check
                if len(set(user_question_lower.split()) & set(answer_lower.split())) > 1:
                    relevant_faqs.append(faq)

        if relevant_faqs:
            # Return the most relevant FAQ
            best_faq = relevant_faqs[0]
            return Response({
                "question": best_faq["question"],
                "answer": best_faq["answer"],
                "faq_id": best_faq["id"]
            })
        else:
            return Response({
                "answer": "I couldn't find a specific answer to your question. Here are some popular topics you might find helpful:",
                "suggestions": [faq["question"] for faq in faq_data[:3]]
            })
