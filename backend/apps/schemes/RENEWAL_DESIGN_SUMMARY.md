# Scheme Renewal Design - Complete Solution

## Problem Statement

Original design had schemes with embedded dates and limits:
```python
class Scheme:
    start_date, end_date, limit_amount  # ❌ Gets overwritten on renewal
```

**Issues**:
- Renewals overwrote historical data
- No audit trail of past periods
- Claims couldn't reference historical coverage
- Provider/service coverage changes lost

## Solution: Period-Based Architecture

### New Model Structure

```
Scheme (Master Entity)
  ├── scheme_name
  ├── company
  ├── card_code (unique identifier)
  ├── is_renewable
  └── periods (one-to-many) ─┐
                              │
                              ▼
                    SchemePeriod (Time-bound data)
                      ├── period_number (1, 2, 3...)
                      ├── start_date, end_date
                      ├── limit_amount
                      ├── renewed_from (FK to previous period)
                      ├── is_current (boolean flag)
                      ├── changes_summary (JSON)
                      └── items (one-to-many) ─┐
                                                │
                                                ▼
                                      SchemeItem (Coverage details)
                                        ├── scheme_period (FK)
                                        ├── content_type + object_id (generic FK)
                                        ├── limit_amount (per item)
                                        └── copayment_percent
```

## Key Design Decisions

### 1. Scheme → Master Entity
- Contains **identity** data that doesn't change across renewals
- Fields: `scheme_name`, `company`, `card_code`, `is_renewable`, `family_applicable`
- No date/limit fields (moved to SchemePeriod)

### 2. SchemePeriod → Time-Bound Data
- Contains **temporal** data that varies per period
- Fields: `period_number`, `start_date`, `end_date`, `limit_amount`, `is_current`
- Linked chain: `renewed_from` creates audit trail
- JSON field `changes_summary` tracks modifications

### 3. SchemeItem → Period-Specific Coverage
- **Changed from FK to Scheme → FK to SchemePeriod**
- Allows provider networks to change per renewal
- Allows copayments/limits to vary per period
- Preserves historical coverage data

## Data Integrity Features

### No Data Loss
- Old periods remain in database (soft delete support)
- Complete audit trail via `renewed_from` chain
- Historical queries: "What was covered in Jan 2024?"

### Renewal Chain
```
Period 1 (2024) ← renewed_from ─ Period 2 (2025) ← renewed_from ─ Period 3 (2026)
  is_current=False                  is_current=False                  is_current=True
```

### Change Tracking
```json
// Period 2's changes_summary
{
  "limit_amount": {"from": "50000.00", "to": "60000.00"},
  "end_date": {"from": "2024-12-31", "to": "2025-12-31"}
}
```

## Usage Patterns

### Creating New Scheme
```python
# 1. Create master scheme
scheme = SchemeService.scheme_create({
    "scheme_name": "Gold Plan",
    "company": company_id,
    "card_code": "GLD",
    "is_renewable": True,
})

# 2. Create initial period
period = SchemePeriodService.scheme_period_create_initial(
    scheme_id=scheme.id,
    period_data={
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "limit_amount": Decimal("50000.00"),
    }
)

# 3. Add coverage items
SchemeItem.objects.create(
    scheme_period=period,
    content_type=hospital_ct,
    object_id=hospital.id,
)
```

### Renewing Scheme
```python
# Renew for next year
new_period = SchemePeriodService.scheme_period_renew(
    scheme_id=scheme.id,
    renewal_data={
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "limit_amount": Decimal("60000.00"),  # Increased
    }
)

# Old period automatically marked is_current=False
# New period becomes current
# Renewal chain: Period 1 ← Period 2
```

### Copying Items on Renewal
```python
# Copy all items from previous period
current_items = SchemeItem.objects.filter(
    scheme_period=old_period
)

for item in current_items:
    SchemeItem.objects.create(
        scheme_period=new_period,
        content_type=item.content_type,
        object_id=item.object_id,
        limit_amount=item.limit_amount * 1.1,  # 10% increase
        copayment_percent=item.copayment_percent,
    )
```

### Querying Data

#### Current Period
```python
current = scheme.get_current_period()
current_items = current.items.all()
```

#### Historical Period
```python
period = scheme.get_period_on_date(date(2024, 6, 15))
items_then = period.items.all()
```

#### All History
```python
all_periods = scheme.periods.order_by('period_number')
for period in all_periods:
    print(f"Period {period.period_number}: {period.start_date} - {period.end_date}")
```

## Claims Processing Impact

### Before (Problematic)
```python
# Could only check against current scheme data
if claim.amount <= scheme.limit_amount:  # ❌ Wrong for old claims!
    approve()
```

### After (Correct)
```python
# Find period active when claim occurred
period = scheme.get_period_on_date(claim.claim_date)

# Use period-specific data
if claim.amount <= period.limit_amount:
    # Check if item was covered in that period
    item = SchemeItem.objects.get(
        scheme_period=period,
        content_type=service_ct,
        object_id=claim.service_id
    )
    copayment = claim.amount * (item.copayment_percent / 100)
    approve(copayment)
```

## Migration Strategy

### Phase 1: Models
1. Create `SchemePeriod` model ✅
2. Update `Scheme` model (remove date/limit fields) ✅
3. Update `SchemeItem` FK from Scheme → SchemePeriod ✅
4. Update managers and helper methods ✅

### Phase 2: Data Migration
1. Create migrations with Django
2. Write data migration to create initial periods from existing schemes
3. Migrate existing SchemeItems to reference current periods

### Phase 3: Code Updates
1. Update selectors to query periods ✅
2. Update services to work with periods ✅
3. Update serializers to include period data
4. Update views/APIs to expose renewal endpoints
5. Update claims processing logic

### Phase 4: Testing
1. Test renewal workflow
2. Test historical queries
3. Test claims with historical periods
4. Test item copying on renewal

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Data Loss** | ❌ Overwrites history | ✅ Complete preservation |
| **Renewals** | ❌ Manual overwrite | ✅ Automated with chain |
| **Historical Queries** | ❌ Impossible | ✅ Query any past period |
| **Item Changes** | ❌ Lost on renewal | ✅ Period-specific tracking |
| **Claims Processing** | ❌ Wrong for old claims | ✅ Correct historical data |
| **Audit Trail** | ❌ None | ✅ Full chain with changes |
| **Reporting** | ❌ Current data only | ✅ Trends, comparisons |

## API Design

### Endpoints

```
GET    /api/schemes/{id}/                    # Scheme with current period
GET    /api/schemes/{id}/periods/            # All periods
GET    /api/schemes/{id}/periods/current/    # Current period only
GET    /api/schemes/{id}/periods/{num}/      # Specific period
POST   /api/schemes/{id}/renew/              # Create renewal
GET    /api/scheme-periods/{id}/items/       # Items for period
POST   /api/scheme-periods/{id}/copy-items/  # Copy items from previous
```

### Response Examples

#### Scheme Detail (includes current period)
```json
{
  "id": "abc123",
  "scheme_name": "Gold Health Plan",
  "company": "comp456",
  "card_code": "GLD",
  "is_renewable": true,
  "current_period": {
    "id": "per789",
    "period_number": 2,
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "limit_amount": "60000.00",
    "is_current": true,
    "changes_summary": {
      "limit_amount": {"from": "50000.00", "to": "60000.00"}
    }
  },
  "total_periods": 2
}
```

#### Period List (history)
```json
{
  "results": [
    {
      "id": "per789",
      "period_number": 2,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "is_current": true,
      "items_count": 15
    },
    {
      "id": "per456",
      "period_number": 1,
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "is_current": false,
      "items_count": 12
    }
  ]
}
```

## Frontend Impact

### UI Components Needed
1. **Scheme Details Page**: Show current period prominently
2. **Period History Tab**: List all past periods with expand/collapse
3. **Renewal Modal**: Form to create new period
4. **Item Management**: Period-specific item configuration
5. **Comparison View**: Side-by-side period comparison

### Example UI Flow
```
Scheme Detail Page
├── Overview (scheme-level data)
├── Current Period
│   ├── Dates: Jan 1, 2025 - Dec 31, 2025
│   ├── Limit: $60,000
│   ├── [Renew Button] ← Opens renewal modal
│   └── Covered Items (15)
│       ├── Hospital A - $100k limit, 10% copay
│       └── Service X - $5k limit, 20% copay
└── History Tab
    ├── Period 2 (2025) - Current
    ├── Period 1 (2024) - [View Details] [Compare]
    └── [Show Changes Between Periods]
```

## Testing Checklist

- [ ] Create scheme with initial period
- [ ] Renew scheme (creates Period 2)
- [ ] Renew again (creates Period 3)
- [ ] Query current period
- [ ] Query historical period by date
- [ ] Get complete renewal chain
- [ ] Add items to initial period
- [ ] Copy items on renewal
- [ ] Modify items on renewal
- [ ] Process claim with current period
- [ ] Process claim with historical period
- [ ] Prevent deletion when items exist
- [ ] Prevent renewal of non-renewable scheme
- [ ] Compare items between periods
- [ ] Get statistics across all periods
- [ ] Find schemes expiring soon
- [ ] Terminate period early
- [ ] API endpoints return correct data

## Files Created

1. `models/scheme_period.py` - SchemePeriod model
2. `selectors/scheme_period_selector.py` - Period queries
3. `services/scheme_period_service.py` - Period operations
4. `SCHEME_RENEWAL_MIGRATION.md` - Migration guide
5. `SCHEME_ITEMS_RENEWAL_GUIDE.md` - Items handling guide
6. `RENEWAL_DESIGN_SUMMARY.md` - This file

## Next Steps

1. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Create Data Migration** (see SCHEME_RENEWAL_MIGRATION.md)

3. **Update Existing Code**
   - Replace `scheme.start_date` → `scheme.get_current_period().start_date`
   - Replace `scheme.limit_amount` → `scheme.get_current_period().limit_amount`
   - Update claims processing to use period lookup

4. **Add API Endpoints**
   - Scheme renewal endpoint
   - Period management endpoints
   - Item copying utilities

5. **Update Frontend**
   - Period history display
   - Renewal workflow UI
   - Item management per period

6. **Write Tests**
   - Unit tests for models
   - Integration tests for services
   - API tests for endpoints

## Questions & Answers

**Q: What happens to members? Do they reference Scheme or SchemePeriod?**
A: Members reference **Scheme** (master entity). They don't need period-specific data since enrollment is scheme-level. Claims use periods for coverage validation.

**Q: Can I delete old periods?**
A: Soft delete is supported, but **not recommended**. Keep periods for historical queries, auditing, and claims processing.

**Q: Can periods overlap?**
A: Technically yes, but **not recommended**. Use `termination_date` to cleanly separate periods.

**Q: How do I handle mid-year changes?**
A: Terminate current period early and create new one. Or use `scheme_period_update()` for minor adjustments.

**Q: What if I don't want renewals?**
A: Set `scheme.is_renewable = False`. System will prevent calling `scheme_period_renew()`.

**Q: How do I revert a renewal?**
A: Soft delete the new period and restore `is_current=True` on previous period. (Add a service method for this.)

## Conclusion

This design provides:
- ✅ Zero data loss on renewals
- ✅ Complete audit trail
- ✅ Flexible item management
- ✅ Historical query support
- ✅ Clean separation of concerns
- ✅ Scalable for complex scenarios

The period-based architecture is a **proven pattern** used by insurance systems, SaaS subscriptions, and any domain requiring temporal data management without losing history.
