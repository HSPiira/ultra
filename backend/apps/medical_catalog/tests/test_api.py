from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.medical_catalog.models import Service
from apps.providers.models import Hospital


class MedicalCatalogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.client.force_login(self.user)

    def test_service_crud(self):
        res = self.client.post(
            reverse("service-list"),
            {"name": "Consult", "base_amount": 40, "service_type": "GEN"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        obj_id = res.data["id"]

        res = self.client.get(reverse("service-list"))
        self.assertEqual(res.status_code, 200)

        res = self.client.put(
            reverse("service-detail", args=[obj_id]),
            {"name": "Consult 2", "base_amount": 45, "service_type": "GEN"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Consult 2")

        res = self.client.delete(reverse("service-detail", args=[obj_id]))
        self.assertEqual(res.status_code, 204)

    def test_medicine_crud(self):
        res = self.client.post(
            reverse("medicine-list"),
            {"name": "Para", "dosage_form": "Tab", "unit_price": 2.5, "route": "Oral"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        obj_id = res.data["id"]

        res = self.client.get(reverse("medicine-list"))
        self.assertEqual(res.status_code, 200)

        res = self.client.put(
            reverse("medicine-detail", args=[obj_id]),
            {"name": "Para 2", "dosage_form": "Tab", "unit_price": 3, "route": "Oral"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Para 2")

        res = self.client.delete(reverse("medicine-detail", args=[obj_id]))
        self.assertEqual(res.status_code, 204)

    def test_labtest_crud(self):
        res = self.client.post(
            reverse("labtest-list"), {"name": "CBC", "base_amount": 15}, format="json"
        )
        self.assertEqual(res.status_code, 201)
        obj_id = res.data["id"]

        res = self.client.get(reverse("labtest-list"))
        self.assertEqual(res.status_code, 200)

        res = self.client.put(
            reverse("labtest-detail", args=[obj_id]),
            {"name": "CBC+", "base_amount": 18},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "CBC+")

        res = self.client.delete(reverse("labtest-detail", args=[obj_id]))
        self.assertEqual(res.status_code, 204)

    def test_hospital_item_price_crud(self):
        hospital = Hospital.objects.create(name="Hosp")
        service = Service.objects.create(
            name="X-Ray", base_amount=30, service_type="IMAGING"
        )

        res = self.client.post(
            reverse("hospitalitemprice-list"),
            {
                "hospital": hospital.id,
                "content_type": 1,
                "object_id": service.id,
                "amount": 25,
                "available": True,
            },
            format="json",
        )
        # Note: content_type id 1 assumes first ContentType entry exists; in real tests, fetch ContentType for Service.
        self.assertEqual(res.status_code, 201)
        obj_id = res.data["id"]

        res = self.client.get(reverse("hospitalitemprice-list"))
        self.assertEqual(res.status_code, 200)

        res = self.client.put(
            reverse("hospitalitemprice-detail", args=[obj_id]),
            {
                "hospital": hospital.id,
                "content_type": 1,
                "object_id": service.id,
                "amount": 27,
                "available": False,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(str(res.data["amount"]), "27.00")

        res = self.client.delete(reverse("hospitalitemprice-detail", args=[obj_id]))
        self.assertEqual(res.status_code, 204)
