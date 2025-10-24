import json
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.medical_catalog.models import Service, Medicine, LabTest, HospitalItemPrice
from apps.providers.models import Hospital


class MedicalCatalogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test hospital
        self.hospital = Hospital.objects.create(
            name="Test Hospital",
            address="123 Test St",
            contact_person="Dr. Test",
            email="test@hospital.com",
            phone_number="1234567890"
        )
        
        # Get content types for testing
        self.service_content_type = ContentType.objects.get_for_model(Service)
        self.medicine_content_type = ContentType.objects.get_for_model(Medicine)
        self.labtest_content_type = ContentType.objects.get_for_model(LabTest)

    def test_service_crud_operations(self):
        """Test complete CRUD operations for Service model"""
        # Test CREATE
        service_data = {
            "name": "General Consultation",
            "category": "Consultation",
            "description": "General medical consultation",
            "base_amount": 50.00,
            "service_type": "GENERAL"
        }
        
        # Test with CSRF token (should be filtered out)
        service_data_with_csrf = {
            **service_data,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.post(
            reverse("service-list"),
            service_data_with_csrf,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Service.objects.count(), 1)
        
        service = Service.objects.first()
        self.assertEqual(service.name, "General Consultation")
        self.assertEqual(service.base_amount, Decimal("50.00"))
        self.assertEqual(service.service_type, "GENERAL")
        
        service_id = service.id
        
        # Test READ (list)
        response = self.client.get(reverse("service-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test READ (detail)
        response = self.client.get(reverse("service-detail", args=[service_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "General Consultation")
        
        # Test UPDATE
        update_data = {
            "name": "Updated Consultation",
            "category": "Updated Category",
            "description": "Updated description",
            "base_amount": 60.00,
            "service_type": "SPECIALIST",
            "csrfmiddlewaretoken": "fake-csrf-token"  # Should be ignored
        }
        
        response = self.client.put(
            reverse("service-detail", args=[service_id]),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        service.refresh_from_db()
        self.assertEqual(service.name, "Updated Consultation")
        self.assertEqual(service.base_amount, Decimal("60.00"))
        self.assertEqual(service.service_type, "SPECIALIST")
        
        # Test PATCH
        patch_data = {
            "base_amount": 65.00,
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.patch(
            reverse("service-detail", args=[service_id]),
            patch_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        service.refresh_from_db()
        self.assertEqual(service.base_amount, Decimal("65.00"))
        
        # Test DELETE (soft delete)
        response = self.client.delete(reverse("service-detail", args=[service_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Service.objects.count(), 0)  # Should be soft deleted
        self.assertEqual(Service.all_objects.count(), 1)  # Should still exist in all_objects

    def test_service_filtering_and_search(self):
        """Test filtering and search functionality for services"""
        # Create test services
        Service.objects.create(
            name="Cardiology Consultation",
            category="Cardiology",
            base_amount=100.00,
            service_type="SPECIALIST"
        )
        Service.objects.create(
            name="General Checkup",
            category="General",
            base_amount=50.00,
            service_type="GENERAL"
        )
        Service.objects.create(
            name="X-Ray",
            category="Imaging",
            base_amount=75.00,
            service_type="IMAGING"
        )
        
        # Test search
        response = self.client.get(reverse("service-list"), {"search": "cardiology"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Cardiology Consultation")
        
        # Test filtering by category
        response = self.client.get(reverse("service-list"), {"category": "General"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test filtering by service_type
        response = self.client.get(reverse("service-list"), {"service_type": "SPECIALIST"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test ordering
        response = self.client.get(reverse("service-list"), {"ordering": "base_amount"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        amounts = [float(item["base_amount"]) for item in response.data["results"]]
        self.assertEqual(amounts, sorted(amounts))

    def test_medicine_crud_operations(self):
        """Test complete CRUD operations for Medicine model"""
        # Test CREATE
        medicine_data = {
            "name": "Paracetamol",
            "dosage_form": "Tablet",
            "unit_price": 2.50,
            "route": "Oral",
            "duration": "7 days"
        }
        
        # Test with extra fields (should be filtered out)
        medicine_data_with_extra = {
            **medicine_data,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.post(
            reverse("medicine-list"),
            medicine_data_with_extra,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Medicine.objects.count(), 1)
        
        medicine = Medicine.objects.first()
        self.assertEqual(medicine.name, "Paracetamol")
        self.assertEqual(medicine.unit_price, Decimal("2.50"))
        self.assertEqual(medicine.dosage_form, "Tablet")
        
        medicine_id = medicine.id
        
        # Test READ
        response = self.client.get(reverse("medicine-detail", args=[medicine_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Paracetamol")
        
        # Test UPDATE
        update_data = {
            "name": "Updated Paracetamol",
            "unit_price": 3.00,
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.put(
            reverse("medicine-detail", args=[medicine_id]),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        medicine.refresh_from_db()
        self.assertEqual(medicine.name, "Updated Paracetamol")
        self.assertEqual(medicine.unit_price, Decimal("3.00"))
        
        # Test DELETE
        response = self.client.delete(reverse("medicine-detail", args=[medicine_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Medicine.objects.count(), 0)

    def test_medicine_filtering_and_search(self):
        """Test filtering and search functionality for medicines"""
        # Create test medicines
        Medicine.objects.create(
            name="Paracetamol",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        Medicine.objects.create(
            name="Ibuprofen",
            dosage_form="Capsule",
            unit_price=3.00,
            route="Oral"
        )
        Medicine.objects.create(
            name="Insulin",
            dosage_form="Injection",
            unit_price=25.00,
            route="Subcutaneous"
        )
        
        # Test search
        response = self.client.get(reverse("medicine-list"), {"search": "paracetamol"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test filtering by dosage_form
        response = self.client.get(reverse("medicine-list"), {"dosage_form": "Tablet"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test filtering by route
        response = self.client.get(reverse("medicine-list"), {"route": "Oral"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_labtest_crud_operations(self):
        """Test complete CRUD operations for LabTest model"""
        # Test CREATE
        labtest_data = {
            "name": "Complete Blood Count",
            "category": "Blood Test",
            "description": "Complete blood count test",
            "base_amount": 25.00,
            "normal_range": "4.5-5.5",
            "units": "million/μL"
        }
        
        # Test with extra fields (should be filtered out)
        labtest_data_with_extra = {
            **labtest_data,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.post(
            reverse("labtest-list"),
            labtest_data_with_extra,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LabTest.objects.count(), 1)
        
        labtest = LabTest.objects.first()
        self.assertEqual(labtest.name, "Complete Blood Count")
        self.assertEqual(labtest.base_amount, Decimal("25.00"))
        self.assertEqual(labtest.normal_range, "4.5-5.5")
        
        labtest_id = labtest.id
        
        # Test READ
        response = self.client.get(reverse("labtest-detail", args=[labtest_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Complete Blood Count")
        
        # Test UPDATE
        update_data = {
            "name": "Updated CBC",
            "base_amount": 30.00,
            "normal_range": "4.0-6.0",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.put(
            reverse("labtest-detail", args=[labtest_id]),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        labtest.refresh_from_db()
        self.assertEqual(labtest.name, "Updated CBC")
        self.assertEqual(labtest.base_amount, Decimal("30.00"))
        self.assertEqual(labtest.normal_range, "4.0-6.0")
        
        # Test DELETE
        response = self.client.delete(reverse("labtest-detail", args=[labtest_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(LabTest.objects.count(), 0)

    def test_labtest_filtering_and_search(self):
        """Test filtering and search functionality for lab tests"""
        # Create test lab tests
        LabTest.objects.create(
            name="Complete Blood Count",
            category="Blood Test",
            base_amount=25.00,
            normal_range="4.5-5.5",
            units="million/μL"
        )
        LabTest.objects.create(
            name="Urine Analysis",
            category="Urine Test",
            base_amount=15.00,
            normal_range="Normal",
            units="N/A"
        )
        LabTest.objects.create(
            name="X-Ray Chest",
            category="Imaging",
            base_amount=50.00,
            normal_range="N/A",
            units="N/A"
        )
        
        # Test search
        response = self.client.get(reverse("labtest-list"), {"search": "blood"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        
        # Test filtering by category
        response = self.client.get(reverse("labtest-list"), {"category": "Blood Test"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_hospital_item_price_crud_operations(self):
        """Test complete CRUD operations for HospitalItemPrice model"""
        # Create test service
        service = Service.objects.create(
            name="X-Ray",
            base_amount=50.00,
            service_type="IMAGING"
        )
        
        # Test CREATE
        price_data = {
            "hospital": self.hospital.id,
            "content_type": self.service_content_type.id,
            "object_id": str(service.id),
            "amount": 45.00,
            "available": True
        }
        
        # Test with extra fields (should be filtered out)
        price_data_with_extra = {
            **price_data,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.post(
            reverse("hospitalitemprice-list"),
            price_data_with_extra,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(HospitalItemPrice.objects.count(), 1)
        
        price = HospitalItemPrice.objects.first()
        self.assertEqual(price.hospital, self.hospital)
        self.assertEqual(price.content_object, service)
        self.assertEqual(price.amount, Decimal("45.00"))
        self.assertTrue(price.available)
        
        price_id = price.id
        
        # Test READ
        response = self.client.get(reverse("hospitalitemprice-detail", args=[price_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["amount"]), "45.00")
        
        # Test UPDATE
        update_data = {
            "amount": 50.00,
                "available": False,
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.put(
            reverse("hospitalitemprice-detail", args=[price_id]),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        price.refresh_from_db()
        self.assertEqual(price.amount, Decimal("50.00"))
        self.assertFalse(price.available)
        
        # Test DELETE
        response = self.client.delete(reverse("hospitalitemprice-detail", args=[price_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(HospitalItemPrice.objects.count(), 0)

    def test_hospital_item_price_with_different_content_types(self):
        """Test HospitalItemPrice with different content types (Service, Medicine, LabTest)"""
        # Create test objects
        service = Service.objects.create(
            name="Consultation",
            base_amount=50.00,
            service_type="GENERAL"
        )
        medicine = Medicine.objects.create(
            name="Paracetamol",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        labtest = LabTest.objects.create(
            name="CBC",
            base_amount=25.00,
            normal_range="4.5-5.5",
            units="million/μL"
        )
        
        # Test with Service
        service_price_data = {
            "hospital": self.hospital.id,
            "content_type": self.service_content_type.id,
            "object_id": str(service.id),
            "amount": 45.00,
            "available": True
        }
        
        response = self.client.post(
            reverse("hospitalitemprice-list"),
            service_price_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with Medicine
        medicine_price_data = {
            "hospital": self.hospital.id,
            "content_type": self.medicine_content_type.id,
            "object_id": str(medicine.id),
            "amount": 3.00,
            "available": True
        }
        
        response = self.client.post(
            reverse("hospitalitemprice-list"),
            medicine_price_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with LabTest
        labtest_price_data = {
            "hospital": self.hospital.id,
            "content_type": self.labtest_content_type.id,
            "object_id": str(labtest.id),
            "amount": 20.00,
            "available": True
        }
        
        response = self.client.post(
            reverse("hospitalitemprice-list"),
            labtest_price_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify all prices were created
        self.assertEqual(HospitalItemPrice.objects.count(), 3)

    def test_validation_errors(self):
        """Test validation errors for all models"""
        # Test Service validation - invalid data should fail
        response = self.client.post(
            reverse("service-list"),
            {"name": "Test Service", "base_amount": -50.00, "service_type": "GENERAL"},  # Negative amount
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test Medicine validation - invalid data should fail
        response = self.client.post(
            reverse("medicine-list"),
            {"name": "Test Medicine", "dosage_form": "Tablet", "unit_price": -2.50, "route": "Oral"},  # Negative price
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test LabTest validation - invalid data should fail
        response = self.client.post(
            reverse("labtest-list"),
            {"name": "Test Lab Test", "base_amount": -25.00},  # Negative amount
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test HospitalItemPrice validation - invalid hospital ID should fail
        response = self.client.post(
            reverse("hospitalitemprice-list"),
            {"hospital": 999, "content_type": 1, "object_id": "1", "amount": 10.00},  # Invalid hospital ID
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access the APIs"""
        # Create a new client without authentication
        unauthorized_client = APIClient()
        
        # Test all endpoints with unauthorized client
        endpoints = [
            reverse("service-list"),
            reverse("medicine-list"),
            reverse("labtest-list"),
            reverse("hospitalitemprice-list"),
        ]
        
        for endpoint in endpoints:
            response = unauthorized_client.get(endpoint)
            # 403 is also acceptable for unauthorized access
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_pagination(self):
        """Test pagination for list endpoints"""
        # Create multiple services
        for i in range(25):
            Service.objects.create(
                name=f"Service {i}",
                base_amount=50.00 + i,
                service_type="GENERAL"
            )
        
        # Test pagination
        response = self.client.get(reverse("service-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)

    def test_ordering(self):
        """Test ordering functionality"""
        # Create services with different amounts
        Service.objects.create(name="Service A", base_amount=100.00, service_type="GENERAL")
        Service.objects.create(name="Service B", base_amount=50.00, service_type="GENERAL")
        Service.objects.create(name="Service C", base_amount=75.00, service_type="GENERAL")
        
        # Test ascending order
        response = self.client.get(reverse("service-list"), {"ordering": "base_amount"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        amounts = [float(item["base_amount"]) for item in response.data["results"]]
        self.assertEqual(amounts, sorted(amounts))
        
        # Test descending order
        response = self.client.get(reverse("service-list"), {"ordering": "-base_amount"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        amounts = [float(item["base_amount"]) for item in response.data["results"]]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

    def test_csrf_token_handling(self):
        """Test that CSRF tokens and other form fields are properly filtered out"""
        service_data = {
            "name": "Test Service",
            "base_amount": 50.00,
            "service_type": "GENERAL",
            "csrfmiddlewaretoken": "fake-csrf-token",
            "form_data": "should_be_ignored",
            "submit": "Save",
            "extra_field": "should_be_ignored"
        }
        
        response = self.client.post(
            reverse("service-list"),
            service_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify only valid fields were saved
        service = Service.objects.first()
        self.assertEqual(service.name, "Test Service")
        self.assertEqual(service.base_amount, Decimal("50.00"))
        self.assertEqual(service.service_type, "GENERAL")
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(service, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(service, 'form_data'))
        self.assertFalse(hasattr(service, 'submit'))
        self.assertFalse(hasattr(service, 'extra_field'))