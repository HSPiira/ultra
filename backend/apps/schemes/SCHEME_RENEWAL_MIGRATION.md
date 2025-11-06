# Scheme Renewal Migration Guide

This guide explains how to migrate from the old Scheme model (with embedded dates/limits) to the new Scheme + SchemePeriod design that supports renewals without data loss.

## Overview

**Old Design** (Data Loss on Renewal):
- Scheme has `start_date`, `end_date`, `limit_amount` directly
- Renewing meant overwriting these fields → historical data lost

**New Design** (Preserves History):
- `Scheme`: Master entity (scheme identity, company, card_code, etc.)
- `SchemePeriod`: Time-bound periods (dates, limits per period)
- Each renewal creates a new SchemePeriod linked to previous

## Migration Steps

### 1. Run Migrations

```bash
# Create migrations for model changes
python manage.py makemigrations

# Review the migration file (Django will detect field removal/addition)
# Manually edit migration if needed to preserve data

# Apply migrations
python manage.py migrate
```

### 2. Data Migration Script

Create a data migration to move existing scheme data into periods:

```python
# Create empty migration
python manage.py makemigrations schemes --empty --name migrate_schemes_to_periods

# Edit the migration file:
# apps/schemes/migrations/XXXX_migrate_schemes_to_periods.py
```

```python
from django.db import migrations


def migrate_existing_schemes_to_periods(apps, schema_editor):
    """
    Migrate existing Scheme records to use SchemePeriod model.

    For each existing scheme, create an initial SchemePeriod with
    the scheme's current date and limit data.
    """
    Scheme = apps.get_model('schemes', 'Scheme')
    SchemePeriod = apps.get_model('schemes', 'SchemePeriod')

    for scheme in Scheme.objects.all():
        # Check if period already exists (in case migration is re-run)
        if not SchemePeriod.objects.filter(scheme=scheme).exists():
            # Create initial period from scheme's existing data
            SchemePeriod.objects.create(
                scheme=scheme,
                period_number=1,
                start_date=scheme.start_date,
                end_date=scheme.end_date,
                termination_date=scheme.termination_date,
                limit_amount=scheme.limit_amount,
                is_current=True,
                renewed_from=None,
                renewal_date=None,
                remark=f"Migrated from original scheme data",
                status=scheme.status,
                # Preserve timestamps if possible
                created_at=scheme.created_at,
            )
            print(f"✓ Migrated scheme {scheme.scheme_name} (ID: {scheme.id})")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration - copy current period data back to scheme.
    """
    Scheme = apps.get_model('schemes', 'Scheme')
    SchemePeriod = apps.get_model('schemes', 'SchemePeriod')

    for scheme in Scheme.objects.all():
        current_period = SchemePeriod.objects.filter(
            scheme=scheme, is_current=True
        ).first()

        if current_period:
            scheme.start_date = current_period.start_date
            scheme.end_date = current_period.end_date
            scheme.termination_date = current_period.termination_date
            scheme.limit_amount = current_period.limit_amount
            scheme.save(update_fields=[
                'start_date', 'end_date', 'termination_date', 'limit_amount'
            ])


class Migration(migrations.Migration):
    dependencies = [
        ('schemes', 'XXXX_previous_migration'),  # Update to actual previous migration
    ]

    operations = [
        migrations.RunPython(
            migrate_existing_schemes_to_periods,
            reverse_migration
        ),
    ]
```

### 3. Update Existing Code

**Before (accessing scheme dates/limits directly):**
```python
# Old code
scheme = Scheme.objects.get(id=scheme_id)
if claim_date >= scheme.start_date and claim_date <= scheme.end_date:
    available_limit = scheme.limit_amount
```

**After (accessing through current period):**
```python
# New code
scheme = Scheme.objects.get(id=scheme_id)
current_period = scheme.get_current_period()

if current_period and current_period.is_active_on(claim_date):
    available_limit = current_period.limit_amount
```

**Or using selectors:**
```python
from apps.schemes.selectors.scheme_period_selector import scheme_period_on_date_get

period = scheme_period_on_date_get(scheme_id=scheme_id, when_date=claim_date)
if period:
    available_limit = period.limit_amount
```

## Usage Examples

### Creating a New Scheme with Initial Period

```python
from apps.schemes.services.scheme_service import SchemeService
from apps.schemes.services.scheme_period_service import SchemePeriodService

# 1. Create the scheme (master entity)
scheme = SchemeService.scheme_create(
    scheme_data={
        "scheme_name": "Gold Health Plan",
        "company": company_id,
        "card_code": "GLD",
        "description": "Premium health coverage",
        "is_renewable": True,
        "family_applicable": True,
    },
    user=request.user
)

# 2. Create the initial period
period = SchemePeriodService.scheme_period_create_initial(
    scheme_id=scheme.id,
    period_data={
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "limit_amount": Decimal("50000.00"),
        "remark": "Initial enrollment period",
    },
    user=request.user
)
```

### Renewing a Scheme

```python
from apps.schemes.services.scheme_period_service import SchemePeriodService

# Renew scheme for next year
new_period = SchemePeriodService.scheme_period_renew(
    scheme_id=scheme.id,
    renewal_data={
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "limit_amount": Decimal("60000.00"),  # Increased limit
        "remark": "Annual renewal with increased coverage",
    },
    user=request.user
)

# Old period is automatically marked as is_current=False
# New period becomes the current period
# All historical data from old period is preserved
# changes_summary JSON tracks what changed
```

### Querying Scheme Periods

```python
from apps.schemes.selectors.scheme_period_selector import (
    scheme_period_current_get,
    scheme_period_list_by_scheme,
    scheme_period_on_date_get,
    scheme_period_renewal_chain_get,
    scheme_period_statistics_get,
)

# Get current period
current = scheme_period_current_get(scheme_id=scheme.id)
print(f"Current limit: {current.limit_amount}")

# Get all periods for scheme (history)
all_periods = scheme_period_list_by_scheme(scheme_id=scheme.id)
for period in all_periods:
    print(f"Period {period.period_number}: {period.start_date} to {period.end_date}")

# Get period that was active on a specific date
claim_date = date(2024, 6, 15)
period = scheme_period_on_date_get(scheme_id=scheme.id, when_date=claim_date)
if period:
    print(f"Claim covered under period {period.period_number}")

# Get complete renewal chain
chain = scheme_period_renewal_chain_get(period_id=current.id)
print(f"Scheme has been renewed {len(chain) - 1} times")

# Get statistics
stats = scheme_period_statistics_get(scheme_id=scheme.id)
print(f"Total periods: {stats['total_periods']}")
print(f"Has been renewed: {stats['has_been_renewed']}")
print(f"Average limit: {stats['average_limit_amount']}")
```

### Processing Claims with Historical Periods

```python
def process_claim(claim):
    """Process a claim using the correct period based on claim date."""
    from apps.schemes.selectors.scheme_period_selector import scheme_period_on_date_get

    # Find the period that was active when claim occurred
    period = scheme_period_on_date_get(
        scheme_id=claim.scheme_id,
        when_date=claim.claim_date
    )

    if not period:
        raise ValidationError("No active scheme period found for claim date")

    # Use period's limit for claim validation
    if claim.amount > period.limit_amount:
        raise ValidationError(
            f"Claim amount exceeds period limit of {period.limit_amount}"
        )

    # Process claim...
    return claim
```

### Finding Schemes Expiring Soon

```python
from apps.schemes.selectors.scheme_period_selector import scheme_period_expiring_soon

# Get all periods expiring in next 30 days
expiring = scheme_period_expiring_soon(days=30)

for period in expiring:
    print(f"⚠️ Scheme {period.scheme.scheme_name} expires on {period.end_date}")
    if period.scheme.is_renewable:
        # Send renewal reminder
        send_renewal_notification(period.scheme, period)
```

## API Endpoint Updates

Update serializers and views to work with periods:

```python
# serializers.py
class SchemePeriodSerializer(serializers.ModelSerializer):
    scheme_name = serializers.CharField(source='scheme.scheme_name', read_only=True)
    company_name = serializers.CharField(source='scheme.company.company_name', read_only=True)

    class Meta:
        model = SchemePeriod
        fields = [
            'id', 'scheme', 'scheme_name', 'company_name',
            'period_number', 'start_date', 'end_date', 'termination_date',
            'limit_amount', 'is_current', 'renewed_from', 'renewal_date',
            'changes_summary', 'remark', 'status', 'created_at', 'updated_at'
        ]


class SchemeDetailSerializer(serializers.ModelSerializer):
    current_period = SchemePeriodSerializer(source='get_current_period', read_only=True)
    periods = SchemePeriodSerializer(many=True, read_only=True)

    class Meta:
        model = Scheme
        fields = [
            'id', 'scheme_name', 'company', 'card_code', 'description',
            'is_renewable', 'family_applicable', 'remark', 'status',
            'current_period', 'periods', 'created_at', 'updated_at'
        ]


# views.py
class SchemeViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Renew a scheme for a new period."""
        scheme = self.get_object()

        serializer = SchemeRenewalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            new_period = SchemePeriodService.scheme_period_renew(
                scheme_id=scheme.id,
                renewal_data=serializer.validated_data,
                user=request.user
            )
            return Response(
                SchemePeriodSerializer(new_period).data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
```

## Benefits of New Design

1. **No Data Loss**: Complete history preserved for auditing and reporting
2. **Renewable Schemes**: Easy renewal process with change tracking
3. **Historical Queries**: Can query any period for claims/reports
4. **Audit Trail**: Full visibility into scheme changes over time
5. **Flexible Reporting**: Compare periods, track trends, analyze renewals
6. **Non-Renewable Support**: Schemes can be marked as non-renewable
7. **Clean Separation**: Scheme identity separate from time-bound data

## Migration Checklist

- [ ] Run migrations to update models
- [ ] Run data migration to create initial periods
- [ ] Update all code that accesses scheme dates/limits
- [ ] Update serializers to include period data
- [ ] Update API endpoints to work with periods
- [ ] Add renewal endpoint to API
- [ ] Update frontend to display period history
- [ ] Update claims processing to use correct period
- [ ] Add tests for renewal functionality
- [ ] Update documentation

## Testing the Migration

```python
# Test script to verify migration
from apps.schemes.models import Scheme, SchemePeriod

for scheme in Scheme.objects.all():
    # Check each scheme has at least one period
    period_count = scheme.periods.count()
    assert period_count > 0, f"Scheme {scheme.id} has no periods!"

    # Check current period exists
    current = scheme.get_current_period()
    assert current is not None, f"Scheme {scheme.id} has no current period!"

    print(f"✓ {scheme.scheme_name}: {period_count} period(s), current is period {current.period_number}")
```
