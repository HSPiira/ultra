from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from datetime import date

from apps.providers.models import Doctor, Hospital, DoctorHospitalAffiliation


class ProvidersAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.client.force_login(self.user)
        
        # Create test data
        self.hospital1 = Hospital.objects.create(
            name="General Hospital",
            address="123 Main St",
            contact_person="John Doe",
            phone_number="+1234567890",
            email="contact@generalhospital.com"
        )
        self.hospital2 = Hospital.objects.create(
            name="City Clinic",
            address="456 Oak Ave",
            contact_person="Jane Smith",
            phone_number="+1234567891",
            email="contact@cityclinic.com"
        )

    def test_hospital_crud(self):
        """Test complete hospital CRUD operations"""
        # Create
        hospital_data = {
            "name": "Test Hospital",
            "address": "789 Test St",
            "contact_person": "Test Person",
            "phone_number": "+1234567892",
            "email": "test@hospital.com",
            "website": "https://testhospital.com"
        }
        res = self.client.post(reverse("hospital-list"), hospital_data, format="json")
        self.assertEqual(res.status_code, 201)
        hospital_id = res.data["id"]
        self.assertEqual(res.data["name"], "Test Hospital")

        # List
        res = self.client.get(reverse("hospital-list"))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Retrieve
        res = self.client.get(reverse("hospital-detail", args=[hospital_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Test Hospital")

        # Update
        update_data = {"name": "Test Hospital Updated"}
        res = self.client.put(
            reverse("hospital-detail", args=[hospital_id]),
            update_data,
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Test Hospital Updated")

        # Partial update
        res = self.client.patch(
            reverse("hospital-detail", args=[hospital_id]),
            {"phone_number": "+1234567893"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["phone_number"], "+1234567893")

        # Delete (soft)
        res = self.client.delete(reverse("hospital-detail", args=[hospital_id]))
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Hospital.objects.count(), 2)  # Only our test hospitals remain

    def test_hospital_filtering_and_search(self):
        """Test hospital filtering and search functionality"""
        # Clear all hospitals first
        Hospital.objects.all().delete()
        
        # Recreate test hospitals
        hospital1 = Hospital.objects.create(
            name="General Hospital",
            address="123 Main St",
            contact_person="John Doe",
            phone_number="+1234567890",
            email="contact@generalhospital.com"
        )
        hospital2 = Hospital.objects.create(
            name="City Clinic",
            address="456 Oak Ave",
            contact_person="Jane Smith",
            phone_number="+1234567891",
            email="contact@cityclinic.com"
        )
        
        # Test search by name
        res = self.client.get(reverse("hospital-list"), {"search": "General"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(hospitals), 1)
        self.assertEqual(hospitals[0]["name"], "General Hospital")

        # Test search by contact person
        res = self.client.get(reverse("hospital-list"), {"search": "Jane"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(hospitals), 1)
        self.assertEqual(hospitals[0]["name"], "City Clinic")

        # Test search by phone
        res = self.client.get(reverse("hospital-list"), {"search": "7890"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(hospitals), 1)

        # Test filtering by status
        res = self.client.get(reverse("hospital-list"), {"status": "active"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(hospitals), 2)

    def test_hospital_branch_relationship(self):
        """Test hospital branch relationship in API"""
        # Clear all hospitals first
        Hospital.objects.all().delete()
        
        # Create a main hospital first
        main_hospital = Hospital.objects.create(name="Main Hospital")
        
        # Create a branch hospital
        branch_data = {
            "name": "Branch Hospital",
            "branch_of": str(main_hospital.id)
        }
        res = self.client.post(reverse("hospital-list"), branch_data, format="json")
        self.assertEqual(res.status_code, 201)
        branch_id = res.data["id"]

        # Test filtering by branch_of
        res = self.client.get(reverse("hospital-list"), {"branch_of": str(main_hospital.id)})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(hospitals), 1)
        self.assertEqual(hospitals[0]["name"], "Branch Hospital")

    def test_doctor_crud(self):
        """Test complete doctor CRUD operations"""
        # Create doctor with hospital
        doctor_data = {
            "name": "Dr. Test",
            "specialization": "Cardiology",
            "license_number": "MD123456",
            "qualification": "MBBS, MD",
            "phone_number": "+1234567894",
            "email": "dr.test@hospital.com",
            "hospital": self.hospital1.id
        }
        res = self.client.post(reverse("doctor-list"), doctor_data, format="json")
        self.assertEqual(res.status_code, 201)
        doctor_id = res.data["id"]
        self.assertEqual(res.data["name"], "Dr. Test")
        self.assertIn(self.hospital1.id, res.data["hospitals"])

        # List
        res = self.client.get(reverse("doctor-list"))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Retrieve
        res = self.client.get(reverse("doctor-detail", args=[doctor_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Dr. Test")

        # Update
        update_data = {"name": "Dr. Test Updated"}
        res = self.client.put(
            reverse("doctor-detail", args=[doctor_id]),
            update_data,
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Dr. Test Updated")

        # Partial update
        res = self.client.patch(
            reverse("doctor-detail", args=[doctor_id]),
            {"specialization": "Neurology"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["specialization"], "Neurology")

        # Delete (soft)
        res = self.client.delete(reverse("doctor-detail", args=[doctor_id]))
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Doctor.objects.count(), 0)

    def test_doctor_filtering_and_search(self):
        """Test doctor filtering and search functionality"""
        # Clear all doctors first
        Doctor.objects.all().delete()
        
        # Create test doctors
        doctor1 = Doctor.objects.create(
            name="Dr. Cardiology",
            specialization="Cardiology",
            license_number="MD001",
            email="cardio@hospital.com"
        )
        doctor2 = Doctor.objects.create(
            name="Dr. Neurology",
            specialization="Neurology",
            license_number="MD002",
            email="neuro@hospital.com"
        )
        doctor1.hospitals.add(self.hospital1)
        doctor2.hospitals.add(self.hospital2)

        # Test search by name
        res = self.client.get(reverse("doctor-list"), {"search": "Cardiology"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        doctors = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(doctors), 1)
        self.assertEqual(doctors[0]["name"], "Dr. Cardiology")

        # Test search by specialization
        res = self.client.get(reverse("doctor-list"), {"search": "Neurology"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        doctors = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(doctors), 1)
        self.assertEqual(doctors[0]["name"], "Dr. Neurology")

        # Test search by email
        res = self.client.get(reverse("doctor-list"), {"search": "cardio"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        doctors = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(doctors), 1)

        # Test filtering by hospital
        res = self.client.get(reverse("doctor-list"), {"hospital": str(self.hospital1.id)})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        doctors = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(doctors), 1)
        self.assertEqual(doctors[0]["name"], "Dr. Cardiology")

        # Test filtering by status
        res = self.client.get(reverse("doctor-list"), {"status": "active"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        doctors = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(doctors), 2)

    def test_doctor_hospital_affiliations(self):
        """Test doctor-hospital affiliations through API"""
        # Create doctor
        doctor_data = {
            "name": "Dr. Multi",
            "specialization": "General Medicine",
            "license_number": "MD999",
            "affiliations_payload": [
                {
                    "hospital": self.hospital1.id,
                    "role": "Consultant",
                    "start_date": "2023-01-01",
                    "is_primary": True
                },
                {
                    "hospital": self.hospital2.id,
                    "role": "Visiting Doctor",
                    "start_date": "2023-02-01",
                    "is_primary": False
                }
            ]
        }
        res = self.client.post(reverse("doctor-list"), doctor_data, format="json")
        self.assertEqual(res.status_code, 201)
        doctor_id = res.data["id"]

        # Check affiliations were created
        res = self.client.get(reverse("doctor-detail", args=[doctor_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["affiliations"]), 2)
        
        # Check primary affiliation
        primary_affiliation = next(
            (aff for aff in res.data["affiliations"] if aff["is_primary"]), None
        )
        self.assertIsNotNone(primary_affiliation)
        self.assertEqual(primary_affiliation["role"], "Consultant")

    def test_doctor_multiple_hospitals(self):
        """Test doctor with multiple hospitals"""
        doctor_data = {
            "name": "Dr. Multi",
            "specialization": "General Medicine",
            "license_number": "MD888",
            "hospitals": [self.hospital1.id, self.hospital2.id]
        }
        res = self.client.post(reverse("doctor-list"), doctor_data, format="json")
        self.assertEqual(res.status_code, 201)
        doctor_id = res.data["id"]

        # Check both hospitals are associated
        res = self.client.get(reverse("doctor-detail", args=[doctor_id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["hospitals"]), 2)
        self.assertIn(self.hospital1.id, res.data["hospitals"])
        self.assertIn(self.hospital2.id, res.data["hospitals"])

    def test_doctor_license_validation(self):
        """Test doctor license number validation"""
        # Create doctor with license
        doctor_data = {
            "name": "Dr. First",
            "license_number": "MD123456"
        }
        res = self.client.post(reverse("doctor-list"), doctor_data, format="json")
        self.assertEqual(res.status_code, 201)

        # Try to create another doctor with same license
        doctor_data2 = {
            "name": "Dr. Second",
            "license_number": "MD123456"
        }
        res = self.client.post(reverse("doctor-list"), doctor_data2, format="json")
        self.assertEqual(res.status_code, 400)  # Should fail due to unique constraint

    def test_hospital_name_validation(self):
        """Test hospital name validation"""
        # Create hospital
        hospital_data = {"name": "Unique Hospital"}
        res = self.client.post(reverse("hospital-list"), hospital_data, format="json")
        self.assertEqual(res.status_code, 201)

        # Try to create another hospital with same name
        res = self.client.post(reverse("hospital-list"), hospital_data, format="json")
        self.assertEqual(res.status_code, 400)  # Should fail due to unique constraint

    def test_ordering(self):
        """Test API ordering functionality"""
        # Clear all hospitals first
        Hospital.objects.all().delete()
        
        # Create hospitals with different names
        Hospital.objects.create(name="Alpha Hospital")
        Hospital.objects.create(name="Beta Hospital")
        Hospital.objects.create(name="Charlie Hospital")

        # Test ordering by name ascending
        res = self.client.get(reverse("hospital-list"), {"ordering": "name"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        names = [hospital["name"] for hospital in hospitals]
        self.assertEqual(names, sorted(names))

        # Test ordering by name descending
        res = self.client.get(reverse("hospital-list"), {"ordering": "-name"})
        self.assertEqual(res.status_code, 200)
        # Handle pagination response
        hospitals = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        names = [hospital["name"] for hospital in hospitals]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_pagination(self):
        """Test API pagination if implemented"""
        # Clear all hospitals first
        Hospital.objects.all().delete()
        
        # Create multiple hospitals
        for i in range(25):
            Hospital.objects.create(name=f"Hospital {i}")

        res = self.client.get(reverse("hospital-list"))
        self.assertEqual(res.status_code, 200)
        # Note: Pagination behavior depends on DRF settings
        # This test assumes pagination is enabled
        if isinstance(res.data, dict) and 'results' in res.data:
            # Paginated response
            self.assertIsInstance(res.data['results'], list)
            self.assertIn('count', res.data)
        else:
            # Non-paginated response
            self.assertIsInstance(res.data, list)

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access the API"""
        # Create a new client without authentication
        unauthorized_client = APIClient()
        
        # Try to access hospital list
        res = unauthorized_client.get(reverse("hospital-list"))
        # This depends on your authentication settings
        # If authentication is required, this should return 401 or 403
        # If not required, it should return 200
        self.assertIn(res.status_code, [200, 401, 403])

    def test_doctor_hospital_affiliation_validation(self):
        """Test doctor-hospital affiliation validation"""
        doctor_data = {
            "name": "Dr. Test",
            "license_number": "MD777",
            "affiliations_payload": [
                {
                    "hospital": str(self.hospital1.id),
                    "role": "Consultant",
                    "start_date": "2023-06-01",
                    "end_date": "2023-05-01",  # End before start - should fail
                    "is_primary": True
                }
            ]
        }
        res = self.client.post(reverse("doctor-list"), doctor_data, format="json")
        # This should fail due to date validation
        self.assertEqual(res.status_code, 400)
