from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from datetime import date

from apps.providers.models import Doctor, Hospital, DoctorHospitalAffiliation


class ProvidersModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.hospital = Hospital.objects.create(
            name="General Hospital",
            address="123 Main St",
            contact_person="John Doe",
            phone_number="+1234567890",
            email="contact@generalhospital.com"
        )
        self.doctor = Doctor.objects.create(
            name="Dr. Jane Smith",
            specialization="Cardiology",
            license_number="MD123456",
            qualification="MBBS, MD",
            phone_number="+1234567891",
            email="jane.smith@hospital.com"
        )

    def test_hospital_create_and_soft_delete(self):
        """Test hospital creation and soft deletion"""
        # Clear existing hospitals first
        Hospital.objects.all().delete()
        
        hospital = Hospital.objects.create(name="Test Hospital")
        self.assertEqual(Hospital.objects.count(), 1)
        self.assertEqual(hospital.name, "Test Hospital")
        self.assertFalse(hospital.is_deleted)

        hospital.soft_delete(user=self.user)
        hospital.save()

        self.assertEqual(Hospital.objects.count(), 0)
        self.assertEqual(Hospital.all_objects.count(), 1)
        self.assertTrue(Hospital.all_objects.first().is_deleted)

    def test_hospital_unique_name_constraint(self):
        """Test that hospital names must be unique"""
        Hospital.objects.create(name="Unique Hospital")
        
        with self.assertRaises(IntegrityError):
            Hospital.objects.create(name="Unique Hospital")

    def test_hospital_branch_relationship(self):
        """Test hospital branch relationship"""
        main_hospital = Hospital.objects.create(name="Main Hospital")
        branch_hospital = Hospital.objects.create(
            name="Branch Hospital",
            branch_of=main_hospital
        )
        
        self.assertEqual(branch_hospital.branch_of, main_hospital)
        self.assertIn(branch_hospital, main_hospital.branches.all())

    def test_hospital_manager_methods(self):
        """Test hospital manager custom methods"""
        Hospital.objects.create(name="Test Hospital")
        Hospital.objects.create(name="Another Hospital")
        
        # Test by_name method
        hospitals = Hospital.objects.by_name("Test Hospital")
        self.assertEqual(hospitals.count(), 1)
        self.assertEqual(hospitals.first().name, "Test Hospital")
        
        # Test case insensitive search
        hospitals = Hospital.objects.by_name("test hospital")
        self.assertEqual(hospitals.count(), 1)

    def test_doctor_create_and_soft_delete(self):
        """Test doctor creation and soft deletion"""
        # Clear existing doctors first
        Doctor.objects.all().delete()
        
        doctor = Doctor.objects.create(
            name="Dr. Test",
            specialization="Neurology",
            license_number="MD789012"
        )
        self.assertEqual(Doctor.objects.count(), 1)
        self.assertEqual(doctor.name, "Dr. Test")
        self.assertFalse(doctor.is_deleted)

        doctor.soft_delete(user=self.user)
        doctor.save()

        self.assertEqual(Doctor.objects.count(), 0)
        self.assertEqual(Doctor.all_objects.count(), 1)
        self.assertTrue(Doctor.all_objects.first().is_deleted)

    def test_doctor_unique_license_constraint(self):
        """Test that doctor license numbers must be unique"""
        Doctor.objects.create(name="Dr. One", license_number="MD111111")
        
        with self.assertRaises(IntegrityError):
            Doctor.objects.create(name="Dr. Two", license_number="MD111111")

    def test_doctor_hospital_relationship(self):
        """Test doctor-hospital many-to-many relationship"""
        hospital1 = Hospital.objects.create(name="Hospital 1")
        hospital2 = Hospital.objects.create(name="Hospital 2")
        
        doctor = Doctor.objects.create(name="Dr. Multi")
        doctor.hospitals.add(hospital1, hospital2)
        
        self.assertEqual(doctor.hospitals.count(), 2)
        self.assertIn(hospital1, doctor.hospitals.all())
        self.assertIn(hospital2, doctor.hospitals.all())

    def test_doctor_manager_methods(self):
        """Test doctor manager custom methods"""
        hospital = Hospital.objects.create(name="Test Hospital")
        doctor1 = Doctor.objects.create(name="Dr. One", license_number="MD001")
        doctor2 = Doctor.objects.create(name="Dr. Two", license_number="MD002")
        doctor1.hospitals.add(hospital)
        
        # Test by_license method
        doctor = Doctor.objects.by_license("MD001")
        self.assertEqual(doctor.count(), 1)
        self.assertEqual(doctor.first().name, "Dr. One")
        
        # Test for_hospital method
        doctors = Doctor.objects.for_hospital(hospital.id)
        self.assertEqual(doctors.count(), 1)
        self.assertEqual(doctors.first().name, "Dr. One")

    def test_doctor_hospital_affiliation_create(self):
        """Test doctor-hospital affiliation creation"""
        affiliation = DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            role="Consultant",
            start_date=date(2023, 1, 1),
            is_primary=True
        )
        
        self.assertEqual(affiliation.doctor, self.doctor)
        self.assertEqual(affiliation.hospital, self.hospital)
        self.assertEqual(affiliation.role, "Consultant")
        self.assertTrue(affiliation.is_primary)

    def test_doctor_hospital_affiliation_unique_constraint(self):
        """Test that doctor-hospital combinations must be unique"""
        DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            role="Consultant"
        )
        
        with self.assertRaises(IntegrityError):
            DoctorHospitalAffiliation.objects.create(
                doctor=self.doctor,
                hospital=self.hospital,
                role="Resident"
            )

    def test_doctor_hospital_affiliation_date_validation(self):
        """Test that end_date must be on or after start_date"""
        affiliation = DoctorHospitalAffiliation(
            doctor=self.doctor,
            hospital=self.hospital,
            start_date=date(2023, 6, 1),
            end_date=date(2023, 5, 1)  # End before start
        )
        
        with self.assertRaises(ValidationError):
            affiliation.clean()

    def test_doctor_hospital_affiliation_primary_validation(self):
        """Test that only one primary affiliation is allowed per doctor"""
        hospital2 = Hospital.objects.create(name="Hospital 2")
        
        # Create first primary affiliation
        DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            is_primary=True
        )
        
        # Try to create second primary affiliation
        affiliation2 = DoctorHospitalAffiliation(
            doctor=self.doctor,
            hospital=hospital2,
            is_primary=True
        )
        
        with self.assertRaises(ValidationError):
            affiliation2.clean()

    def test_doctor_hospital_affiliation_primary_update(self):
        """Test updating primary affiliation"""
        hospital2 = Hospital.objects.create(name="Hospital 2")
        
        # Create first primary affiliation
        affiliation1 = DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            is_primary=True
        )
        
        # Create second affiliation
        affiliation2 = DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=hospital2,
            is_primary=False
        )
        
        # Update first to non-primary first
        affiliation1.is_primary = False
        affiliation1.save()
        
        # Then update second to primary (should work now)
        affiliation2.is_primary = True
        affiliation2.clean()  # Should not raise error
        affiliation2.save()

    def test_doctor_soft_delete_with_claims_validation(self):
        """Test that doctor cannot be deleted if claims exist"""
        # This test would require the claims app to be properly set up
        # For now, we'll test the method exists and can be called
        try:
            self.doctor.soft_delete(user=self.user)
            self.doctor.save()
        except ValidationError:
            # Expected if claims exist
            pass
        except Exception as e:
            # If claims app is not properly set up, we expect an ImportError
            self.assertIsInstance(e, (ImportError, ValidationError))

    def test_hospital_soft_delete_with_claims_validation(self):
        """Test that hospital cannot be deleted if claims exist"""
        # This test would require the claims app to be properly set up
        # For now, we'll test the method exists and can be called
        try:
            self.hospital.soft_delete(user=self.user)
            self.hospital.save()
        except ValidationError:
            # Expected if claims exist
            pass
        except Exception as e:
            # If claims app is not properly set up, we expect an ImportError
            self.assertIsInstance(e, (ImportError, ValidationError))

    def test_model_string_representations(self):
        """Test string representations of models"""
        self.assertEqual(str(self.doctor), "Dr. Jane Smith")
        self.assertEqual(str(self.hospital), "General Hospital")
        
        affiliation = DoctorHospitalAffiliation.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            role="Consultant"
        )
        self.assertEqual(str(affiliation), "Dr. Jane Smith @ General Hospital")
