from django.contrib import admin
from apps.providers.models import Hospital, Doctor


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_person", "phone_number", "email", "status", "created_at")
    search_fields = ("name", "contact_person", "phone_number", "email")
    list_filter = ("status",)


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("name", "hospital", "specialization", "phone_number", "email", "status", "created_at")
    search_fields = ("name", "specialization", "license_number", "phone_number", "email")
    list_filter = ("status", "hospital")
