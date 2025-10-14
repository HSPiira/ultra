from django.contrib import admin
from apps.companies.models import Company, Industry


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ('id', 'industry_name', 'status', 'created_at')
    search_fields = ('industry_name',)
    list_filter = ('status',)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'company_name', 'industry', 'contact_person', 'email', 'phone_number', 'status', 'created_at'
    )
    search_fields = ('company_name', 'contact_person', 'email', 'phone_number', 'company_address')
    list_filter = ('status', 'industry')
    autocomplete_fields = ('industry',)
