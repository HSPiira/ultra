"""
Django management command to seed industries.

Usage:
    python manage.py seed_industries
    python manage.py seed_industries --reset  # Delete existing industries first
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.companies.models.industry import Industry


INDUSTRIES = [
    # --- Primary Sector ---
    ("Agriculture & Farming", "Crop production, animal farming, horticulture, and agribusiness."),
    ("Fishing & Aquaculture", "Fish catching, fish farming, and seafood production."),
    ("Forestry & Logging", "Forest management, timber harvesting, and logging operations."),
    ("Mining & Extraction", "Coal, metal ores, oil, gas, and mineral extraction industries."),
    # --- Secondary Sector ---
    ("Aerospace & Defense", "Aircraft, spacecraft, weapons, and defense equipment manufacturing."),
    ("Automotive", "Vehicle production, auto components, and tire manufacturing."),
    ("Chemical Manufacturing", "Commodity and specialty chemicals, fertilizers, and industrial gases."),
    ("Construction", "Residential, commercial, and heavy engineering construction."),
    ("Consumer Goods", "FMCG, apparel, furniture, and electronics manufacturing."),
    ("Electronics", "Computers, semiconductors, and hardware manufacturing."),
    ("Food & Beverage Processing", "Food manufacturing, beverage production, and packaging."),
    ("Industrial Machinery", "Machinery for manufacturing, construction, and agriculture."),
    ("Pharmaceuticals & Biotechnology", "Drug development, biotechnology, and medical research."),
    ("Steel & Metals", "Steel, aluminum, and other metal production."),
    ("Textiles & Apparel", "Textile mills, clothing, and fashion manufacturing."),
    ("Utilities", "Electric power, water supply, and sewage treatment services."),
    # --- Tertiary Sector ---
    ("Accounting", "Financial auditing, bookkeeping, and tax consultancy."),
    ("Advertising & Marketing", "Advertising agencies, branding, and public relations."),
    ("Banking & Finance", "Banking, insurance, investment, and real estate services."),
    ("Education", "Schools, universities, and training institutions."),
    ("Entertainment & Media", "Film, music, publishing, and gaming industries."),
    ("Healthcare", "Hospitals, clinics, and medical device services."),
    ("Hospitality & Tourism", "Hotels, restaurants, and travel services."),
    ("Information Technology (IT)", "Software, cybersecurity, and internet-based services."),
    ("Legal Services", "Law firms, legal advisory, and arbitration services."),
    ("Logistics & Transportation", "Freight, shipping, and warehousing services."),
    ("Professional Services", "Consulting, HR, and management services."),
    ("Real Estate", "Property development, leasing, and brokerage."),
    ("Retail & Wholesale", "Consumer goods sales and distribution."),
    ("Telecommunications", "Voice, data, and internet service providers."),
    ("Waste Management & Environmental Services", "Recycling, sanitation, and environmental solutions."),
]


class Command(BaseCommand):
    help = "Seed the database with industries. Can be run on initial setup or whenever needed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing industries before seeding (use with caution)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without actually creating industries",
        )

    def handle(self, *args, **options):
        reset = options["reset"]
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE - No changes will be made")
            )
            self.stdout.write("")

        # Count existing industries
        existing_count = Industry.objects.count()
        self.stdout.write(f"Existing industries in database: {existing_count}")

        if reset:
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"Would delete {existing_count} existing industries"
                    )
                )
            else:
                deleted_count, _ = Industry.objects.all().delete()
                self.stdout.write(
                    self.style.WARNING(f"Deleted {deleted_count} existing industries")
                )
                existing_count = 0

        # Track statistics
        created_count = 0
        skipped_count = 0
        updated_count = 0

        with transaction.atomic():
            for industry_name, description in INDUSTRIES:
                if dry_run:
                    # In dry-run mode, just check if it exists without creating
                    try:
                        industry = Industry.objects.get(industry_name=industry_name)
                        # Industry exists - check if description needs updating
                        if industry.description != description:
                            updated_count += 1
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Would update: {industry_name} (description changed)"
                                )
                            )
                        else:
                            skipped_count += 1
                            self.stdout.write(
                                self.style.NOTICE(f"⊘ Skipped: {industry_name} (already exists)")
                            )
                    except Industry.DoesNotExist:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"✓ Would create: {industry_name}")
                        )
                else:
                    # Normal mode - create or update
                    industry, created = Industry.objects.get_or_create(
                        industry_name=industry_name,
                        defaults={"description": description},
                    )

                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"✓ Created: {industry_name}")
                        )
                    else:
                        # Industry exists - check if description needs updating
                        if industry.description != description:
                            industry.description = description
                            industry.save(update_fields=["description"])
                            updated_count += 1
                            self.stdout.write(
                                self.style.WARNING(
                                    f"↻ Updated: {industry_name} (description changed)"
                                )
                            )
                        else:
                            skipped_count += 1
                            self.stdout.write(
                                self.style.NOTICE(f"⊘ Skipped: {industry_name} (already exists)")
                            )

        # Summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        if dry_run:
            self.stdout.write(self.style.SUCCESS("DRY RUN SUMMARY"))
        else:
            self.stdout.write(self.style.SUCCESS("SEEDING SUMMARY"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Total industries in seed data: {len(INDUSTRIES)}")
        if not dry_run:
            self.stdout.write(f"Created: {created_count}")
            self.stdout.write(f"Updated: {updated_count}")
        else:
            self.stdout.write(f"Would create: {created_count}")
            self.stdout.write(f"Would update: {updated_count}")
        self.stdout.write(f"Skipped (already exist): {skipped_count}")
        if not dry_run:
            self.stdout.write(f"Final count: {Industry.objects.count()}")
        else:
            self.stdout.write(f"Current count: {Industry.objects.count()}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Run without --dry-run to actually create/update industries"
                )
            )

