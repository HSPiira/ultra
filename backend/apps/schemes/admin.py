from django.contrib import admin

from apps.schemes.models import Benefit, Plan, Scheme, SchemePeriod, SchemeItem


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheme_name",
        "company",
        "card_code",
        "is_renewable",
        "status",
        "created_at",
    )
    search_fields = ("scheme_name", "card_code", "description", "remark")
    list_filter = ("status", "company", "is_renewable")
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


@admin.register(SchemePeriod)
class SchemePeriodAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheme",
        "period_number",
        "start_date",
        "end_date",
        "limit_amount",
        "is_current",
        "status",
        "created_at",
    )
    search_fields = ("scheme__scheme_name", "remark")
    list_filter = ("status", "is_current", "start_date", "end_date")
    autocomplete_fields = ("scheme", "renewed_from")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Period Information", {
            "fields": ("scheme", "period_number", "start_date", "end_date", "termination_date")
        }),
        ("Coverage", {
            "fields": ("limit_amount",)
        }),
        ("Renewal Tracking", {
            "fields": ("renewed_from", "renewal_date", "is_current", "changes_summary")
        }),
        ("Status & Notes", {
            "fields": ("status", "remark")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(SchemeItem)
class SchemeItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheme_period",
        "content_type",
        "object_id",
        "item",
        "limit_amount",
        "copayment_percent",
        "status",
        "created_at",
    )
    search_fields = ("object_id", "scheme_period__scheme__scheme_name")
    list_filter = ("status", "scheme_period__scheme", "content_type")
    autocomplete_fields = ("scheme_period",)
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset to prevent N+1 queries when rendering __str__."""
        qs = super().get_queryset(request)
        return qs.select_related('scheme_period__scheme', 'content_type')
