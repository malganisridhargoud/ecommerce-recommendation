from django.urls import path
from .views import ChatMessageListCreateView, ChatThreadListCreateView

urlpatterns = [
    path("threads/", ChatThreadListCreateView.as_view(), name="chat-threads"),
    path("threads/<int:thread_id>/messages/", ChatMessageListCreateView.as_view(), name="chat-messages"),
]
