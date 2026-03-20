import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.equipment.models import Equipment, Review
from apps.users.models import UserProfile, UserRole

class Command(BaseCommand):
    help = "Seeds dummy reviews and ratings for all equipment"

    def handle(self, *args, **kwargs):
        equipment_list = Equipment.objects.filter(is_active=True)
        if not equipment_list.exists():
            self.stdout.write(self.style.WARNING("No active equipment found to seed reviews."))
            return

        review_templates = [
            ("Excellent condition", "The equipment was exactly as described and worked flawlessly.", 5),
            ("Great experience", "Smooth rental process and the gear was in great shape.", 5),
            ("Good value", "Worked well for my project, minor wear and tear but acceptable.", 4),
            ("Reliable equipment", "No issues during my rental period, highly recommended.", 5),
            ("Decent", "It got the job done, but battery life was a bit short.", 4),
            ("Amazing service", "Vendor was extremely helpful and the item was perfect.", 5),
            ("Solid performance", "Used it for a 3-day shoot, handled everything perfectly.", 4),
            ("Very satisfied", "Clean, well-maintained, and easy to use.", 5),
            ("Okay", "Worked fine but pickup was slightly delayed.", 3),
            ("Fantastic", "Will definitely rent from this vendor again!", 5),
        ]

        dummy_users = []
        for i in range(1, 11):
            user_id = f"dummy_user_{i}"
            profile, _ = UserProfile.objects.get_or_create(
                user_id=user_id,
                defaults={
                    "role": UserRole.BUYER,
                    "full_name": f"Dummy Reviewer {i}",
                }
            )
            dummy_users.append(user_id)

        created_count = 0
        for eq in equipment_list:
            num_reviews = random.randint(3, 8)
            existing_count = eq.reviews.count()
            
            if existing_count >= num_reviews:
                continue

            reviews_to_add = num_reviews - existing_count
            selected_users = random.sample(dummy_users, min(reviews_to_add, len(dummy_users)))

            for user_id in selected_users:
                template = random.choice(review_templates)
                
                # Check if this dummy user already reviewed this equipment
                if Review.objects.filter(equipment=eq, user_id=user_id).exists():
                    continue
                    
                days_ago = random.randint(1, 60)
                review_date = timezone.now() - timedelta(days=days_ago)
                
                review = Review.objects.create(
                    equipment=eq,
                    user_id=user_id,
                    title=template[0],
                    comment=template[1],
                    rating=template[2],
                )
                
                # Manually set created_at
                Review.objects.filter(id=review.id).update(created_at=review_date)
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} dummy reviews."))
