from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.equipment.models import Equipment, EquipmentCategory, Vendor


SEED_VENDOR_USER_ID = "seed-vendor"

CATALOG = [
    {
        "name": "Canon EOS R6 Mark II Wedding Kit",
        "category": EquipmentCategory.CAMERA,
        "price_per_day": Decimal("4800"),
        "quantity": 2,
        "location": "Bengaluru",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        "description": "Full-frame mirrorless kit widely rented for weddings, fashion shoots, and creator work in Indian metros.",
    },
    {
        "name": "Sony FX6 Cinema Camera",
        "category": EquipmentCategory.CAMERA,
        "price_per_day": Decimal("13500"),
        "quantity": 1,
        "location": "Mumbai",
        "image_url": "https://images.unsplash.com/photo-1495707902641-75cac588d2e9",
        "description": "Cinema camera package used for ad films, music videos, and premium event coverage.",
    },
    {
        "name": "Ajax Concrete Mixer 250L",
        "category": EquipmentCategory.CONSTRUCTION,
        "price_per_day": Decimal("3200"),
        "quantity": 4,
        "location": "Pune",
        "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd",
        "description": "Concrete mixer suited for builder projects, villa construction, and site slab work.",
    },
    {
        "name": "Bosch Electric Jack Hammer 1500W",
        "category": EquipmentCategory.CONSTRUCTION,
        "price_per_day": Decimal("1900"),
        "quantity": 6,
        "location": "Hyderabad",
        "image_url": "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc",
        "description": "Heavy-duty demolition hammer for renovation, road cutting, and concrete breaking jobs.",
    },
    {
        "name": "Wedding Truss Lighting Rig Kit",
        "category": EquipmentCategory.EVENT,
        "price_per_day": Decimal("6500"),
        "quantity": 2,
        "location": "Delhi",
        "image_url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
        "description": "Modular truss and stage lighting package for wedding receptions, cultural shows, and college fests.",
    },
    {
        "name": "P3.9 LED Video Wall Panel Set",
        "category": EquipmentCategory.EVENT,
        "price_per_day": Decimal("12000"),
        "quantity": 2,
        "location": "Chennai",
        "image_url": "https://images.unsplash.com/photo-1464375117522-1311dd6a1b76",
        "description": "Event LED wall panels for sangeet stages, conferences, and concert backdrops.",
    },
    {
        "name": "Kirloskar Diesel Air Compressor 185 CFM",
        "category": EquipmentCategory.INDUSTRIAL,
        "price_per_day": Decimal("7200"),
        "quantity": 2,
        "location": "Ahmedabad",
        "image_url": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c",
        "description": "Industrial air compressor for fabrication shops, road work, and pneumatic tool fleets.",
    },
    {
        "name": "Godrej 3 Ton Forklift",
        "category": EquipmentCategory.INDUSTRIAL,
        "price_per_day": Decimal("9000"),
        "quantity": 1,
        "location": "Noida",
        "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
        "description": "Warehouse forklift with operator option for factory loading, racking, and dispatch operations.",
    },
    {
        "name": "JBL Line Array Speaker Set",
        "category": EquipmentCategory.AUDIO,
        "price_per_day": Decimal("8500"),
        "quantity": 3,
        "location": "Kolkata",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
        "description": "Professional PA line array package for live music, weddings, and public events.",
    },
    {
        "name": "Shure Wireless Microphone 8-Channel Kit",
        "category": EquipmentCategory.AUDIO,
        "price_per_day": Decimal("3200"),
        "quantity": 5,
        "location": "Jaipur",
        "image_url": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0",
        "description": "Conference and stage microphone kit for weddings, corporate events, and devotional programs.",
    },
    {
        "name": "Tata Hitachi Mini Excavator",
        "category": EquipmentCategory.VEHICLES,
        "price_per_day": Decimal("16000"),
        "quantity": 2,
        "location": "Lucknow",
        "image_url": "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375",
        "description": "Compact excavator for trenching, utility works, and real-estate site preparation.",
    },
    {
        "name": "Tata Ace Gold Pickup",
        "category": EquipmentCategory.VEHICLES,
        "price_per_day": Decimal("2800"),
        "quantity": 4,
        "location": "Surat",
        "image_url": "https://images.unsplash.com/photo-1493238792000-8113da705763",
        "description": "Small commercial cargo vehicle for city deliveries, event logistics, and vendor transport.",
    },
    {
        "name": "Kirloskar Silent Generator 40kVA",
        "category": EquipmentCategory.OTHER,
        "price_per_day": Decimal("6800"),
        "quantity": 3,
        "location": "Bhopal",
        "image_url": "https://images.unsplash.com/photo-1581091870622-2f6c6f36fe52",
        "description": "Silent generator set for outdoor weddings, exhibitions, site offices, and backup power needs.",
    },
]


class Command(BaseCommand):
    help = "Seed a production-like equipment catalog across all categories."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing equipment for the seed vendor before creating fresh records.",
        )

    def handle(self, *args, **options):
        vendor, _ = Vendor.objects.get_or_create(
            user_id=SEED_VENDOR_USER_ID,
            defaults={
                "company_name": "TapRent Catalog Vendor",
                "email": "catalog@taprent.local",
                "subscription_active": True,
            },
        )
        if not vendor.subscription_active:
            vendor.subscription_active = True
            vendor.save(update_fields=["subscription_active"])

        if options["reset"]:
            Equipment.objects.filter(vendor=vendor).delete()

        created = 0
        updated = 0
        for payload in CATALOG:
            equipment, was_created = Equipment.objects.update_or_create(
                vendor=vendor,
                name=payload["name"],
                defaults=payload,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog seeded successfully. created={created}, updated={updated}, vendor_id={vendor.id}"
            )
        )
