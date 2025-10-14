from typing import List, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q

from apps.members.models import Person
from apps.core.enums.choices import RelationshipChoices, BusinessStatusChoices


class PersonService:
    """Business logic for Person write operations."""

    @staticmethod
    @transaction.atomic
    def person_create(*, person_data: dict, user=None) -> Person:
        required_fields = ['company', 'scheme', 'name', 'gender', 'relationship', 'card_number']
        for field in required_fields:
            if not person_data.get(field):
                raise ValidationError(f"{field} is required")

        # Relationship rules: SELF cannot have parent
        if person_data.get('relationship') == RelationshipChoices.SELF and person_data.get('parent'):
            raise ValidationError("Principal (SELF) cannot have a parent")

        # Per-company card uniqueness is enforced by DB; pre-check to return nicer error
        if Person.objects.filter(
            company_id=person_data.get('company'),
            card_number__iexact=person_data.get('card_number'),
            is_deleted=False,
        ).exists():
            raise ValidationError("Card number already exists for this company")

        person = Person.objects.create(**person_data)
        return person

    @staticmethod
    @transaction.atomic
    def person_update(*, person_id: str, update_data: dict, user=None) -> Person:
        try:
            person = Person.objects.get(id=person_id, is_deleted=False)
        except Person.DoesNotExist:
            raise ValidationError("Person not found")

        if 'relationship' in update_data and update_data['relationship'] == RelationshipChoices.SELF and update_data.get('parent'):
            raise ValidationError("Principal (SELF) cannot have a parent")

        # Card uniqueness check if card_number/company change
        new_company = update_data.get('company', person.company_id)
        new_card = update_data.get('card_number', person.card_number)
        if (new_company != person.company_id) or (new_card != person.card_number):
            if Person.objects.filter(
                company_id=new_company,
                card_number__iexact=new_card,
                is_deleted=False
            ).exclude(id=person.id).exists():
                raise ValidationError("Card number already exists for this company")

        for field, value in update_data.items():
            setattr(person, field, value)

        person.save()
        return person

    @staticmethod
    @transaction.atomic
    def person_deactivate(*, person_id: str, user=None) -> Person:
        try:
            person = Person.objects.get(id=person_id, is_deleted=False)
        except Person.DoesNotExist:
            raise ValidationError("Person not found")

        person.status = BusinessStatusChoices.INACTIVE
        person.is_deleted = True
        person.save(update_fields=['status', 'is_deleted'])
        return person

    # ------------------------------------------------------------------
    # Bulk Import
    # ------------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def persons_bulk_import(*, company_id: str, scheme_id: str, rows: List[Dict[str, Any]], user=None, dry_run: bool = False) -> Dict[str, Any]:
        """
        Two-pass import: principals, then dependants. Uses member_key/parent_key mapping in payload.
        Upsert on (company, card_number).
        """
        created, updated, skipped = [], [], []
        errors: List[Dict[str, Any]] = []

        # Basic validation
        if not company_id or not scheme_id:
            raise ValidationError("company and scheme are required")

        # Split rows
        principals = []
        dependants = []
        for idx, row in enumerate(rows):
            rel = row.get('relationship')
            if rel == RelationshipChoices.SELF:
                principals.append((idx, row))
            else:
                dependants.append((idx, row))

        key_to_person_id: Dict[str, str] = {}

        def normalize_payload(row: Dict[str, Any]) -> Dict[str, Any]:
            return {
                'company': company_id,
                'scheme': scheme_id,
                'name': (row.get('name') or '').strip(),
                'national_id': (row.get('national_id') or '').strip() or None,
                'gender': row.get('gender'),
                'relationship': row.get('relationship'),
                'parent': row.get('parent'),  # will be replaced for dependants
                'date_of_birth': row.get('date_of_birth') or None,
                'card_number': (row.get('card_number') or '').strip(),
                'address': row.get('address') or '',
                'phone_number': (row.get('phone_number') or '').strip(),
                'email': (row.get('email') or '').lower().strip() if row.get('email') else '',
            }

        # Pass 1: principals
        for idx, row in principals:
            try:
                payload = normalize_payload(row)
                payload['parent'] = None

                existing = Person.objects.filter(
                    company_id=company_id,
                    card_number__iexact=payload['card_number'],
                    is_deleted=False,
                ).first()

                if existing:
                    # Update minimal fields
                    for f in ['name', 'gender', 'relationship', 'national_id', 'date_of_birth', 'address', 'phone_number', 'email', 'scheme']:
                        setattr(existing, f, payload.get(f, getattr(existing, f)))
                    if not dry_run:
                        existing.save()
                    updated.append(existing.id)
                    person_id = existing.id
                else:
                    if not dry_run:
                        person = Person.objects.create(**payload)
                        created.append(person.id)
                        person_id = person.id
                    else:
                        person_id = f"dryrun-{idx}"

                member_key = row.get('member_key')
                if member_key:
                    key_to_person_id[member_key] = person_id
            except Exception as exc:
                errors.append({'row': idx, 'error': str(exc)})

        # Pass 2: dependants
        for idx, row in dependants:
            try:
                payload = normalize_payload(row)
                parent_key = row.get('parent_key')
                if not parent_key or parent_key not in key_to_person_id:
                    raise ValidationError("parent_key missing or does not match any principal member_key")
                parent_id = key_to_person_id[parent_key]
                payload['parent'] = parent_id

                existing = Person.objects.filter(
                    company_id=company_id,
                    card_number__iexact=payload['card_number'],
                    is_deleted=False,
                ).first()

                if existing:
                    for f in ['name', 'gender', 'relationship', 'national_id', 'date_of_birth', 'address', 'phone_number', 'email', 'scheme', 'parent']:
                        setattr(existing, f, payload.get(f, getattr(existing, f)))
                    if not dry_run:
                        existing.save()
                    updated.append(existing.id)
                else:
                    if not dry_run:
                        person = Person.objects.create(**payload)
                        created.append(person.id)
                    else:
                        skipped.append(idx)
            except Exception as exc:
                errors.append({'row': idx, 'error': str(exc)})

        return {
            'created_count': len(set(created)),
            'updated_count': len(set(updated)),
            'skipped_count': len(set(skipped)),
            'errors': errors,
            'dry_run': dry_run,
        }


