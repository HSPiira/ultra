# Scheme Items with Period Renewals Guide

## Overview

SchemeItems are now **period-specific** - they link to `SchemePeriod` instead of `Scheme`. This allows tracking changes in:
- Provider networks (hospitals added/removed)
- Service coverage (new services, removed services)
- Copayment percentages (can change per renewal)
- Limit amounts per item (can vary per period)

## Key Changes

### Before (Old Design)
```python
class SchemeItem(BaseModel):
    scheme = models.ForeignKey(Scheme, ...)  # ❌ Scheme-level
```

**Problem**: When scheme renews, you'd have to either:
- Keep old items (but they might not apply to new period)
- Delete old items (lose historical data)
- Update items (overwrite history)

### After (New Design)
```python
class SchemeItem(BaseModel):
    scheme_period = models.ForeignKey(SchemePeriod, ...)  # ✅ Period-specific
```

**Benefits**:
- Each period has its own set of items
- Historical data preserved (know what was covered in 2024 vs 2025)
- Can query items for any past period
- Renewal can modify coverage without data loss

## Working with Scheme Items

### Creating Items for Initial Period

```python
from apps.schemes.services.scheme_period_service import SchemePeriodService
from apps.schemes.models import SchemeItem, SchemePeriod
from apps.providers.models import Hospital
from apps.medical_catalog.models import Service
from django.contrib.contenttypes.models import ContentType

# 1. Create scheme and initial period
scheme = SchemeService.scheme_create(...)
period = SchemePeriodService.scheme_period_create_initial(
    scheme_id=scheme.id,
    period_data={...}
)

# 2. Add hospitals to this period
hospital = Hospital.objects.get(...)
SchemeItem.objects.create(
    scheme_period=period,
    content_type=ContentType.objects.get_for_model(Hospital),
    object_id=hospital.id,
    limit_amount=Decimal("100000.00"),
    copayment_percent=Decimal("10.00"),
)

# 3. Add covered services
service = Service.objects.get(...)
SchemeItem.objects.create(
    scheme_period=period,
    content_type=ContentType.objects.get_for_model(Service),
    object_id=service.id,
    limit_amount=Decimal("5000.00"),
    copayment_percent=Decimal("20.00"),
)
```

### Renewing a Scheme with Items

When renewing, you have **three strategies**:

#### Strategy 1: Copy All Items (Most Common)
Copy all items from previous period, optionally with modifications:

```python
def renew_scheme_with_items(scheme_id, renewal_data, copy_items=True,
                           item_modifications=None, user=None):
    """
    Renew scheme and optionally copy items from previous period.

    Args:
        scheme_id: Scheme to renew
        renewal_data: New period data (dates, limit_amount)
        copy_items: Whether to copy items from previous period
        item_modifications: Dict of changes to apply to copied items
            e.g., {"copayment_percent": Decimal("15.00")}
        user: User performing renewal
    """
    from apps.schemes.services.scheme_period_service import SchemePeriodService
    from apps.schemes.selectors.scheme_period_selector import scheme_period_current_get

    # Get current period before renewal
    current_period = scheme_period_current_get(scheme_id=scheme_id)

    # Create new period
    new_period = SchemePeriodService.scheme_period_renew(
        scheme_id=scheme_id,
        renewal_data=renewal_data,
        user=user
    )

    # Copy items if requested
    if copy_items and current_period:
        items_to_copy = SchemeItem.objects.filter(
            scheme_period=current_period,
            is_deleted=False
        )

        for old_item in items_to_copy:
            # Create new item for new period
            new_item_data = {
                'scheme_period': new_period,
                'content_type': old_item.content_type,
                'object_id': old_item.object_id,
                'limit_amount': old_item.limit_amount,
                'copayment_percent': old_item.copayment_percent,
            }

            # Apply modifications if provided
            if item_modifications:
                new_item_data.update(item_modifications)

            SchemeItem.objects.create(**new_item_data)

    return new_period

# Usage
new_period = renew_scheme_with_items(
    scheme_id=scheme.id,
    renewal_data={
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "limit_amount": Decimal("60000.00"),
    },
    copy_items=True,
    item_modifications={
        "copayment_percent": Decimal("15.00"),  # Increase copay for all items
    },
    user=request.user
)
```

#### Strategy 2: Selective Copy
Copy only specific items, exclude others:

```python
def renew_scheme_selective(scheme_id, renewal_data,
                           include_content_types=None,
                           exclude_object_ids=None,
                           user=None):
    """
    Renew scheme with selective item copying.

    Args:
        scheme_id: Scheme to renew
        renewal_data: New period data
        include_content_types: List of content types to include
            e.g., [ContentType.objects.get_for_model(Hospital)]
        exclude_object_ids: List of specific object IDs to exclude
        user: User performing renewal
    """
    from apps.schemes.services.scheme_period_service import SchemePeriodService
    from apps.schemes.selectors.scheme_period_selector import scheme_period_current_get

    current_period = scheme_period_current_get(scheme_id=scheme_id)
    new_period = SchemePeriodService.scheme_period_renew(
        scheme_id=scheme_id,
        renewal_data=renewal_data,
        user=user
    )

    if current_period:
        items = SchemeItem.objects.filter(
            scheme_period=current_period,
            is_deleted=False
        )

        # Filter by content type if specified
        if include_content_types:
            items = items.filter(content_type__in=include_content_types)

        # Exclude specific objects if specified
        if exclude_object_ids:
            items = items.exclude(object_id__in=exclude_object_ids)

        # Copy filtered items
        for item in items:
            SchemeItem.objects.create(
                scheme_period=new_period,
                content_type=item.content_type,
                object_id=item.object_id,
                limit_amount=item.limit_amount,
                copayment_percent=item.copayment_percent,
            )

    return new_period

# Usage: Copy only hospitals, exclude specific hospital
from django.contrib.contenttypes.models import ContentType
from apps.providers.models import Hospital

new_period = renew_scheme_selective(
    scheme_id=scheme.id,
    renewal_data={...},
    include_content_types=[ContentType.objects.get_for_model(Hospital)],
    exclude_object_ids=["hospital_id_to_exclude"],
    user=request.user
)
```

#### Strategy 3: Fresh Start
Don't copy items, manually add new ones:

```python
# Just renew without copying
new_period = SchemePeriodService.scheme_period_renew(
    scheme_id=scheme.id,
    renewal_data={...},
    user=request.user
)

# Manually add new items
new_hospital = Hospital.objects.get(...)
SchemeItem.objects.create(
    scheme_period=new_period,
    content_type=ContentType.objects.get_for_model(Hospital),
    object_id=new_hospital.id,
    limit_amount=Decimal("120000.00"),
)
```

## Querying Items

### Get Items for Current Period

```python
from apps.schemes.selectors.scheme_period_selector import scheme_period_current_get

# Get current period
current_period = scheme_period_current_get(scheme_id=scheme.id)

# Get items for current period
if current_period:
    current_items = SchemeItem.objects.filter(
        scheme_period=current_period,
        is_deleted=False
    )

    # Get just hospitals
    hospitals = current_items.for_hospital()

    # Get just services
    services = current_items.for_service()
```

### Get Items for Historical Period

```python
from apps.schemes.selectors.scheme_period_selector import scheme_period_on_date_get

# What was covered on June 15, 2024?
historical_period = scheme_period_on_date_get(
    scheme_id=scheme.id,
    when_date=date(2024, 6, 15)
)

if historical_period:
    historical_items = SchemeItem.objects.filter(
        scheme_period=historical_period,
        is_deleted=False
    )
    print(f"On 2024-06-15, scheme covered {historical_items.count()} items")
```

### Get All Items Across All Periods

```python
# Get all items for a scheme (across all periods)
all_items = SchemeItem.objects.for_scheme(scheme.id)

# Get unique providers that have EVER been covered
from django.contrib.contenttypes.models import ContentType
from apps.providers.models import Hospital

hospital_ct = ContentType.objects.get_for_model(Hospital)
all_hospitals = all_items.filter(content_type=hospital_ct).values_list('object_id', flat=True).distinct()
```

### Compare Items Between Periods

```python
def compare_period_items(period1_id, period2_id):
    """Compare what changed between two periods."""

    items1 = set(SchemeItem.objects.filter(scheme_period_id=period1_id).values_list(
        'content_type_id', 'object_id'
    ))

    items2 = set(SchemeItem.objects.filter(scheme_period_id=period2_id).values_list(
        'content_type_id', 'object_id'
    ))

    added = items2 - items1
    removed = items1 - items2
    kept = items1 & items2

    return {
        'added': len(added),
        'removed': len(removed),
        'kept': len(kept),
        'total_period1': len(items1),
        'total_period2': len(items2),
    }

# Usage
comparison = compare_period_items(old_period.id, new_period.id)
print(f"Added {comparison['added']} items, removed {comparison['removed']} items")
```

## Claims Processing with Period-Specific Items

```python
def validate_claim_coverage(claim):
    """Validate if claim is covered based on period-specific items."""
    from apps.schemes.selectors.scheme_period_selector import scheme_period_on_date_get

    # Find period active on claim date
    period = scheme_period_on_date_get(
        scheme_id=claim.scheme_id,
        when_date=claim.claim_date
    )

    if not period:
        raise ValidationError("No active scheme period for this claim date")

    # Check if service/provider is covered in this period
    service_ct = ContentType.objects.get_for_model(claim.service)

    try:
        item = SchemeItem.objects.get(
            scheme_period=period,
            content_type=service_ct,
            object_id=claim.service.id,
            is_deleted=False
        )

        # Apply period-specific limits and copayments
        if claim.amount > item.limit_amount:
            raise ValidationError(
                f"Claim exceeds limit of {item.limit_amount} for this period"
            )

        copayment = claim.amount * (item.copayment_percent / 100)
        covered_amount = claim.amount - copayment

        return {
            "covered": True,
            "copayment": copayment,
            "covered_amount": covered_amount,
            "period": period.period_number,
        }

    except SchemeItem.DoesNotExist:
        return {
            "covered": False,
            "reason": "Service not covered in this period",
            "period": period.period_number,
        }
```

## Migration from Old SchemeItems

If you have existing SchemeItems that reference Scheme directly:

```python
# Create data migration
# apps/schemes/migrations/XXXX_migrate_scheme_items_to_periods.py

def migrate_scheme_items_to_periods(apps, schema_editor):
    """
    Migrate existing SchemeItems to reference current SchemePeriod.
    """
    SchemeItem = apps.get_model('schemes', 'SchemeItem')
    SchemePeriod = apps.get_model('schemes', 'SchemePeriod')

    for item in SchemeItem.objects.all():
        # Find current period for this scheme
        current_period = SchemePeriod.objects.filter(
            scheme=item.scheme,
            is_current=True
        ).first()

        if current_period:
            # Update item to reference period
            item.scheme_period = current_period
            item.save(update_fields=['scheme_period'])
            print(f"✓ Migrated item {item.id} to period {current_period.id}")
        else:
            print(f"⚠️ No current period found for scheme {item.scheme.id}")
```

## Best Practices

1. **Always Copy Items on Renewal** - Unless coverage significantly changes, copy previous items
2. **Track Changes** - Store what changed in `SchemePeriod.changes_summary`
3. **Validate Dates** - Ensure items only reference active periods
4. **Audit Trail** - Keep soft-deleted items for historical records
5. **Query Efficiently** - Use `select_related('scheme_period__scheme')` for performance
6. **Document Changes** - Add remarks when modifying copayments/limits during renewal

## API Endpoints Example

```python
# views.py
class SchemePeriodViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def renew_with_items(self, request, pk=None):
        """Renew scheme period and optionally copy items."""
        scheme = get_object_or_404(Scheme, pk=pk)

        serializer = SchemeRenewalWithItemsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        renewal_data = serializer.validated_data.get('renewal_data')
        copy_items = serializer.validated_data.get('copy_items', True)
        item_modifications = serializer.validated_data.get('item_modifications', {})

        new_period = renew_scheme_with_items(
            scheme_id=scheme.id,
            renewal_data=renewal_data,
            copy_items=copy_items,
            item_modifications=item_modifications,
            user=request.user
        )

        return Response(
            SchemePeriodSerializer(new_period).data,
            status=status.HTTP_201_CREATED
        )
```
