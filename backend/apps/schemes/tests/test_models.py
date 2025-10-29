from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from decimal import Decimal
from datetime import date, timedelta

from apps.companies.models import Company, Industry
from apps.schemes.models import Scheme, Plan, Benefit, SchemeItem
from apps.schemes.services.scheme_service import SchemeService
from apps.schemes.selectors import scheme_list, scheme_get


class SchemesModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.industry = Industry.objects.create(
            industry_name="Technology",
            description="Technology companies"
        )
        self.company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="1234567890",
            industry=self.industry,
            company_address="123 Test St"
        )

    def test_scheme_create_and_soft_delete(self):
        """Test scheme creation and soft deletion."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00"),
            family_applicable=True
        )
        self.assertEqual(Scheme.objects.count(), 1)
        self.assertFalse(scheme.is_deleted)
        self.assertEqual(scheme.scheme_name, "Test Scheme")
        self.assertEqual(scheme.card_code, "TST")
        self.assertTrue(scheme.family_applicable)

        # Test soft delete
        SchemeService.scheme_deactivate(scheme_id=scheme.id, user=self.user)
        scheme.refresh_from_db()
        self.assertTrue(scheme.is_deleted)
        self.assertEqual(Scheme.objects.count(), 0)

    def test_scheme_validation(self):
        """Test scheme model validation."""
        # Test valid scheme creation
        scheme = Scheme.objects.create(
            scheme_name="Valid Scheme",
            company=self.company,
            card_code="VAL",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        self.assertEqual(scheme.scheme_name, "Valid Scheme")
        self.assertEqual(scheme.company, self.company)

    def test_scheme_clean_validation(self):
        """Test scheme clean method validation."""
        # Test start_date >= end_date validation
        scheme = Scheme(
            scheme_name="Invalid Scheme",
            company=self.company,
            card_code="INV",
            start_date=date(2024, 12, 31),  # After end_date
            end_date=date(2024, 1, 1),
            limit_amount=Decimal("1000000.00")
        )
        with self.assertRaises(ValidationError) as context:
            scheme.clean()
        self.assertIn("End date must be after start date", str(context.exception))

        # Test termination_date <= end_date validation
        scheme = Scheme(
            scheme_name="Invalid Scheme",
            company=self.company,
            card_code="INV",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            termination_date=date(2024, 6, 1),  # Before end_date
            limit_amount=Decimal("1000000.00")
        )
        with self.assertRaises(ValidationError) as context:
            scheme.clean()
        self.assertIn("Termination date must be after end date", str(context.exception))

    def test_scheme_str_representation(self):
        """Test scheme string representation."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        self.assertEqual(str(scheme), "Test Scheme")

    def test_scheme_service_create(self):
        """Test scheme creation via service layer."""
        scheme_data = {
            "scheme_name": "Service Scheme",
            "company": self.company.id,
            "card_code": "SVC",
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit_amount": "1000000.00",
            "family_applicable": True
        }
        
        scheme = SchemeService.scheme_create(scheme_data=scheme_data, user=self.user)
        self.assertEqual(scheme.scheme_name, "Service Scheme")
        self.assertEqual(scheme.company, self.company)
        self.assertEqual(scheme.card_code, "SVC")
        self.assertTrue(scheme.family_applicable)
        self.assertEqual(Scheme.objects.count(), 1)

    def test_scheme_service_update(self):
        """Test scheme update via service layer."""
        scheme = Scheme.objects.create(
            scheme_name="Original Scheme",
            company=self.company,
            card_code="ORG",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        update_data = {
            "scheme_name": "Updated Scheme",
            "company": self.company.id,
            "card_code": "UPD",
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit_amount": "2000000.00",
            "family_applicable": True
        }

        updated_scheme = SchemeService.scheme_update(
            scheme_id=scheme.id, update_data=update_data, user=self.user
        )
        self.assertEqual(updated_scheme.scheme_name, "Updated Scheme")
        self.assertEqual(updated_scheme.card_code, "UPD")
        self.assertTrue(updated_scheme.family_applicable)

    def test_scheme_service_duplicate_card_code(self):
        """Test scheme service duplicate card code validation."""
        Scheme.objects.create(
            scheme_name="Existing Scheme",
            company=self.company,
            card_code="DUP",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        # Try to create scheme with duplicate card code
        scheme_data = {
            "scheme_name": "New Scheme",
            "company": self.company.id,
            "card_code": "DUP",  # Duplicate card code
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit_amount": "2000000.00"
        }

        with self.assertRaises(ValidationError) as context:
            SchemeService.scheme_create(scheme_data=scheme_data, user=self.user)
        self.assertIn("already exists", str(context.exception))

    def test_scheme_service_invalid_dates(self):
        """Test scheme service date validation."""
        scheme_data = {
            "scheme_name": "Invalid Scheme",
            "company": self.company.id,
            "card_code": "INV",
            "start_date": "2024-12-31",  # After end date
            "end_date": "2024-01-01",
            "limit_amount": "1000000.00"
        }

        with self.assertRaises(ValidationError) as context:
            SchemeService.scheme_create(scheme_data=scheme_data, user=self.user)
        self.assertIn("End date must be after start date", str(context.exception))

    def test_scheme_service_invalid_company(self):
        """Test scheme service with invalid company ID."""
        scheme_data = {
            "scheme_name": "Test Scheme",
            "company": "invalid-company-id",
            "card_code": "TST",
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit_amount": "1000000.00"
        }

        with self.assertRaises(ValidationError) as context:
            SchemeService.scheme_create(scheme_data=scheme_data, user=self.user)
        self.assertIn("Invalid company", str(context.exception))

    def test_scheme_selectors(self):
        """Test scheme selector functions."""
        # Create test schemes
        scheme1 = Scheme.objects.create(
            scheme_name="Alpha Scheme",
            company=self.company,
            card_code="ALP",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        
        company2 = Company.objects.create(
            company_name="Another Company",
            contact_person="Jane Doe",
            email="jane@another.com",
            phone_number="0987654321",
            industry=self.industry,
            company_address="456 Another St"
        )
        scheme2 = Scheme.objects.create(
            scheme_name="Beta Scheme",
            company=company2,
            card_code="BET",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("2000000.00")
        )

        # Test scheme_list selector
        schemes = scheme_list()
        self.assertEqual(schemes.count(), 2)

        # Test scheme_list with filters
        schemes = scheme_list(filters={"status": "ACTIVE"})
        self.assertEqual(schemes.count(), 2)  # Both are active by default

        schemes = scheme_list(filters={"company": self.company.id})
        self.assertEqual(schemes.count(), 1)
        self.assertEqual(schemes.first().scheme_name, "Alpha Scheme")

        schemes = scheme_list(filters={"query": "Alpha"})
        self.assertEqual(schemes.count(), 1)
        self.assertEqual(schemes.first().scheme_name, "Alpha Scheme")

        # Test scheme_get selector
        scheme = scheme_get(scheme_id=scheme1.id)
        self.assertEqual(scheme.scheme_name, "Alpha Scheme")

        scheme = scheme_get(scheme_id="invalid-id")
        self.assertIsNone(scheme)

    def test_plan_model(self):
        """Test Plan model functionality."""
        # Clear any existing plans for test isolation
        Plan.all_objects.all().delete()
        plan = Plan.objects.create(
            plan_name="Test Plan",
            description="Test plan description"
        )
        self.assertEqual(Plan.objects.count(), 1)
        self.assertEqual(plan.plan_name, "Test Plan")
        self.assertEqual(str(plan), "Test Plan")

    def test_benefit_model(self):
        """Test Benefit model functionality."""
        benefit = Benefit.objects.create(
            benefit_name="Test Benefit",
            description="Test benefit description",
            in_or_out_patient="BOTH",
            limit_amount=Decimal("500000.00")
        )
        self.assertEqual(Benefit.objects.count(), 1)
        self.assertEqual(benefit.benefit_name, "Test Benefit")
        self.assertEqual(benefit.in_or_out_patient, "BOTH")
        self.assertEqual(str(benefit), "Test Benefit")

    def test_scheme_item_model(self):
        """Test SchemeItem model functionality."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        
        benefit = Benefit.objects.create(
            benefit_name="Test Benefit",
            description="Test benefit description",
            in_or_out_patient="BOTH",
            limit_amount=Decimal("500000.00")
        )

        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(Benefit)
        
        scheme_item = SchemeItem.objects.create(
            scheme=scheme,
            content_type=content_type,
            object_id=benefit.id,
            limit_amount=Decimal("250000.00"),
            copayment_percent=Decimal("10.00")
        )
        
        self.assertEqual(SchemeItem.objects.count(), 1)
        self.assertEqual(scheme_item.scheme, scheme)
        self.assertEqual(scheme_item.item, benefit)
        self.assertEqual(scheme_item.limit_amount, Decimal("250000.00"))

    def test_scheme_foreign_key_relationship(self):
        """Test scheme-company foreign key relationship."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        # Test relationship
        self.assertEqual(scheme.company, self.company)
        self.assertEqual(scheme.company.company_name, "Test Company")

        # Test reverse relationship
        self.assertIn(scheme, self.company.schemes.all())

    def test_scheme_manager_methods(self):
        """Test scheme manager custom methods."""
        scheme = Scheme.objects.create(
            scheme_name="Manager Test Scheme",
            company=self.company,
            card_code="MGR",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        # Test basic manager functionality
        self.assertEqual(Scheme.objects.count(), 1)
        self.assertEqual(Scheme.objects.filter(scheme_name="Manager Test Scheme").count(), 1)

    def test_scheme_soft_delete_with_dependencies(self):
        """Test scheme soft delete when it has dependencies."""
        scheme = Scheme.objects.create(
            scheme_name="Scheme with Dependencies",
            company=self.company,
            card_code="DEP",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        # Test soft delete
        SchemeService.scheme_deactivate(scheme_id=scheme.id, user=self.user)
        scheme.refresh_from_db()
        self.assertTrue(scheme.is_deleted)
        self.assertEqual(Scheme.objects.count(), 0)

    def test_scheme_card_code_validation(self):
        """Test scheme card code validation."""
        # Test valid card code
        scheme = Scheme.objects.create(
            scheme_name="Valid Scheme",
            company=self.company,
            card_code="ABC",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        self.assertEqual(scheme.card_code, "ABC")

        # Test uniqueness constraint
        with self.assertRaises(Exception):  # Django will raise an exception for duplicate
            Scheme.objects.create(
                scheme_name="Duplicate Scheme",
                company=self.company,
                card_code="ABC",  # Same as above
                start_date=date(2024, 1, 1),
                end_date=date(2024, 12, 31),
                limit_amount=Decimal("2000000.00")
            )

    def test_scheme_limit_amount_validation(self):
        """Test scheme limit amount validation."""
        # Test valid limit amount
        scheme = Scheme.objects.create(
            scheme_name="Valid Scheme",
            company=self.company,
            card_code="VAL",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        self.assertEqual(scheme.limit_amount, Decimal("1000000.00"))

        # Test minimum limit amount (0.01)
        scheme = Scheme.objects.create(
            scheme_name="Min Scheme",
            company=self.company,
            card_code="MIN",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("0.01")
        )
        self.assertEqual(scheme.limit_amount, Decimal("0.01"))
