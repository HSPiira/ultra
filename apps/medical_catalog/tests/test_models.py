from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.providers.models import Hospital
from apps.medical_catalog.models import Service, Medicine, LabTest, HospitalItemPrice


class MedicalCatalogModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="pass1234")

    def test_service_create_and_soft_delete(self):
        service = Service.objects.create(name="Consultation", base_amount=50, service_type="GENERAL")
        self.assertEqual(Service.objects.count(), 1)

        service.soft_delete(user=self.user)
        service.save()
        self.assertEqual(Service.objects.count(), 0)
        self.assertTrue(Service.all_objects.first().is_deleted)

    def test_medicine_create(self):
        med = Medicine.objects.create(name="Paracetamol", dosage_form="Tablet", unit_price=2.5, route="Oral")
        self.assertEqual(Medicine.objects.count(), 1)
        self.assertEqual(med.name, "Paracetamol")

    def test_labtest_create(self):
        test = LabTest.objects.create(name="CBC", base_amount=15.0)
        self.assertEqual(LabTest.objects.count(), 1)
        self.assertEqual(test.name, "CBC")

    def test_hospital_item_price_create(self):
        hospital = Hospital.objects.create(name="GH")
        # Link a Service price
        service = Service.objects.create(name="X-Ray", base_amount=30, service_type="IMAGING")
        price = HospitalItemPrice.objects.create(hospital=hospital, content_object=service, amount=25)
        self.assertEqual(HospitalItemPrice.objects.count(), 1)
        self.assertEqual(price.hospital, hospital)


