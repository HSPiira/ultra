from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.companies.models import Company, Industry
from apps.companies.services.company_service import CompanyService
from apps.companies.selectors import company_list, company_get, company_statistics_get


class CompaniesModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.industry = Industry.objects.create(
            industry_name="Technology",
            description="Technology companies"
        )

    def test_company_create_and_soft_delete(self):
        """Test company creation and soft deletion."""
        company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )
        self.assertEqual(Company.objects.count(), 1)
        self.assertFalse(company.is_deleted)

        # Test soft delete
        CompanyService.company_soft_delete(company_id=company.id, user=self.user)
        company.refresh_from_db()
        self.assertTrue(company.is_deleted)
        self.assertEqual(Company.objects.count(), 0)

    def test_industry_create_and_soft_delete(self):
        """Test industry creation and soft deletion."""
        industry = Industry.objects.create(
            industry_name="Healthcare",
            description="Healthcare companies"
        )
        # Count all industries including ones from setUp
        total_count = Industry.all_objects.count()
        self.assertGreaterEqual(total_count, 1)

        # Test soft delete via service
        from apps.companies.services.industry_service import IndustryService
        IndustryService.industry_deactivate(industry_id=industry.id, user=self.user)
        industry.refresh_from_db()
        self.assertTrue(industry.is_deleted)
        # After soft delete, active count should exclude the soft-deleted one
        self.assertEqual(Industry.objects.count(), 1)  # Still the one from setUp

    def test_company_validation_required_fields(self):
        """Test company model validation for required fields."""
        # Test required fields - this will fail validation before hitting database
        # With full_clean() in save(), ValidationError is raised before IntegrityError
        with self.assertRaises(ValidationError):
            Company.objects.create(
                company_name="Test Company",
                contact_person="John Doe",
                email="john@test.com",
                phone_number="+256701234567",
                # Missing industry and company_address which are required
            )

    def test_company_validation_valid_creation(self):
        """Test company model validation with valid data."""
        # Test valid company creation
        company = Company.objects.create(
            company_name="Valid Company",
            contact_person="John Doe",
            email="john@valid.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Valid St"
        )
        self.assertEqual(company.company_name, "Valid Company")
        self.assertEqual(company.contact_person, "John Doe")

    def test_company_str_representation(self):
        """Test company string representation."""
        company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )
        self.assertEqual(str(company), "Test Company")

    def test_industry_str_representation(self):
        """Test industry string representation."""
        industry = Industry.objects.create(
            industry_name="Healthcare",
            description="Healthcare companies"
        )
        self.assertEqual(str(industry), "Healthcare")

    def test_company_service_create(self):
        """Test company creation via service layer."""
        company_data = {
            "company_name": "Service Company",
            "contact_person": "Jane Doe",
            "email": "jane@service.com",
            "phone_number": "+256709876543",
            "industry": self.industry.id,  # Pass ID as string
            "company_address": "456 Service St"
        }
        
        company = CompanyService.company_create(company_data=company_data, user=self.user)
        self.assertEqual(company.company_name, "Service Company")
        self.assertEqual(company.industry, self.industry)
        self.assertEqual(Company.objects.count(), 1)

    def test_company_service_update(self):
        """Test company update via service layer."""
        company = Company.objects.create(
            company_name="Original Company",
            contact_person="John Doe",
            email="john@original.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Original St"
        )

        update_data = {
            "company_name": "Updated Company",
            "contact_person": "Jane Doe",
            "email": "jane@updated.com",
            "phone_number": "+256709876543",
            "industry": self.industry.id,
            "company_address": "456 Updated St"
        }

        updated_company = CompanyService.company_update(
            company_id=company.id, update_data=update_data, user=self.user
        )
        self.assertEqual(updated_company.company_name, "Updated Company")
        self.assertEqual(updated_company.contact_person, "Jane Doe")

    def test_company_service_duplicate_validation(self):
        """Test company service duplicate validation."""
        Company.objects.create(
            company_name="Existing Company",
            contact_person="John Doe",
            email="john@existing.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Existing St"
        )

        # Try to create duplicate company name
        company_data = {
            "company_name": "Existing Company",
            "contact_person": "Jane Doe",
            "email": "jane@different.com",
            "phone_number": "+256709876543",
            "industry": self.industry.id,
            "company_address": "456 Different St"
        }

        with self.assertRaises(ValidationError) as context:
            CompanyService.company_create(company_data=company_data, user=self.user)
        self.assertIn("already exists", str(context.exception))

    def test_company_service_invalid_email(self):
        """Test company service email validation."""
        company_data = {
            "company_name": "Test Company",
            "contact_person": "John Doe",
            "email": "invalid-email",  # Invalid email format
            "phone_number": "1234567890",
            "industry": self.industry.id,
            "company_address": "123 Test St"
        }

        with self.assertRaises(ValidationError) as context:
            CompanyService.company_create(company_data=company_data, user=self.user)
        self.assertIn("Invalid email format", str(context.exception))

    def test_company_service_invalid_phone(self):
        """Test company service phone validation."""
        company_data = {
            "company_name": "Test Company",
            "contact_person": "John Doe",
            "email": "john@testcompany.com",
            "phone_number": "123",  # Too short
            "industry": self.industry.id,
            "company_address": "123 Test St"
        }

        with self.assertRaises(ValidationError) as context:
            CompanyService.company_create(company_data=company_data, user=self.user)
        # Phone validation error from model clean() method
        self.assertIn("Phone number", str(context.exception))

    def test_company_selectors(self):
        """Test company selector functions."""
        # Create test companies
        company1 = Company.objects.create(
            company_name="Alpha Corp",
            contact_person="John Doe",
            email="john@alpha.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Alpha St"
        )
        
        industry2 = Industry.objects.create(
            industry_name="Finance",
            description="Finance companies"
        )
        company2 = Company.objects.create(
            company_name="Beta Corp",
            contact_person="Jane Doe",
            email="jane@beta.com",
            phone_number="+256709876543",
            industry=industry2,
            company_address="456 Beta St"
        )

        # Test company_list selector
        companies = company_list()
        self.assertEqual(companies.count(), 2)

        # Test company_list with filters
        companies = company_list(filters={"status": "ACTIVE"})
        self.assertEqual(companies.count(), 2)  # Both are active by default

        companies = company_list(filters={"industry": self.industry.id})
        self.assertEqual(companies.count(), 1)
        self.assertEqual(companies.first().company_name, "Alpha Corp")

        companies = company_list(filters={"query": "Alpha"})
        self.assertEqual(companies.count(), 1)
        self.assertEqual(companies.first().company_name, "Alpha Corp")

        # Test company_get selector
        company = company_get(company_id=company1.id)
        self.assertEqual(company.company_name, "Alpha Corp")

        company = company_get(company_id="invalid-id")
        self.assertIsNone(company)

        # Test company_statistics_get selector
        stats = company_statistics_get()
        self.assertIn("total_companies", stats)
        self.assertIn("active_companies", stats)
        self.assertIn("inactive_companies", stats)
        self.assertEqual(stats["total_companies"], 2)

    def test_company_soft_delete_with_dependencies(self):
        """Test company soft delete when it has dependencies."""
        company = Company.objects.create(
            company_name="Company with Dependencies",
            contact_person="John Doe",
            email="john@deps.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Deps St"
        )

        # Test soft delete
        CompanyService.company_soft_delete(company_id=company.id, user=self.user)
        company.refresh_from_db()
        self.assertTrue(company.is_deleted)
        self.assertEqual(Company.objects.count(), 0)

    def test_company_foreign_key_relationship(self):
        """Test company-industry foreign key relationship."""
        company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )

        # Test relationship
        self.assertEqual(company.industry, self.industry)
        self.assertEqual(company.industry.industry_name, "Technology")

        # Test reverse relationship (Industry has related_name='companies' for Company)
        self.assertIn(company, self.industry.companies.all())

    def test_company_manager_methods(self):
        """Test company manager custom methods."""
        company = Company.objects.create(
            company_name="Manager Test Company",
            contact_person="John Doe",
            email="john@manager.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Manager St"
        )

        # Test get_by_name
        found_company = Company.objects.get_by_name("Manager Test Company")
        self.assertEqual(found_company, company)

        # Test has_members (should be False initially)
        self.assertFalse(Company.objects.has_members(company.id))

        # Test has_schemes (should be False initially)
        self.assertFalse(Company.objects.has_schemes(company.id))
