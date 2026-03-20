from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user_id", "role", "full_name", "created_at", "updated_at")
    list_filter = ("role",)
    search_fields = ("user_id", "full_name", "phone")
