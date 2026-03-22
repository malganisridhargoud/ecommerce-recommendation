from django.db import models
from apps.equipment.models import Equipment


class ChatThread(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="chat_threads")
    buyer_id = models.CharField(max_length=255)
    vendor_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_threads"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["equipment", "buyer_id", "vendor_id"], name="unique_thread_per_parties")
        ]


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages")
    sender_id = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    attachment_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        ordering = ["created_at"]


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    user_id = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.CharField(max_length=255, blank=True)  # admin user id
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_tickets"
        ordering = ["-created_at"]

