"""
Test pagination edge cases across all API endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from apps.companies.models import Company, Industry
from apps.schemes.models import Plan, Scheme

User = get_user_model()


class PaginationEdgeCasesTest(TransactionTestCase):
    """Test pagination edge cases for all API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", password="testpass123", email="test@example.com"
        )
        self.client.force_login(self.user)

        # Clean up any existing test data to ensure isolation
        Company.objects.all().delete()
        Industry.objects.all().delete()
        Plan.objects.all().delete()

        # Create test industry
        self.industry = Industry.objects.create(
            industry_name="Technology", description="Tech companies"
        )

    def test_empty_result_set(self):
        """Test pagination with no results."""
        # Companies is empty initially
        response = self.client.get("/api/v1/companies/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["results"]), 0)
        self.assertIsNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

    def test_single_page_results(self):
        """Test pagination with results that fit in one page."""
        # Create 5 companies (less than page size of 20)
        for i in range(5):
            Company.objects.create(
                company_name=f"Company {i}",
                company_address=f"Address {i}",
                industry=self.industry,
                email=f"company{i}@example.com",
                phone_number="+1234567890",
                contact_person="Test Person",
            )

        response = self.client.get("/api/v1/companies/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 5)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertIsNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

    def test_multiple_pages(self):
        """Test pagination with multiple pages."""
        # Create 25 companies (more than page size of 20)
        for i in range(25):
            Company.objects.create(
                company_name=f"Company {i}",
                company_address=f"Address {i}",
                industry=self.industry,
                email=f"company{i}@example.com",
                phone_number="+1234567890",
                contact_person="Test Person",
            )

        # First page
        response = self.client.get("/api/v1/companies/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

        # Second page
        response = self.client.get("/api/v1/companies/?page=2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertIsNone(response.data["next"])
        self.assertIsNotNone(response.data["previous"])

    def test_invalid_page_number_zero(self):
        """Test pagination with invalid page number (0)."""
        Company.objects.create(
            company_name="Test Company",
            company_address="Test Address",
            industry=self.industry,
            email="test@example.com",
            phone_number="+1234567890",
            contact_person="Test Person",
        )

        response = self.client.get("/api/v1/companies/?page=0")

        # Should return 404 for invalid page
        self.assertEqual(response.status_code, 404)

    def test_invalid_page_number_negative(self):
        """Test pagination with negative page number."""
        Company.objects.create(
            company_name="Test Company",
            company_address="Test Address",
            industry=self.industry,
            email="test@example.com",
            phone_number="+1234567890",
            contact_person="Test Person",
        )

        response = self.client.get("/api/v1/companies/?page=-1")

        # Should return 404 for invalid page
        self.assertEqual(response.status_code, 404)

    def test_invalid_page_number_too_high(self):
        """Test pagination with page number exceeding total pages."""
        Company.objects.create(
            company_name="Test Company",
            company_address="Test Address",
            industry=self.industry,
            email="test@example.com",
            phone_number="+1234567890",
            contact_person="Test Person",
        )

        response = self.client.get("/api/v1/companies/?page=999")

        # Should return 404 for page out of range
        self.assertEqual(response.status_code, 404)

    def test_invalid_page_number_non_numeric(self):
        """Test pagination with non-numeric page number."""
        Company.objects.create(
            company_name="Test Company",
            company_address="Test Address",
            industry=self.industry,
            email="test@example.com",
            phone_number="+1234567890",
            contact_person="Test Person",
        )

        response = self.client.get("/api/v1/companies/?page=abc")

        # Should return 404 for invalid page format
        self.assertEqual(response.status_code, 404)

    def test_pagination_consistency_across_endpoints(self):
        """Test that pagination works consistently across different endpoints."""
        # Create test data for companies
        for i in range(3):
            Company.objects.create(
                company_name=f"Company {i}",
                company_address=f"Address {i}",
                industry=self.industry,
                email=f"company{i}@example.com",
                phone_number="+1234567890",
                contact_person="Test Person",
            )

        # Create test data for plans
        for i in range(3):
            Plan.objects.create(
                plan_name=f"Test Plan {i}", description=f"Description {i}"
            )

        # Test companies pagination
        response = self.client.get("/api/v1/companies/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 3)

        # Test plans pagination (same structure)
        response = self.client.get("/api/v1/plans/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)
        # Count should be at least 3 (may have more from previous tests)
        self.assertGreaterEqual(response.data["count"], 3)

    def test_exact_page_size_boundary(self):
        """Test pagination at exact page size boundary (20 items)."""
        # Create exactly 20 companies
        for i in range(20):
            Company.objects.create(
                company_name=f"Company {i}",
                company_address=f"Address {i}",
                industry=self.industry,
                email=f"company{i}@example.com",
                phone_number="+1234567890",
                contact_person="Test Person",
            )

        response = self.client.get("/api/v1/companies/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 20)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

    def test_one_over_page_size_boundary(self):
        """Test pagination with 21 items (1 over page size)."""
        # Create 21 companies
        for i in range(21):
            Company.objects.create(
                company_name=f"Company {i}",
                company_address=f"Address {i}",
                industry=self.industry,
                email=f"company{i}@example.com",
                phone_number="+1234567890",
                contact_person="Test Person",
            )

        # First page should have 20 items
        response = self.client.get("/api/v1/companies/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])

        # Second page should have 1 item
        response = self.client.get("/api/v1/companies/?page=2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNone(response.data["next"])
        self.assertIsNotNone(response.data["previous"])
