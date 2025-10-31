"""
Transaction rollback tests for scheme service layer.

Verifies that @transaction.atomic properly rolls back database changes
when errors occur within scheme service methods.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase

from apps.companies.models import Company, Industry
from apps.schemes.models import Scheme
from apps.schemes.services.scheme_service import SchemeService
from apps.core.exceptions.service_errors import (
    NotFoundError,
    DuplicateError,
    RequiredFieldError,
    InactiveEntityError,
)


class SchemeServiceTransactionTests(TransactionTestCase):
    """
    Tests for transaction rollback behavior in SchemeService.

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
        self.company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )

    def test_scheme_create_rollback_on_validation_error(self):
        """
        Test that scheme_create rolls back when validation fails.

        Scenario:
        1. Start transaction
        2. Attempt to create scheme with invalid data
        3. Verify no scheme was created (rollback succeeded)
        """
        initial_count = Scheme.all_objects.count()

        # Missing required field should cause rollback
        with self.assertRaises(RequiredFieldError):
            SchemeService.scheme_create(
                scheme_data={
                    "scheme_name": "Test Scheme",
                    "company": self.company.id,
                    # Missing card_code (required)
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=365),
                    "limit_amount": 100000
                },
                user=self.user
            )

        # Verify no scheme was created
        self.assertEqual(Scheme.all_objects.count(), initial_count)

    def test_scheme_create_rollback_on_duplicate_error(self):
        """
        Test that scheme_create rolls back when duplicate is detected.

        Scenario:
        1. Create first scheme
        2. Attempt to create duplicate
        3. Verify only first scheme exists (rollback succeeded)
        """
        # Create first scheme
        scheme1 = SchemeService.scheme_create(
            scheme_data={
                "scheme_name": "Unique Scheme",
                "company": self.company.id,
                "card_code": "UNQ",
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=365),
                "limit_amount": 100000
            },
            user=self.user
        )

        initial_count = Scheme.all_objects.count()

        # Attempt duplicate card code - should raise DuplicateError
        with self.assertRaises(DuplicateError) as context:
            SchemeService.scheme_create(
                scheme_data={
                    "scheme_name": "Different Scheme",
                    "company": self.company.id,
                    "card_code": "UNQ",  # Duplicate card code
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=365),
                    "limit_amount": 200000
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'duplicate_entity')
        self.assertIn('card_code', str(error).lower())

        # Verify no additional scheme was created (rollback succeeded)
        self.assertEqual(Scheme.all_objects.count(), initial_count)

    def test_scheme_create_rollback_on_not_found_error(self):
        """
        Test that scheme_create rolls back when company not found.

        Scenario:
        1. Attempt to create scheme with invalid company ID
        2. Verify no scheme was created (rollback succeeded)
        """
        initial_count = Scheme.all_objects.count()

        # Invalid company ID should cause rollback
        with self.assertRaises(NotFoundError) as context:
            SchemeService.scheme_create(
                scheme_data={
                    "scheme_name": "Test Scheme",
                    "company": "invalid-company-id",
                    "card_code": "TST",
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=365),
                    "limit_amount": 100000
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'not_found')
        self.assertIn('Company', str(error))

        # Verify no scheme was created (rollback succeeded)
        self.assertEqual(Scheme.all_objects.count(), initial_count)

    def test_scheme_create_rollback_on_inactive_company(self):
        """
        Test that scheme_create rolls back when company is inactive.

        Scenario:
        1. Create inactive company
        2. Attempt to create scheme for inactive company
        3. Verify no scheme was created (rollback succeeded)
        """
        # Create inactive company
        inactive_company = Company.objects.create(
            company_name="Inactive Company",
            contact_person="Jane Doe",
            email="jane@inactive.com",
            phone_number="+256709876543",
            industry=self.industry,
            company_address="456 Inactive St",
            status="INACTIVE"
        )

        initial_count = Scheme.all_objects.count()

        # Inactive company should cause rollback
        with self.assertRaises(InactiveEntityError) as context:
            SchemeService.scheme_create(
                scheme_data={
                    "scheme_name": "Test Scheme",
                    "company": inactive_company.id,
                    "card_code": "TST",
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=365),
                    "limit_amount": 100000
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'inactive_entity')
        self.assertIn('Company', str(error))

        # Verify no scheme was created (rollback succeeded)
        self.assertEqual(Scheme.all_objects.count(), initial_count)

    def test_scheme_update_rollback_on_duplicate_error(self):
        """
        Test that scheme_update rolls back when duplicate is detected.

        Scenario:
        1. Create two schemes
        2. Attempt to update scheme2 with scheme1's card code
        3. Verify scheme2 data unchanged (rollback succeeded)
        """
        # Create first scheme
        scheme1 = SchemeService.scheme_create(
            scheme_data={
                "scheme_name": "Scheme One",
                "company": self.company.id,
                "card_code": "ONE",
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=365),
                "limit_amount": 100000
            },
            user=self.user
        )

        # Create second scheme
        scheme2 = SchemeService.scheme_create(
            scheme_data={
                "scheme_name": "Scheme Two",
                "company": self.company.id,
                "card_code": "TWO",
                "start_date": date.today(),
                "end_date": date.today() + timedelta(days=365),
                "limit_amount": 200000
            },
            user=self.user
        )

        original_card_code = scheme2.card_code

        # Attempt to update scheme2 with scheme1's card code
        with self.assertRaises(DuplicateError):
            SchemeService.scheme_update(
                scheme_id=scheme2.id,
                update_data={
                    "card_code": "ONE"  # Duplicate of scheme1
                },
                user=self.user
            )

        # Verify scheme2 data unchanged (rollback succeeded)
        scheme2.refresh_from_db()
        self.assertEqual(scheme2.card_code, original_card_code)

    def test_scheme_update_rollback_on_not_found_error(self):
        """
        Test that scheme_update rolls back when scheme not found.

        Scenario:
        1. Attempt to update non-existent scheme
        2. Verify error raised and no database changes
        """
        with self.assertRaises(NotFoundError) as context:
            SchemeService.scheme_update(
                scheme_id="non-existent-id",
                update_data={
                    "scheme_name": "Updated Name"
                },
                user=self.user
            )

        # Verify error details
        error = context.exception
        self.assertEqual(error.code, 'not_found')
        self.assertIn('Scheme', str(error))

    def test_concurrent_create_with_same_card_code(self):
        """
        Test that database constraints prevent race condition.

        This test verifies that two concurrent creates with the same
        card code will result in exactly one success and one failure,
        with no race condition.
        """
        scheme_data = {
            "scheme_name": "Concurrent Scheme",
            "company": self.company.id,
            "card_code": "CNC",
            "start_date": date.today(),
            "end_date": date.today() + timedelta(days=365),
            "limit_amount": 100000
        }

        # First create should succeed
        scheme1 = SchemeService.scheme_create(
            scheme_data=scheme_data,
            user=self.user
        )
        self.assertIsNotNone(scheme1.id)

        # Second create with same card code should fail with DuplicateError
        # (not a race condition - atomically detected by database)
        with self.assertRaises(DuplicateError):
            SchemeService.scheme_create(
                scheme_data=scheme_data,
                user=self.user
            )

        # Verify exactly one scheme exists with this card code
        self.assertEqual(
            Scheme.objects.filter(card_code="CNC").count(),
            1
        )
