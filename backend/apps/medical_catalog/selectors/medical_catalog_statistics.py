from django.db import models
from apps.medical_catalog.models import Service, Medicine, LabTest, HospitalItemPrice
from apps.core.enums.choices import BusinessStatusChoices


def medical_catalog_statistics_get():
    """
    Get comprehensive medical catalog statistics.
    
    Returns:
        dict: Medical catalog statistics
    """
    # Get counts for each model
    total_services = Service.objects.count()
    active_services = Service.objects.filter(status=BusinessStatusChoices.ACTIVE).count()
    
    total_medicines = Medicine.objects.count()
    active_medicines = Medicine.objects.filter(status=BusinessStatusChoices.ACTIVE).count()
    
    total_lab_tests = LabTest.objects.count()
    active_lab_tests = LabTest.objects.filter(status=BusinessStatusChoices.ACTIVE).count()
    
    total_hospital_prices = HospitalItemPrice.objects.count()
    active_hospital_prices = HospitalItemPrice.objects.filter(status=BusinessStatusChoices.ACTIVE).count()
    
    # Calculate total value from all base amounts
    total_value = 0
    
    # Sum service base amounts
    service_values = Service.objects.filter(status=BusinessStatusChoices.ACTIVE).aggregate(
        total=models.Sum('base_amount')
    )['total'] or 0
    total_value += float(service_values)
    
    # Sum medicine unit prices
    medicine_values = Medicine.objects.filter(status=BusinessStatusChoices.ACTIVE).aggregate(
        total=models.Sum('unit_price')
    )['total'] or 0
    total_value += float(medicine_values)
    
    # Sum lab test base amounts
    labtest_values = LabTest.objects.filter(status=BusinessStatusChoices.ACTIVE).aggregate(
        total=models.Sum('base_amount')
    )['total'] or 0
    total_value += float(labtest_values)
    
    # Sum hospital item prices
    hospital_price_values = HospitalItemPrice.objects.filter(
        status=BusinessStatusChoices.ACTIVE,
        available=True
    ).aggregate(
        total=models.Sum('amount')
    )['total'] or 0
    total_value += float(hospital_price_values)
    
    return {
        'total_services': total_services,
        'active_services': active_services,
        'total_medicines': total_medicines,
        'active_medicines': active_medicines,
        'total_lab_tests': total_lab_tests,
        'active_lab_tests': active_lab_tests,
        'total_hospital_prices': total_hospital_prices,
        'active_hospital_prices': active_hospital_prices,
        'total_value': total_value,
    }
