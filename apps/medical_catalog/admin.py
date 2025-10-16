from django.contrib import admin

from apps.medical_catalog.models import HospitalItemPrice, LabTest, Medicine, Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "service_type",
        "base_amount",
        "status",
        "created_at",
    )
    search_fields = ("name", "category", "service_type")
    list_filter = ("status", "service_type")


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "dosage_form",
        "route",
        "unit_price",
        "status",
        "created_at",
    )
    search_fields = ("name", "dosage_form", "route")
    list_filter = ("status",)


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "base_amount", "units", "status", "created_at")
    search_fields = ("name", "category", "units")
    list_filter = ("status",)


@admin.register(HospitalItemPrice)
class HospitalItemPriceAdmin(admin.ModelAdmin):
    list_display = (
        "hospital",
        "content_type",
        "object_id",
        "amount",
        "available",
        "status",
        "created_at",
    )
    search_fields = ("hospital__name",)
    list_filter = ("status", "available", "content_type")
