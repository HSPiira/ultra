"""
Django management command to seed companies.

Usage:
    python manage.py seed_companies
    python manage.py seed_companies --reset  # Delete existing companies first
    python manage.py seed_companies --industry-id <id>  # Use specific industry for all companies
    python manage.py seed_companies --csv <file.csv>  # Import from CSV file
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.companies.models.company import Company
from apps.companies.models.industry import Industry
from apps.core.utils.validators import normalize_phone_number, DEFAULT_COUNTRY_CODE
from pathlib import Path
import re
import csv


# Company data from the provided table
COMPANIES = [
    {
        "company_name": "NOKIA SIEMENS NETWORKS",
        "company_address": "P.O. Box: 16644 | Plot 15 Yusuf Lule Rd | Kampala | Uganda",
        "contact_person": "Josephine Ndunge",
        "phone_number": "+254202758000",  # Office number
        "email": "josephine.ndunge@nsn.com",
        "website": None,
    },
    {
        "company_name": "TULLOW UGANDA OPERATIONS PTY LTD",
        "company_address": "Plot 85, 6th Street, Industrial Area, P.O.Box 32111, Kampala",
        "contact_person": "Esther Mirembe Kansere Senior Human Resources Advi",
        "phone_number": "+256776221640",  # Mobile number
        "email": "esther.kansere@tullowoil.com",
        "website": "www.tullowoil.com",
    },
    {
        "company_name": "WESTERN CABLES",
        "company_address": "",
        "contact_person": "Juliet Namuli",
        "phone_number": "+256414347996",  # Tel number
        "email": "JNamuli@eacables.com",
        "website": None,
    },
    {
        "company_name": "SANLAM LIFE INSURANCE (U) LIMITED",
        "company_address": "Plot No.3, Nakasero Hill Road, Kampala, UgandaPO Box 25495, Kampala",
        "contact_person": "Nicholas Lutakome CORPORATE RELATIONSHIP MANAGER",
        "phone_number": "+256417726526",  # Tel +256 417 |SANLAM(726526)
        "email": "nicholas.lutakome@sanlam.co.ug",
        "website": "www.ogilvy.com",
    },
    {
        "company_name": "MORINGA",
        "company_address": "The Brand House, 41 Luthuli AveP.O. Box 71500",
        "contact_person": "Jonathan Kioko",
        "phone_number": "+256758200253",  # Tel: +256 (0)758 200253
        "email": "Jonathan. Kioko@ogilvy.co.ug",
        "website": "www.ogilvy.com",
    },
]


def extract_phone_number(phone_str: str) -> str:
    """
    Extract and normalize phone number from various formats.
    
    Handles formats like:
    - "Office: +254202758000"
    - "Mobile: +256 776 221640"
    - "Tel: 0414 347996"
    - "+256 (0)758 200253"
    - Multiple numbers separated by "|" (takes first valid one)
    """
    if not phone_str or phone_str in ("-", "None", "N/A"):
        return ""
    
    # Handle multiple phone numbers separated by | or ,
    # Split and take the first valid one
    if "|" in phone_str:
        phone_str = phone_str.split("|")[0].strip()
    elif "," in phone_str:
        phone_str = phone_str.split(",")[0].strip()
    
    # Remove labels like "Office:", "Mobile:", "Desk:", "Tel:", "T:", "M:", "Cell:", "Landline:"
    phone_str = re.sub(r'^(Office|Mobile|Desk|Tel|T|M|Cell|Landline|Fax):\s*', '', phone_str, flags=re.IGNORECASE)
    
    # Remove text in parentheses like "SANLAM(726526)"
    phone_str = re.sub(r'\([^)]*\)', '', phone_str)
    
    # Remove parentheses and extra spaces
    phone_str = re.sub(r'[()]', '', phone_str)
    phone_str = re.sub(r'\s+', '', phone_str)
    
    # Remove dots and other separators
    phone_str = phone_str.replace('.', '').replace('-', '')
    
    # Skip if too short or invalid
    if len(phone_str) < 7:
        return ""
    
    # Try to normalize using the validator
    try:
        normalized = normalize_phone_number(phone_str)
        # Validate it's a reasonable length (at least 10 digits)
        digits_only = re.sub(r'[^\d]', '', normalized)
        if len(digits_only) >= 10:
            return normalized
    except Exception:
        pass
    
    # If normalization fails, try to clean it manually
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_str)
    
    # Skip if too short
    if len(cleaned.replace('+', '')) < 7:
        return ""
    
    if cleaned.startswith('+'):
        # Validate length
        if len(cleaned) >= 11:  # + and at least 10 digits
            return cleaned
    else:
        # If no +, assume it's a local number and add country code
        if cleaned and len(cleaned) >= 7:
            # Remove leading zeros from local number before adding country code
            cleaned = cleaned.lstrip('0')
            # Only add country code if we still have a valid number after stripping zeros
            if cleaned and len(cleaned) >= 7:
                return DEFAULT_COUNTRY_CODE + cleaned

    return ""


def normalize_website(website: str) -> str:
    """Normalize website URL."""
    if not website:
        return ""
    website = website.strip()
    if website and not website.startswith(('http://', 'https://')):
        website = 'https://' + website
    return website


class Command(BaseCommand):
    help = "Seed the database with companies. Can be run on initial setup or whenever needed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing companies before seeding (use with caution)",
        )
        parser.add_argument(
            "--industry-id",
            type=str,
            help="Use a specific industry ID for all companies (default: tries to find 'Professional Services' or first available)",
        )
        parser.add_argument(
            "--csv",
            type=str,
            help="Import companies from a CSV file. CSV should have columns: company_name, company_address, contact_person, phone_number, email, website",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without actually creating companies",
        )

    def load_companies_from_csv(self, csv_path: str) -> list:
        """Load companies from CSV file."""
        companies = []
        csv_file = Path(csv_path)
        
        if not csv_file.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        # Try UTF-8 with BOM first, then fallback to UTF-8
        encodings = ['utf-8-sig', 'utf-8']
        
        for encoding in encodings:
            try:
                with open(csv_file, encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    
                    for row in reader:
                        # Create normalized row dict
                        normalized_row = {}
                        for key, value in row.items():
                            # Remove BOM and normalize key
                            clean_key = key.strip().replace('\ufeff', '').upper()
                            normalized_row[clean_key] = value
                        
                        # Handle both uppercase and lowercase column names
                        company_name = (
                            normalized_row.get("COMPANY_NAME", "") or 
                            normalized_row.get("company_name", "")
                        ).strip()
                        
                        # Skip rows with no company name
                        if not company_name or company_name == "-":
                            continue
                        
                        # Get other fields (handle both cases)
                        company_address = (
                            normalized_row.get("COMPANY_ADDRESS", "") or 
                            normalized_row.get("company_address", "")
                        ).strip()
                        if company_address == "-":
                            company_address = ""
                        
                        contact_person = (
                            normalized_row.get("CONTACT_PERSON", "") or 
                            normalized_row.get("contact_person", "")
                        ).strip()
                        if contact_person in ("-", "None", "N/A"):
                            contact_person = ""
                        
                        phone_number = (
                            normalized_row.get("PHONE_NUMBER", "") or 
                            normalized_row.get("phone_number", "")
                        ).strip()
                        if phone_number in ("-", "None", "N/A"):
                            phone_number = ""
                        
                        email = (
                            normalized_row.get("EMAIL", "") or 
                            normalized_row.get("email", "")
                        ).strip()
                        if email in ("-", "None", "N/A", "email"):
                            email = ""
                        
                        website = (
                            normalized_row.get("WEBSITE", "") or 
                            normalized_row.get("website", "")
                        ).strip()
                        if website in ("-", "None", "N/A", "www"):
                            website = ""
                        
                        companies.append({
                            "company_name": company_name,
                            "company_address": company_address,
                            "contact_person": contact_person,
                            "phone_number": phone_number,
                            "email": email,
                            "website": website or None,
                        })
                
                break  # Successfully read, exit loop
            except UnicodeDecodeError:
                continue  # Try next encoding
            except Exception as e:
                if encoding == encodings[-1]:  # Last encoding
                    raise Exception(f"Error reading CSV file: {str(e)}") from e
                continue
        
        return companies

    def handle(self, **options):
        reset = options["reset"]
        industry_id = options.get("industry_id")
        csv_file = options.get("csv")
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE - No changes will be made")
            )
            self.stdout.write("")

        # Load companies from CSV or use default list
        if csv_file:
            try:
                companies_to_seed = self.load_companies_from_csv(csv_file)
                self.stdout.write(f"Loaded {len(companies_to_seed)} companies from CSV file")
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error loading CSV file: {str(e)}")
                )
                return
        else:
            companies_to_seed = COMPANIES

        # Get or create default industry
        if industry_id:
            try:
                default_industry = Industry.objects.get(id=industry_id)
            except Industry.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Industry with ID '{industry_id}' not found.")
                )
                return
        else:
            # Try to find "Professional Services" or create a default one
            default_industry = Industry.objects.filter(
                industry_name__iexact="Professional Services"
            ).first()
            
            if not default_industry:
                # Try "Information Technology (IT)" as fallback
                default_industry = Industry.objects.filter(
                    industry_name__iexact="Information Technology (IT)"
                ).first()
            
            if not default_industry:
                # Get the first available industry
                default_industry = Industry.objects.first()
                
            if not default_industry:
                self.stdout.write(
                    self.style.ERROR(
                        "No industries found. Please run 'python manage.py seed_industries' first."
                    )
                )
                return

        self.stdout.write(f"Using industry: {default_industry.industry_name}")

        # Count existing companies
        existing_count = Company.objects.count()
        self.stdout.write(f"Existing companies in database: {existing_count}")

        if reset:
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"Would delete {existing_count} existing companies"
                    )
                )
            else:
                deleted_count, _ = Company.objects.all().delete()
                self.stdout.write(
                    self.style.WARNING(f"Deleted {existing_count} existing companies")
                )
                existing_count = 0

        # Track statistics
        created_count = 0
        skipped_count = 0
        error_count = 0
        errors = []

        with transaction.atomic():
            for company_data in companies_to_seed:
                company_name = company_data["company_name"]
                
                try:
                    # Validate required fields
                    if not company_name:
                        error_count += 1
                        errors.append(f"{company_name or 'Unknown'}: Missing company_name")
                        continue
                    
                    email = company_data.get("email", "").strip()
                    if not email:
                        error_count += 1
                        errors.append(f"{company_name}: Missing email")
                        continue
                    
                    # Normalize phone number
                    phone_number = extract_phone_number(company_data.get("phone_number", ""))
                    if not phone_number:
                        error_count += 1
                        errors.append(f"{company_name}: Missing or invalid phone number")
                        continue
                    
                    # Normalize website
                    website = normalize_website(company_data.get("website", "")) or None
                    
                    # Prepare company data
                    company_dict = {
                        "company_name": company_name,
                        "contact_person": company_data.get("contact_person", "Unknown"),
                        "company_address": company_data.get("company_address", ""),
                        "phone_number": phone_number,
                        "email": email,
                        "website": website,
                        "industry": default_industry,
                    }
                    
                    if dry_run:
                        # Check if would be created
                        exists = Company.objects.filter(
                            company_name__iexact=company_name
                        ).exists()
                        if exists:
                            skipped_count += 1
                            self.stdout.write(
                                self.style.NOTICE(f"⊘ Would skip: {company_name} (already exists)")
                            )
                        else:
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(f"✓ Would create: {company_name}")
                            )
                    else:
                        # Check if company already exists
                        existing_company = Company.objects.filter(
                            company_name__iexact=company_name
                        ).first()
                        
                        if existing_company:
                            skipped_count += 1
                            self.stdout.write(
                                self.style.NOTICE(f"⊘ Skipped: {company_name} (already exists)")
                            )
                        else:
                            # Create company
                            Company.objects.create(**company_dict)
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(f"✓ Created: {company_name}")
                            )
                            
                except ValidationError as e:
                    error_count += 1
                    error_msg = f"Validation error for {company_name}: {str(e)}"
                    errors.append(error_msg)
                    self.stdout.write(
                        self.style.ERROR(f"✗ Error: {company_name} - {str(e)}")
                    )
                except Exception as e:
                    error_count += 1
                    error_msg = f"Error for {company_name}: {str(e)}"
                    errors.append(error_msg)
                    self.stdout.write(
                        self.style.ERROR(f"✗ Error: {company_name} - {str(e)}")
                    )

        # Summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        if dry_run:
            self.stdout.write(self.style.SUCCESS("DRY RUN SUMMARY"))
        else:
            self.stdout.write(self.style.SUCCESS("SEEDING SUMMARY"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Total companies in seed data: {len(companies_to_seed)}")
        if not dry_run:
            self.stdout.write(f"Created: {created_count}")
        else:
            self.stdout.write(f"Would create: {created_count}")
        self.stdout.write(f"Skipped (already exist): {skipped_count}")
        self.stdout.write(f"Errors: {error_count}")
        if not dry_run:
            self.stdout.write(f"Final count: {Company.objects.count()}")
        else:
            self.stdout.write(f"Current count: {Company.objects.count()}")

        if errors:
            self.stdout.write("")
            self.stdout.write(self.style.ERROR("Errors encountered:"))
            for error in errors:
                self.stdout.write(self.style.ERROR(f"  - {error}"))

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Run without --dry-run to actually create companies"
                )
            )

