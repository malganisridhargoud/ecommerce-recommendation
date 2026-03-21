from django.urls import path
from .views import ChatMessageListCreateView, ChatThreadListCreateView, FAQView, FAQAssistantView

urlpatterns = [
    path("threads/", ChatThreadListCreateView.as_view(), name="chat-threads"),
    path("threads/<int:thread_id>/messages/", ChatMessageListCreateView.as_view(), name="chat-messages"),
    path("faq/", FAQView.as_view(), name="faq"),
    path("assistant/", FAQAssistantView.as_view(), name="faq-assistant"),
]
