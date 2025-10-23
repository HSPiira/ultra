from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from decimal import Decimal
from datetime import date, timedelta

from apps.companies.models import Company, Industry
from apps.schemes.models import Scheme, Plan, Benefit, SchemeItem
from apps.schemes.services.scheme_service import SchemeService


class SchemesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.client.force_login(self.user)
        
        # Create test industry and company
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

    def test_scheme_crud(self):
        """Test complete CRUD operations for schemes."""
        # Create
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": self.company.id,
                "description": "Test scheme description",
                "card_code": "TST",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "1000000.00",
                "family_applicable": True,
                "remark": "Test remark"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        scheme_id = res.data["id"]
        self.assertEqual(res.data["scheme_name"], "Test Scheme")
        self.assertEqual(res.data["card_code"], "TST")
        self.assertEqual(res.data["company"], self.company.id)
        self.assertTrue(res.data["family_applicable"])

        # List
        res = self.client.get(reverse("scheme-list"))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Retrieve
        res = self.client.get(reverse("scheme-detail", args=[scheme_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["scheme_name"], "Test Scheme")
        self.assertIn("company_detail", res.data)
        self.assertEqual(res.data["company_detail"]["company_name"], "Test Company")

        # Update
        res = self.client.put(
            reverse("scheme-detail", args=[scheme_id]),
            {
                "scheme_name": "Updated Scheme",
                "company": self.company.id,
                "description": "Updated description",
                "card_code": "UPD",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "2000000.00",
                "family_applicable": False,
                "remark": "Updated remark"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["scheme_name"], "Updated Scheme")
        self.assertEqual(res.data["card_code"], "UPD")
        self.assertFalse(res.data["family_applicable"])

        # Delete (soft)
        res = self.client.delete(reverse("scheme-detail", args=[scheme_id]))
        self.assertEqual(res.status_code, 204)
        
        # Verify soft delete
        res = self.client.get(reverse("scheme-detail", args=[scheme_id]))
        self.assertEqual(res.status_code, 404)

    def test_scheme_validation(self):
        """Test scheme validation rules."""
        # Missing required fields
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                # Missing company, card_code, start_date, end_date, limit_amount
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Invalid card code length
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": self.company.id,
                "card_code": "TS",  # Too short
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "1000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Invalid date range
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": self.company.id,
                "card_code": "TST",
                "start_date": "2024-12-31",  # After end date
                "end_date": "2024-01-01",
                "limit_amount": "1000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Invalid termination date
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": self.company.id,
                "card_code": "TST",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "termination_date": "2024-06-01",  # Before end date
                "limit_amount": "1000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Negative limit amount
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": self.company.id,
                "card_code": "TST",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "-1000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_scheme_filtering(self):
        """Test scheme filtering and search."""
        # Create test schemes
        scheme1 = Scheme.objects.create(
            scheme_name="Health Insurance",
            company=self.company,
            card_code="HTH",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00"),
            family_applicable=True
        )
        
        # Create another company and scheme
        company2 = Company.objects.create(
            company_name="Another Company",
            contact_person="Jane Doe",
            email="jane@another.com",
            phone_number="0987654321",
            industry=self.industry,
            company_address="456 Another St"
        )
        scheme2 = Scheme.objects.create(
            scheme_name="Life Insurance",
            company=company2,
            card_code="LIF",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("2000000.00"),
            family_applicable=False
        )

        # Search by scheme name
        res = self.client.get(reverse("scheme-list"), {"search": "Health"})
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data.get("results", res.data)), 1)
        data = res.data.get("results", res.data)
        health_found = any(s.get("scheme_name") == "Health Insurance" for s in data)
        self.assertTrue(health_found)

        # Filter by company
        res = self.client.get(reverse("scheme-list"), {"company": self.company.id})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        self.assertGreaterEqual(len(data), 1)
        company_schemes = [s for s in data if s.get("company") == self.company.id]
        self.assertGreaterEqual(len(company_schemes), 1)

        # Search by description
        scheme1.description = "Health coverage for employees"
        scheme1.save()
        res = self.client.get(reverse("scheme-list"), {"search": "coverage"})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        self.assertGreaterEqual(len(data), 1)

    def test_scheme_ordering(self):
        """Test scheme ordering."""
        # Create test schemes with different names
        scheme1 = Scheme.objects.create(
            scheme_name="Zebra Scheme",
            company=self.company,
            card_code="ZEB",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        scheme2 = Scheme.objects.create(
            scheme_name="Alpha Scheme",
            company=self.company,
            card_code="ALP",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("2000000.00")
        )

        # Order by name ascending
        res = self.client.get(reverse("scheme-list"), {"ordering": "scheme_name"})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        self.assertGreaterEqual(len(data), 2)
        scheme_names = [s.get("scheme_name") for s in data]
        self.assertIn("Alpha Scheme", scheme_names)
        self.assertIn("Zebra Scheme", scheme_names)
        
        # Check ordering - Alpha should come before Zebra
        alpha_index = scheme_names.index("Alpha Scheme")
        zebra_index = scheme_names.index("Zebra Scheme")
        self.assertLess(alpha_index, zebra_index)

        # Order by name descending
        res = self.client.get(reverse("scheme-list"), {"ordering": "-scheme_name"})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        self.assertGreaterEqual(len(data), 2)
        scheme_names = [s.get("scheme_name") for s in data]
        self.assertIn("Alpha Scheme", scheme_names)
        self.assertIn("Zebra Scheme", scheme_names)
        
        # Check ordering - Zebra should come before Alpha
        alpha_index = scheme_names.index("Alpha Scheme")
        zebra_index = scheme_names.index("Zebra Scheme")
        self.assertGreater(alpha_index, zebra_index)

    def test_scheme_with_invalid_company(self):
        """Test scheme creation with invalid company ID."""
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "Test Scheme",
                "company": "invalid-company-id",
                "card_code": "TST",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "1000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_scheme_update_with_invalid_company(self):
        """Test scheme update with invalid company ID."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        res = self.client.put(
            reverse("scheme-detail", args=[scheme.id]),
            {
                "scheme_name": "Updated Scheme",
                "company": "invalid-company-id",
                "card_code": "UPD",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "2000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_scheme_duplicate_card_code(self):
        """Test scheme creation with duplicate card code."""
        Scheme.objects.create(
            scheme_name="Existing Scheme",
            company=self.company,
            card_code="DUP",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        
        res = self.client.post(
            reverse("scheme-list"),
            {
                "scheme_name": "New Scheme",
                "company": self.company.id,
                "card_code": "DUP",  # Duplicate card code
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit_amount": "2000000.00"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_scheme_company_detail_serialization(self):
        """Test that company_detail is properly serialized."""
        scheme = Scheme.objects.create(
            scheme_name="Test Scheme",
            company=self.company,
            card_code="TST",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )

        res = self.client.get(reverse("scheme-detail", args=[scheme.id]))
        self.assertEqual(res.status_code, 200)
        self.assertIn("company_detail", res.data)
        company_detail = res.data["company_detail"]
        self.assertEqual(company_detail["id"], self.company.id)
        self.assertEqual(company_detail["company_name"], "Test Company")
        self.assertEqual(company_detail["contact_person"], "John Doe")
        self.assertEqual(company_detail["email"], "john@testcompany.com")

    def test_scheme_pagination(self):
        """Test scheme list pagination."""
        # Create multiple schemes
        for i in range(25):
            Scheme.objects.create(
                scheme_name=f"Scheme {i}",
                company=self.company,
                card_code=f"S{i:02d}",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 12, 31),
                limit_amount=Decimal("1000000.00")
            )

        res = self.client.get(reverse("scheme-list"))
        self.assertEqual(res.status_code, 200)
        # Should have pagination
        self.assertIn("results", res.data)
        self.assertIn("count", res.data)
        self.assertIn("next", res.data)
        self.assertIn("previous", res.data)

    def test_scheme_status_filtering(self):
        """Test scheme filtering by status."""
        # Create schemes with different statuses
        scheme1 = Scheme.objects.create(
            scheme_name="Active Scheme",
            company=self.company,
            card_code="ACT",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("1000000.00")
        )
        
        scheme2 = Scheme.objects.create(
            scheme_name="Inactive Scheme",
            company=self.company,
            card_code="INA",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            limit_amount=Decimal("2000000.00")
        )
        
        # Deactivate one scheme
        SchemeService.scheme_deactivate(scheme_id=scheme2.id, user=self.user)

        # Filter by active status
        res = self.client.get(reverse("scheme-list"), {"status": "ACTIVE"})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        active_schemes = [s for s in data if s.get("status") == "ACTIVE"]
        self.assertGreaterEqual(len(active_schemes), 1)

        # Filter by inactive status
        res = self.client.get(reverse("scheme-list"), {"status": "INACTIVE"})
        self.assertEqual(res.status_code, 200)
        data = res.data.get("results", res.data)
        inactive_schemes = [s for s in data if s.get("status") == "INACTIVE"]
        self.assertGreaterEqual(len(inactive_schemes), 1)
