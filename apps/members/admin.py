from django.contrib import admin
from apps.members.models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'company', 'scheme', 'relationship', 'card_number', 'status', 'created_at'
    )
    list_filter = ('status', 'relationship', 'company', 'scheme')
    search_fields = ('name', 'card_number', 'national_id', 'email', 'phone_number')
    autocomplete_fields = ('company', 'scheme', 'parent')
