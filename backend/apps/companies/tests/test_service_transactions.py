"""
Transaction rollback tests for service layer.

Verifies that @transaction.atomic properly rolls back database changes
when errors occur within service methods.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TransactionTestCase

from apps.core.enums.choices import BusinessStatusChoices
from apps.companies.models import Company, Industry
from apps.companies.services.company_service import CompanyService
from apps.core.exceptions.service_errors import (
    NotFoundError,
    DuplicateError,
    RequiredFieldError,
    InvalidValueError,
)
from apps.schemes.models import Scheme


class CompanyServiceTransactionTests(TransactionTestCase):
    """
    Tests for transaction rollback behavior in CompanyService.

    Uses TransactionTestCase instead of TestCase to properly test
    transaction rollback behavior.
    """

    def setUp(self):
        """Set up test data."""
        self.user = get_user_model().objects.create_user(
            username="tester",
            password="pass1234"
        )
        self.industry = Industry.objects.create(
            industry_name="Technology",
            description="Tech companies"
        )

    def test_company_create_rollback_on_validation_error(self):
        """
        Test that company_create rolls back when validation fails.

        Scenario:
        1. Start transaction
        2. Attempt to create company with invalid data
        3. Verify no company was created (rollback succeeded)
        """
        initial_count = Company.all_objects.count()

        # Missing required field should cause rollback
        with self.assertRaises(RequiredFieldError):
            CompanyService.company_create(
                company_data={
                    "company_name": "Test Company",
                    "contact_person": "John Doe",
                    # Missing email (required)
                    "phone_number": "+256701234567",
                    "industry": self.industry.id,
                    "company_address": "123 Test St"
                },
                user=self.user
            )

        # Verify no company was created
        self.assertEqual(Company.all_objects.count(), initial_count)

    def test_company_create_rollback_on_duplicate_error(self):
        """
        Test that company_create rolls back when duplicate is detected.

        Scenario:
        1. Create first company
        2. Attempt to create duplicate
        3. Verify only first company exists (rollback succeeded)
        """
        # Create first company
        _ = CompanyService.company_create(
            company_data={
                "company_name": "Unique Company",
                "contact_person": "John Doe",
                "email": "john@unique.com",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 Test St"
            },
            user=self.user
        )

        initial_count = Company.all_objects.count()

        # Attempt duplicate - should raise DuplicateError
        with self.assertRaises(DuplicateError) as context:
            CompanyService.company_create(
                company_data={
                    "company_name": "Unique Company",  # Duplicate name
                    "contact_person": "Jane Doe",
                    "email": "jane@different.com",
                    "phone_number": "+256709876543",
                    "industry": self.industry.id,
                    "company_address": "456 Other St"
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'duplicate_entity')
        self.assertIn('company_name', str(error).lower())

        # Verify no additional company was created (rollback succeeded)
        self.assertEqual(Company.all_objects.count(), initial_count)

    def test_company_update_rollback_on_validation_error(self):
        """
        Test that company_update rolls back when validation fails.

        Scenario:
        1. Create company
        2. Attempt to update with invalid data
        3. Verify original data unchanged (rollback succeeded)
        """
        # Create company
        company = CompanyService.company_create(
            company_data={
                "company_name": "Original Company",
                "contact_person": "John Doe",
                "email": "john@original.com",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 Original St"
            },
            user=self.user
        )

        original_name = company.company_name
        original_email = company.email

        # Attempt update with empty required field
        with self.assertRaises(InvalidValueError):
            CompanyService.company_update(
                company_id=company.id,
                update_data={
                    "company_name": "",  # Empty required field
                    "email": "new@email.com"
                },
                user=self.user
            )

        # Verify company data unchanged (rollback succeeded)
        company.refresh_from_db()
        self.assertEqual(company.company_name, original_name)
        self.assertEqual(company.email, original_email)

    def test_company_update_rollback_on_duplicate_error(self):
        """
        Test that company_update rolls back when duplicate is detected.

        Scenario:
        1. Create two companies
        2. Attempt to update company2 with company1's unique field
        3. Verify company2 data unchanged (rollback succeeded)
        """
        # Create first company
        _ = CompanyService.company_create(
            company_data={
                "company_name": "Company One",
                "contact_person": "John Doe",
                "email": "john@companyone.com",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 One St"
            },
            user=self.user
        )

        # Create second company
        company2 = CompanyService.company_create(
            company_data={
                "company_name": "Company Two",
                "contact_person": "Jane Doe",
                "email": "jane@companytwo.com",
                "phone_number": "+256709876543",
                "industry": self.industry.id,
                "company_address": "456 Two St"
            },
            user=self.user
        )

        original_name = company2.company_name

        # Attempt to update company2 with company1's name
        with self.assertRaises(DuplicateError):
            CompanyService.company_update(
                company_id=company2.id,
                update_data={
                    "company_name": "Company One"  # Duplicate of company1
                },
                user=self.user
            )

        # Verify company2 data unchanged (rollback succeeded)
        company2.refresh_from_db()
        self.assertEqual(company2.company_name, original_name)

    def test_company_create_rollback_on_not_found_error(self):
        """
        Test that company_create rolls back when related entity not found.

        Scenario:
        1. Attempt to create company with invalid industry ID
        2. Verify no company was created (rollback succeeded)
        """
        initial_count = Company.all_objects.count()

        # Invalid industry ID should cause rollback
        with self.assertRaises(NotFoundError) as context:
            CompanyService.company_create(
                company_data={
                    "company_name": "Test Company",
                    "contact_person": "John Doe",
                    "email": "john@test.com",
                    "phone_number": "+256701234567",
                    "industry": "invalid-industry-id",
                    "company_address": "123 Test St"
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'not_found')
        self.assertIn('Industry', str(error))

        # Verify no company was created (rollback succeeded)
        self.assertEqual(Company.all_objects.count(), initial_count)

    def test_company_soft_delete_rollback_on_dependency_error(self):
        """
        Test that company_soft_delete rolls back when dependencies exist.

        Scenario:
        1. Create company with dependent scheme
        2. Attempt to delete company
        3. Verify company not deleted (rollback succeeded)
        """
        # Create company
        company = CompanyService.company_create(
            company_data={
                "company_name": "Company With Schemes",
                "contact_person": "John Doe",
                "email": "john@company.com",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 Company St"
            },
            user=self.user
        )

        # Create dependent scheme
        Scheme.objects.create(
            scheme_name="Test Scheme",
            company=company,
            card_code="TST",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            limit_amount=100000
        )

        # Attempt to delete company (should fail due to dependent scheme)
        with self.assertRaises(ValidationError):
            CompanyService.company_soft_delete(
                company_id=company.id,
                user=self.user
            )

        # Verify company not deleted (rollback succeeded)
        company.refresh_from_db()
        self.assertFalse(company.is_deleted)
        self.assertEqual(company.status, BusinessStatusChoices.ACTIVE)

    def test_duplicate_constraint_enforcement(self):
        """
        Test that database uniqueness constraints are enforced sequentially.

        This test verifies that when creating a company with the same unique
        field (company_name) as an existing company, the second create fails
        with a DuplicateError and exactly one company with that name exists.
        """
        company_data = {
            "company_name": "Concurrent Company",
            "contact_person": "John Doe",
            "email": "john@concurrent.com",
            "phone_number": "+256701234567",
            "industry": self.industry.id,
            "company_address": "123 Concurrent St"
        }

        # First create should succeed
        company1 = CompanyService.company_create(
            company_data=company_data,
            user=self.user
        )
        self.assertIsNotNone(company1.id)

        # Second create with same name should fail with DuplicateError
        with self.assertRaises(DuplicateError):
            CompanyService.company_create(
                company_data=company_data,
                user=self.user
            )

        # Verify exactly one company exists
        self.assertEqual(
            Company.objects.filter(company_name="Concurrent Company").count(),
            1
        )
