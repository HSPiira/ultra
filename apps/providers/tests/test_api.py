from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.providers.models import Hospital, Doctor


class ProvidersAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="tester", password="pass1234")
        self.client.force_login(self.user)

    def test_hospital_crud(self):
        # Create
        res = self.client.post(reverse('hospital-list'), {"name": "GH"}, format='json')
        self.assertEqual(res.status_code, 201)
        hospital_id = res.data["id"]

        # List
        res = self.client.get(reverse('hospital-list'))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Update
        res = self.client.put(reverse('hospital-detail', args=[hospital_id]), {"name": "GH Updated"}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "GH Updated")

        # Delete (soft)
        res = self.client.delete(reverse('hospital-detail', args=[hospital_id]))
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Hospital.objects.count(), 0)

    def test_doctor_crud(self):
        hospital = Hospital.objects.create(name="Clinic")

        # Create
        res = self.client.post(
            reverse('doctor-list'),
            {"hospital": hospital.id, "name": "Dr. Jane"},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        doctor_id = res.data["id"]

        # List
        res = self.client.get(reverse('doctor-list'))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) >= 1)

        # Update
        res = self.client.put(reverse('doctor-detail', args=[doctor_id]), {"hospital": hospital.id, "name": "Dr. Jane D"}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Dr. Jane D")

        # Delete (soft)
        res = self.client.delete(reverse('doctor-detail', args=[doctor_id]))
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Doctor.objects.count(), 0)


