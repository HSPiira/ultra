from django.contrib import admin
from apps.providers.models import Hospital, Doctor


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_person", "phone_number", "email", "status", "created_at")
    search_fields = ("name", "contact_person", "phone_number", "email")
    list_filter = ("status",)


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("name", "get_hospitals", "specialization", "phone_number", "email", "status", "created_at")
    search_fields = ("name", "specialization", "license_number", "phone_number", "email")
    list_filter = ("status", "hospitals")

    def get_hospitals(self, obj):
        return ", ".join([h.name for h in obj.hospitals.all()])
    get_hospitals.short_description = "Hospitals"