from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.companies.models import Company, Industry
from apps.companies.services.company_service import CompanyService


class CompaniesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.client.force_login(self.user)
        
        # Create test industry
        self.industry = Industry.objects.create(
            industry_name="Technology",
            description="Technology companies"
        )

    def test_company_crud(self):
        """Test complete CRUD operations for companies."""
        # Create
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Test Company",
                "contact_person": "John Doe",
                "email": "john@testcompany.com",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 Test St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        company_id = res.data["id"]
        self.assertEqual(res.data["company_name"], "Test Company")
        self.assertEqual(res.data["contact_person"], "John Doe")

        # List
        res = self.client.get(reverse("company-list"))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Retrieve
        res = self.client.get(reverse("company-detail", args=[company_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["company_name"], "Test Company")

        # Update
        res = self.client.put(
            reverse("company-detail", args=[company_id]),
            {
                "company_name": "Updated Company",
                "contact_person": "Jane Doe",
                "email": "jane@updatedcompany.com",
                "phone_number": "+256709876543",
                "industry": self.industry.id,
                "company_address": "456 Updated St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["company_name"], "Updated Company")

        # Delete (soft)
        res = self.client.delete(reverse("company-detail", args=[company_id]))
        self.assertEqual(res.status_code, 204)
        
        # Verify soft delete
        res = self.client.get(reverse("company-detail", args=[company_id]))
        self.assertEqual(res.status_code, 404)

    def test_company_validation(self):
        """Test company validation rules."""
        # Missing required fields
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Test Company",
                # Missing contact_person, email, phone_number, industry
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Invalid email format
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Test Company",
                "contact_person": "John Doe",
                "email": "invalid-email",
                "phone_number": "+256701234567",
                "industry": self.industry.id,
                "company_address": "123 Test St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Invalid phone number
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Test Company",
                "contact_person": "John Doe",
                "email": "john@testcompany.com",
                "phone_number": "123",  # Too short
                "industry": self.industry.id,
                "company_address": "123 Test St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

        # Duplicate company name
        Company.objects.create(
            company_name="Existing Company",
            contact_person="John Doe",
            email="john@existing.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )
        
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Existing Company",
                "contact_person": "Jane Doe",
                "email": "jane@different.com",
                "phone_number": "+256709876543",
                "industry": self.industry.id,
                "company_address": "456 Test St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_company_filtering(self):
        """Test company filtering and search."""
        # Create test companies
        company1 = Company.objects.create(
            company_name="Alpha Corp",
            contact_person="John Doe",
            email="john@alpha.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Alpha St"
        )
        
        # Use existing industry or create a new one with unique name
        industry2, created = Industry.objects.get_or_create(
            industry_name="Finance Test",
            defaults={"description": "Finance companies for testing"}
        )
        company2 = Company.objects.create(
            company_name="Beta Corp",
            contact_person="Jane Doe",
            email="jane@beta.com",
            phone_number="+256709876543",
            industry=industry2,
            company_address="456 Beta St"
        )

        # Search by company name
        res = self.client.get(reverse("company-list"), {"search": "Alpha"})
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        companies = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(companies), 1)
        # Find our specific company in the results
        alpha_found = any(
            (c.get("company_name") == "Alpha Corp" if isinstance(c, dict) else c["company_name"] == "Alpha Corp")
            for c in companies
        )
        self.assertTrue(alpha_found)

        # Filter by industry
        res = self.client.get(reverse("company-list"), {"industry": self.industry.id})
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        companies = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(companies), 1)
        # Find our specific company in the results
        alpha_found = any(
            (c.get("company_name") == "Alpha Corp" if isinstance(c, dict) else c["company_name"] == "Alpha Corp")
            for c in companies
        )
        self.assertTrue(alpha_found)

        # Search by email
        res = self.client.get(reverse("company-list"), {"search": "beta.com"})
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        companies = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(companies), 1)
        # Find our specific company in the results
        beta_found = any(
            (c.get("company_name") == "Beta Corp" if isinstance(c, dict) else c["company_name"] == "Beta Corp")
            for c in companies
        )
        self.assertTrue(beta_found)

    def test_company_ordering(self):
        """Test company ordering."""
        # Create test companies with different names
        company1 = Company.objects.create(
            company_name="Zebra Corp",
            contact_person="John Doe",
            email="john@zebra.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Zebra St"
        )
        company2 = Company.objects.create(
            company_name="Alpha Corp",
            contact_person="Jane Doe",
            email="jane@alpha.com",
            phone_number="+256709876543",
            industry=self.industry,
            company_address="456 Alpha St"
        )

        # Order by name ascending
        res = self.client.get(reverse("company-list"), {"ordering": "company_name"})
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        companies = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(companies), 2)
        # Find our companies in the results
        company_names = [c.get("company_name") if isinstance(c, dict) else c["company_name"] for c in companies]
        self.assertIn("Alpha Corp", company_names)
        self.assertIn("Zebra Corp", company_names)
        
        # Check ordering - Alpha should come before Zebra
        alpha_index = company_names.index("Alpha Corp")
        zebra_index = company_names.index("Zebra Corp")
        self.assertLess(alpha_index, zebra_index)

        # Order by name descending
        res = self.client.get(reverse("company-list"), {"ordering": "-company_name"})
        self.assertEqual(res.status_code, 200)
        # Handle paginated response
        companies = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        self.assertGreaterEqual(len(companies), 2)
        # Find our companies in the results
        company_names = [c.get("company_name") if isinstance(c, dict) else c["company_name"] for c in companies]
        self.assertIn("Alpha Corp", company_names)
        self.assertIn("Zebra Corp", company_names)
        
        # Check ordering - Zebra should come before Alpha
        alpha_index = company_names.index("Alpha Corp")
        zebra_index = company_names.index("Zebra Corp")
        self.assertGreater(alpha_index, zebra_index)

    def test_industry_crud(self):
        """Test industry CRUD operations."""
        # Create
        res = self.client.post(
            reverse("industry-list"),
            {
                "industry_name": "Healthcare",
                "description": "Healthcare companies"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        industry_id = res.data["id"]
        self.assertEqual(res.data["industry_name"], "Healthcare")

        # List
        res = self.client.get(reverse("industry-list"))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 2)  # At least our test industry + new one

        # Update
        res = self.client.put(
            reverse("industry-detail", args=[industry_id]),
            {
                "industry_name": "Healthcare Updated",
                "description": "Updated healthcare companies"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["industry_name"], "Healthcare Updated")

        # Delete (soft)
        res = self.client.delete(reverse("industry-detail", args=[industry_id]))
        self.assertEqual(res.status_code, 204)

        # Verify soft delete
        res = self.client.get(reverse("industry-detail", args=[industry_id]))
        self.assertEqual(res.status_code, 404)

    def test_company_statistics(self):
        """Test company statistics endpoint."""
        # Create test companies with different statuses
        company1 = Company.objects.create(
            company_name="Active Company",
            contact_person="John Doe",
            email="john@active.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Active St"
        )
        company2 = Company.objects.create(
            company_name="Inactive Company",
            contact_person="Jane Doe",
            email="jane@inactive.com",
            phone_number="+256709876543",
            industry=self.industry,
            company_address="456 Inactive St"
        )
        
        # Deactivate one company
        CompanyService.company_deactivate(company_id=company2.id, user=self.user)

        # Test statistics endpoint
        res = self.client.get(reverse("company-analytics-statistics"))
        self.assertEqual(res.status_code, 200)
        stats = res.data
        self.assertIn("total_companies", stats)
        self.assertIn("active_companies", stats)
        self.assertIn("inactive_companies", stats)

    def test_company_with_invalid_industry(self):
        """Test company creation with invalid industry ID."""
        res = self.client.post(
            reverse("company-list"),
            {
                "company_name": "Test Company",
                "contact_person": "John Doe",
                "email": "john@testcompany.com",
                "phone_number": "+256701234567",
                "industry": "invalid-industry-id",
                "company_address": "123 Test St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_company_update_with_invalid_industry(self):
        """Test company update with invalid industry ID."""
        company = Company.objects.create(
            company_name="Test Company",
            contact_person="John Doe",
            email="john@testcompany.com",
            phone_number="+256701234567",
            industry=self.industry,
            company_address="123 Test St"
        )

        res = self.client.put(
            reverse("company-detail", args=[company.id]),
            {
                "company_name": "Updated Company",
                "contact_person": "Jane Doe",
                "email": "jane@updated.com",
                "phone_number": "+256709876543",
                "industry": "invalid-industry-id",
                "company_address": "456 Updated St"
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
