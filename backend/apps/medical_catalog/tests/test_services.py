from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from apps.medical_catalog.models import Service, Medicine, LabTest, HospitalItemPrice
from apps.medical_catalog.services import (
    ServiceService,
    MedicineService,
    LabTestService,
    HospitalItemPriceService
)
from apps.providers.models import Hospital


class ServiceServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )

    def test_service_create_with_valid_data(self):
        """Test service creation with valid data"""
        data = {
            "name": "General Consultation",
            "category": "Consultation",
            "description": "General medical consultation",
            "base_amount": 50.00,
            "service_type": "GENERAL"
        }
        
        service = ServiceService.create(data=data, user=self.user)
        
        self.assertEqual(service.name, "General Consultation")
        self.assertEqual(service.category, "Consultation")
        self.assertEqual(service.description, "General medical consultation")
        self.assertEqual(service.base_amount, Decimal("50.00"))
        self.assertEqual(service.service_type, "GENERAL")
        self.assertEqual(Service.objects.count(), 1)

    def test_service_create_filters_extra_fields(self):
        """Test that service creation filters out non-model fields"""
        data = {
            "name": "General Consultation",
            "category": "Consultation",
            "description": "General medical consultation",
            "base_amount": 50.00,
            "service_type": "GENERAL",
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored",
            "form_data": "should_be_ignored"
        }
        
        service = ServiceService.create(data=data, user=self.user)
        
        # Verify valid fields were saved
        self.assertEqual(service.name, "General Consultation")
        self.assertEqual(service.base_amount, Decimal("50.00"))
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(service, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(service, 'extra_field'))
        self.assertFalse(hasattr(service, 'form_data'))

    def test_service_update_with_valid_data(self):
        """Test service update with valid data"""
        service = Service.objects.create(
            name="Original Name",
            base_amount=50.00,
            service_type="GENERAL"
        )
        
        update_data = {
            "name": "Updated Name",
            "base_amount": 60.00,
            "service_type": "SPECIALIST"
        }
        
        updated_service = ServiceService.update(
            service_id=str(service.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_service.name, "Updated Name")
        self.assertEqual(updated_service.base_amount, Decimal("60.00"))
        self.assertEqual(updated_service.service_type, "SPECIALIST")

    def test_service_update_filters_extra_fields(self):
        """Test that service update filters out non-model fields"""
        service = Service.objects.create(
            name="Original Name",
            base_amount=50.00,
            service_type="GENERAL"
        )
        
        update_data = {
            "name": "Updated Name",
            "base_amount": 60.00,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        updated_service = ServiceService.update(
            service_id=str(service.id),
            data=update_data,
            user=self.user
        )
        
        # Verify valid fields were updated
        self.assertEqual(updated_service.name, "Updated Name")
        self.assertEqual(updated_service.base_amount, Decimal("60.00"))
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(updated_service, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(updated_service, 'extra_field'))

    def test_service_deactivate(self):
        """Test service deactivation (soft delete)"""
        service = Service.objects.create(
            name="Test Service",
            base_amount=50.00,
            service_type="GENERAL"
        )
        
        self.assertEqual(Service.objects.count(), 1)
        
        ServiceService.deactivate(service_id=str(service.id), user=self.user)
        
        # Should be soft deleted
        self.assertEqual(Service.objects.count(), 0)
        self.assertEqual(Service.all_objects.count(), 1)
        
        # Verify soft delete fields
        service.refresh_from_db()
        self.assertTrue(service.is_deleted)
        self.assertIsNotNone(service.deleted_at)
        self.assertEqual(service.deleted_by, self.user)


class MedicineServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )

    def test_medicine_create_with_valid_data(self):
        """Test medicine creation with valid data"""
        data = {
            "name": "Paracetamol",
            "dosage_form": "Tablet",
            "unit_price": 2.50,
            "route": "Oral",
            "duration": "7 days"
        }
        
        medicine = MedicineService.create(data=data, user=self.user)
        
        self.assertEqual(medicine.name, "Paracetamol")
        self.assertEqual(medicine.dosage_form, "Tablet")
        self.assertEqual(medicine.unit_price, Decimal("2.50"))
        self.assertEqual(medicine.route, "Oral")
        self.assertEqual(medicine.duration, "7 days")
        self.assertEqual(Medicine.objects.count(), 1)

    def test_medicine_create_filters_extra_fields(self):
        """Test that medicine creation filters out non-model fields"""
        data = {
            "name": "Paracetamol",
            "dosage_form": "Tablet",
            "unit_price": 2.50,
            "route": "Oral",
            "duration": "7 days",
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        medicine = MedicineService.create(data=data, user=self.user)
        
        # Verify valid fields were saved
        self.assertEqual(medicine.name, "Paracetamol")
        self.assertEqual(medicine.unit_price, Decimal("2.50"))
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(medicine, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(medicine, 'extra_field'))

    def test_medicine_update_with_valid_data(self):
        """Test medicine update with valid data"""
        medicine = Medicine.objects.create(
            name="Original Name",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        
        update_data = {
            "name": "Updated Name",
            "unit_price": 3.00,
            "route": "Intravenous"
        }
        
        updated_medicine = MedicineService.update(
            medicine_id=str(medicine.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_medicine.name, "Updated Name")
        self.assertEqual(updated_medicine.unit_price, Decimal("3.00"))
        self.assertEqual(updated_medicine.route, "Intravenous")

    def test_medicine_deactivate(self):
        """Test medicine deactivation (soft delete)"""
        medicine = Medicine.objects.create(
            name="Test Medicine",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        
        self.assertEqual(Medicine.objects.count(), 1)
        
        MedicineService.deactivate(medicine_id=str(medicine.id), user=self.user)
        
        # Should be soft deleted
        self.assertEqual(Medicine.objects.count(), 0)
        self.assertEqual(Medicine.all_objects.count(), 1)


class LabTestServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )

    def test_labtest_create_with_valid_data(self):
        """Test lab test creation with valid data"""
        data = {
            "name": "Complete Blood Count",
            "category": "Blood Test",
            "description": "Complete blood count test",
            "base_amount": 25.00,
            "normal_range": "4.5-5.5",
            "units": "million/μL"
        }
        
        labtest = LabTestService.create(data=data, user=self.user)
        
        self.assertEqual(labtest.name, "Complete Blood Count")
        self.assertEqual(labtest.category, "Blood Test")
        self.assertEqual(labtest.description, "Complete blood count test")
        self.assertEqual(labtest.base_amount, Decimal("25.00"))
        self.assertEqual(labtest.normal_range, "4.5-5.5")
        self.assertEqual(labtest.units, "million/μL")
        self.assertEqual(LabTest.objects.count(), 1)

    def test_labtest_create_filters_extra_fields(self):
        """Test that lab test creation filters out non-model fields"""
        data = {
            "name": "Complete Blood Count",
            "category": "Blood Test",
            "description": "Complete blood count test",
            "base_amount": 25.00,
            "normal_range": "4.5-5.5",
            "units": "million/μL",
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        labtest = LabTestService.create(data=data, user=self.user)
        
        # Verify valid fields were saved
        self.assertEqual(labtest.name, "Complete Blood Count")
        self.assertEqual(labtest.base_amount, Decimal("25.00"))
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(labtest, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(labtest, 'extra_field'))

    def test_labtest_update_with_valid_data(self):
        """Test lab test update with valid data"""
        labtest = LabTest.objects.create(
            name="Original Name",
            base_amount=25.00,
            normal_range="4.5-5.5",
            units="million/μL"
        )
        
        update_data = {
            "name": "Updated Name",
            "base_amount": 30.00,
            "normal_range": "4.0-6.0"
        }
        
        updated_labtest = LabTestService.update(
            labtest_id=str(labtest.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_labtest.name, "Updated Name")
        self.assertEqual(updated_labtest.base_amount, Decimal("30.00"))
        self.assertEqual(updated_labtest.normal_range, "4.0-6.0")

    def test_labtest_deactivate(self):
        """Test lab test deactivation (soft delete)"""
        labtest = LabTest.objects.create(
            name="Test Lab Test",
            base_amount=25.00,
            normal_range="4.5-5.5",
            units="million/μL"
        )
        
        self.assertEqual(LabTest.objects.count(), 1)
        
        LabTestService.deactivate(labtest_id=str(labtest.id), user=self.user)
        
        # Should be soft deleted
        self.assertEqual(LabTest.objects.count(), 0)
        self.assertEqual(LabTest.all_objects.count(), 1)


class HospitalItemPriceServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pass1234"
        )
        self.hospital = Hospital.objects.create(
            name="Test Hospital",
            address="123 Test St",
            contact_person="Dr. Test",
            email="test@hospital.com",
            phone_number="1234567890"
        )
        self.service = Service.objects.create(
            name="Test Service",
            base_amount=50.00,
            service_type="GENERAL"
        )
        self.service_content_type = ContentType.objects.get_for_model(Service)

    def test_hospital_item_price_create_with_valid_data(self):
        """Test hospital item price creation with valid data"""
        data = {
            "hospital": str(self.hospital.id),
            "content_type": str(self.service_content_type.id),
            "object_id": str(self.service.id),
            "amount": 45.00,
            "available": True
        }
        
        price = HospitalItemPriceService.create(data=data, user=self.user)
        
        self.assertEqual(price.hospital, self.hospital)
        self.assertEqual(price.content_type, self.service_content_type)
        self.assertEqual(price.object_id, str(self.service.id))
        self.assertEqual(price.amount, Decimal("45.00"))
        self.assertTrue(price.available)
        self.assertEqual(HospitalItemPrice.objects.count(), 1)

    def test_hospital_item_price_create_filters_extra_fields(self):
        """Test that hospital item price creation filters out non-model fields"""
        data = {
            "hospital": str(self.hospital.id),
            "content_type": str(self.service_content_type.id),
            "object_id": str(self.service.id),
            "amount": 45.00,
            "available": True,
            "csrfmiddlewaretoken": "fake-csrf-token",
            "extra_field": "should_be_ignored"
        }
        
        price = HospitalItemPriceService.create(data=data, user=self.user)
        
        # Verify valid fields were saved
        self.assertEqual(price.hospital, self.hospital)
        self.assertEqual(price.amount, Decimal("45.00"))
        
        # Verify extra fields were not saved
        self.assertFalse(hasattr(price, 'csrfmiddlewaretoken'))
        self.assertFalse(hasattr(price, 'extra_field'))

    def test_hospital_item_price_update_with_valid_data(self):
        """Test hospital item price update with valid data"""
        price = HospitalItemPrice.objects.create(
            hospital=self.hospital,
            content_type=self.service_content_type,
            object_id=str(self.service.id),
            amount=45.00,
            available=True
        )
        
        update_data = {
            "amount": 50.00,
            "available": False
        }
        
        updated_price = HospitalItemPriceService.update(
            price_id=str(price.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_price.amount, Decimal("50.00"))
        self.assertFalse(updated_price.available)

    def test_hospital_item_price_update_with_hospital_change(self):
        """Test hospital item price update with hospital change"""
        new_hospital = Hospital.objects.create(
            name="New Hospital",
            address="456 New St",
            contact_person="Dr. New",
            email="new@hospital.com",
            phone_number="0987654321"
        )
        
        price = HospitalItemPrice.objects.create(
            hospital=self.hospital,
            content_type=self.service_content_type,
            object_id=str(self.service.id),
            amount=45.00,
            available=True
        )
        
        update_data = {
            "hospital": str(new_hospital.id),
            "amount": 50.00
        }
        
        updated_price = HospitalItemPriceService.update(
            price_id=str(price.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_price.hospital, new_hospital)
        self.assertEqual(updated_price.amount, Decimal("50.00"))

    def test_hospital_item_price_update_with_content_type_change(self):
        """Test hospital item price update with content type change"""
        medicine = Medicine.objects.create(
            name="Test Medicine",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        medicine_content_type = ContentType.objects.get_for_model(Medicine)
        
        price = HospitalItemPrice.objects.create(
            hospital=self.hospital,
            content_type=self.service_content_type,
            object_id=str(self.service.id),
            amount=45.00,
            available=True
        )
        
        update_data = {
            "content_type": str(medicine_content_type.id),
            "object_id": str(medicine.id),
            "amount": 3.00
        }
        
        updated_price = HospitalItemPriceService.update(
            price_id=str(price.id),
            data=update_data,
            user=self.user
        )
        
        self.assertEqual(updated_price.content_type, medicine_content_type)
        self.assertEqual(updated_price.object_id, str(medicine.id))
        self.assertEqual(updated_price.amount, Decimal("3.00"))

    def test_hospital_item_price_deactivate(self):
        """Test hospital item price deactivation (soft delete)"""
        price = HospitalItemPrice.objects.create(
            hospital=self.hospital,
            content_type=self.service_content_type,
            object_id=str(self.service.id),
            amount=45.00,
            available=True
        )
        
        self.assertEqual(HospitalItemPrice.objects.count(), 1)
        
        HospitalItemPriceService.deactivate(price_id=str(price.id), user=self.user)
        
        # Should be soft deleted
        self.assertEqual(HospitalItemPrice.objects.count(), 0)
        self.assertEqual(HospitalItemPrice.all_objects.count(), 1)

    def test_hospital_item_price_create_with_medicine(self):
        """Test hospital item price creation with medicine content type"""
        medicine = Medicine.objects.create(
            name="Test Medicine",
            dosage_form="Tablet",
            unit_price=2.50,
            route="Oral"
        )
        medicine_content_type = ContentType.objects.get_for_model(Medicine)
        
        data = {
            "hospital": str(self.hospital.id),
            "content_type": str(medicine_content_type.id),
            "object_id": str(medicine.id),
            "amount": 3.00,
            "available": True
        }
        
        price = HospitalItemPriceService.create(data=data, user=self.user)
        
        self.assertEqual(price.hospital, self.hospital)
        self.assertEqual(price.content_type, medicine_content_type)
        self.assertEqual(price.object_id, str(medicine.id))
        self.assertEqual(price.amount, Decimal("3.00"))
        self.assertTrue(price.available)

    def test_hospital_item_price_create_with_labtest(self):
        """Test hospital item price creation with lab test content type"""
        labtest = LabTest.objects.create(
            name="Test Lab Test",
            base_amount=25.00,
            normal_range="4.5-5.5",
            units="million/μL"
        )
        labtest_content_type = ContentType.objects.get_for_model(LabTest)
        
        data = {
            "hospital": str(self.hospital.id),
            "content_type": str(labtest_content_type.id),
            "object_id": str(labtest.id),
            "amount": 20.00,
            "available": True
        }
        
        price = HospitalItemPriceService.create(data=data, user=self.user)
        
        self.assertEqual(price.hospital, self.hospital)
        self.assertEqual(price.content_type, labtest_content_type)
        self.assertEqual(price.object_id, str(labtest.id))
        self.assertEqual(price.amount, Decimal("20.00"))
        self.assertTrue(price.available)
