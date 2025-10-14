from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.providers.models import Hospital, Doctor


class ProvidersModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="pass1234")

    def test_hospital_create_and_soft_delete(self):
        hospital = Hospital.objects.create(name="General Hospital")
        self.assertEqual(Hospital.objects.count(), 1)

        hospital.soft_delete(user=self.user)
        hospital.save()

        self.assertEqual(Hospital.objects.count(), 0)
        self.assertEqual(Hospital.all_objects.count(), 1)
        self.assertTrue(Hospital.all_objects.first().is_deleted)

    def test_doctor_create(self):
        hospital = Hospital.objects.create(name="Clinic A")
        doctor = Doctor.objects.create(hospital=hospital, name="Dr. Who")
        self.assertEqual(Doctor.objects.count(), 1)
        self.assertEqual(doctor.hospital, hospital)


