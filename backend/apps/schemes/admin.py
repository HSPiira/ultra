from django.contrib import admin

from apps.schemes.models import Benefit, Plan, Scheme, SchemeItem


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheme_name",
        "company",
        "card_code",
        "start_date",
        "end_date",
        "status",
        "created_at",
    )
    search_fields = ("scheme_name", "card_code", "description", "remark")
    list_filter = ("status", "company", "start_date", "end_date")
    autocomplete_fields = ("company",)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("id", "plan_name", "status", "created_at")
    search_fields = ("plan_name",)
    list_filter = ("status",)


@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ("id", "benefit_name", "status", "created_at")
    search_fields = ("benefit_name",)
    list_filter = ("status",)


@admin.register(SchemeItem)
class SchemeItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheme",
        "content_type",
        "object_id",
        "item",
        "status",
        "created_at",
    )
    search_fields = ("object_id",)
    list_filter = ("status", "scheme", "content_type")
    autocomplete_fields = ("scheme",)
