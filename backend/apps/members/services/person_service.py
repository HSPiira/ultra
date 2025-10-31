import re
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.core.enums.choices import BusinessStatusChoices, RelationshipChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
    InactiveEntityError,
)
from apps.members.models import Person


class PersonService:
    """Business logic for Person write operations."""

    @staticmethod
    def _generate_card_number(*, scheme, relationship: str, parent=None, company=None):
        """
        Generate card number in format: {card_code}-{member_count:03d}-{member_number:02d}

        For principals (SELF): member_number is always 00
        For dependants: member_number increments (01, 02, etc.) based on parent's dependants
        """
        card_code = scheme.card_code.upper()

        if relationship == RelationshipChoices.SELF:
            # Principal member: find max member_count for this scheme and increment
            # Pattern: {card_code}-{3 digits}-00
            pattern = re.compile(rf"^{re.escape(card_code)}-(\d{{3}})-00$")

            # Get all principals for this scheme
            principals = Person.objects.filter(
                scheme=scheme,
                relationship=RelationshipChoices.SELF,
                is_deleted=False
            ).exclude(
                card_number__isnull=True
            ).values_list('card_number', flat=True)

            max_member_count = 0
            for card in principals:
                match = pattern.match(card.upper())
                if match:
                    member_count = int(match.group(1))
                    max_member_count = max(max_member_count, member_count)

            # Next member count
            next_member_count = max_member_count + 1
            card_number = f"{card_code}-{next_member_count:03d}-00"

        else:
            # Dependant: use parent's member_count, increment member_number
            if not parent:
                raise InvalidValueError("parent", "Parent is required for dependants")

            # Parse parent's card number to get member_count
            parent_pattern = re.compile(rf"^{re.escape(card_code)}-(\d{{3}})-00$")
            parent_match = parent_pattern.match(parent.card_number.upper())

            if not parent_match:
                raise InvalidValueError("parent", "Parent card number format is invalid")

            member_count = int(parent_match.group(1))

            # Find max member_number for dependants of this parent
            # Pattern: {card_code}-{same 3 digits}-{2 digits}
            dependant_pattern = re.compile(rf"^{re.escape(card_code)}-{member_count:03d}-(\d{{2}})$")

            dependants = Person.objects.filter(
                parent=parent,
                is_deleted=False
            ).exclude(
                card_number__isnull=True
            ).values_list('card_number', flat=True)

            max_member_number = 0
            for card in dependants:
                match = dependant_pattern.match(card.upper())
                if match:
                    member_number = int(match.group(1))
                    max_member_number = max(max_member_number, member_number)

            # Next member number (skip 00 as that's for the principal)
            next_member_number = max_member_number + 1
            card_number = f"{card_code}-{member_count:03d}-{next_member_number:02d}"

        return card_number

    @staticmethod
    def get_next_card_number(*, scheme_id: str, relationship: str, parent_id: str = None):
        """
        Get the next card number that would be assigned without creating the person.
        This is used for preview purposes in the frontend.
        """
        from apps.schemes.models import Scheme

        try:
            scheme = Scheme.objects.get(id=scheme_id)
        except Scheme.DoesNotExist:
            raise NotFoundError("Scheme", scheme_id)

        parent = None
        if parent_id:
            try:
                parent = Person.objects.get(id=parent_id)
            except Person.DoesNotExist:
                raise NotFoundError("Person", parent_id)

        return PersonService._generate_card_number(
            scheme=scheme,
            relationship=relationship,
            parent=parent,
            company=None
        )

    @staticmethod
    @transaction.atomic
    def person_create(*, person_data: dict, user=None) -> Person:
        required_fields = [
            "company",
            "scheme",
            "name",
            "gender",
            "relationship",
        ]
        for field in required_fields:
            if not person_data.get(field):
                raise RequiredFieldError(field)

        # Relationship rules: SELF cannot have parent
        if person_data.get(
            "relationship"
        ) == RelationshipChoices.SELF and person_data.get("parent"):
            raise InvalidValueError("parent", "Principal (SELF) cannot have a parent")

        # Validate company is active
        company = person_data.get("company")
        if isinstance(company, str):
            from apps.companies.models import Company
            try:
                company = Company.objects.get(id=company)
                person_data["company"] = company
            except Company.DoesNotExist:
                raise NotFoundError("Company", company)

        if company:
            if company.status != BusinessStatusChoices.ACTIVE or company.is_deleted:
                raise InactiveEntityError("Company", "Company must be active to create a member")

        # Validate scheme is active
        scheme = person_data.get("scheme")
        if isinstance(scheme, str):
            from apps.schemes.models import Scheme
            try:
                scheme = Scheme.objects.get(id=scheme)
                person_data["scheme"] = scheme
            except Scheme.DoesNotExist:
                raise NotFoundError("Scheme", scheme)

        if scheme:
            if scheme.status != BusinessStatusChoices.ACTIVE or scheme.is_deleted:
                raise InactiveEntityError("Scheme", "Scheme must be active to create a member")

        # Validate parent is active (for dependants)
        parent = None
        if person_data.get("parent") and person_data.get("relationship") != RelationshipChoices.SELF:
            parent_id = person_data.get("parent")
            if isinstance(parent_id, str):
                parent = Person.objects.filter(id=parent_id).first()
                if not parent:
                    raise NotFoundError("Person", parent_id)
                if parent.status != BusinessStatusChoices.ACTIVE or parent.is_deleted:
                    raise InactiveEntityError("Person", "Parent member must be active to create a dependant")
                person_data["parent"] = parent
            else:
                parent = parent_id

            # Ensure parent belongs to same company and scheme
            if parent.company_id != company.id:
                raise InvalidValueError("parent", "Parent must belong to the same company")
            if parent.scheme_id != scheme.id:
                raise InvalidValueError("parent", "Parent must belong to the same scheme")
            if parent.relationship != RelationshipChoices.SELF:
                raise InvalidValueError("parent", "Parent must have relationship SELF")

        # Auto-generate card number if not provided
        if not person_data.get("card_number"):
            try:
                generated_card = PersonService._generate_card_number(
                    scheme=scheme,
                    relationship=person_data.get("relationship"),
                    parent=parent,
                    company=company
                )
                person_data["card_number"] = generated_card
            except (InvalidValueError, ValidationError):
                raise
            except Exception as e:
                raise InvalidValueError("card_number", f"Failed to generate card number: {str(e)}")

        # Create person - database unique constraints prevent duplicates atomically
        try:
            person = Person.objects.create(**person_data)
            return person
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Person", [field], f"Person with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'card_number' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Person", ["card_number"], "Card number already exists for this company")
            else:
                raise DuplicateError("Person", message="Person with duplicate unique field already exists")

    @staticmethod
    @transaction.atomic
    def person_update(*, person_id: str, update_data: dict, user=None) -> Person:
        try:
            person = Person.objects.get(id=person_id, is_deleted=False)
        except Person.DoesNotExist:
            raise NotFoundError("Person", person_id)

        if (
            "relationship" in update_data
            and update_data["relationship"] == RelationshipChoices.SELF
            and update_data.get("parent")
        ):
            raise InvalidValueError("parent", "Principal (SELF) cannot have a parent")

        # Validate company is active if being updated
        if "company" in update_data:
            company = update_data["company"]
            if isinstance(company, str):
                from apps.companies.models import Company
                try:
                    company = Company.objects.get(id=company)
                    update_data["company"] = company
                except Company.DoesNotExist:
                    raise NotFoundError("Company", company)

            if company and (company.status != BusinessStatusChoices.ACTIVE or company.is_deleted):
                raise InactiveEntityError("Company", "Company must be active to update a member")

        # Validate scheme is active if being updated
        if "scheme" in update_data:
            scheme = update_data["scheme"]
            if isinstance(scheme, str):
                from apps.schemes.models import Scheme
                try:
                    scheme = Scheme.objects.get(id=scheme)
                    update_data["scheme"] = scheme
                except Scheme.DoesNotExist:
                    raise NotFoundError("Scheme", scheme)

            if scheme and (scheme.status != BusinessStatusChoices.ACTIVE or scheme.is_deleted):
                raise InactiveEntityError("Scheme", "Scheme must be active to update a member")

        # Validate parent is active if being updated (for dependants)
        relationship = update_data.get("relationship", person.relationship)
        if "parent" in update_data and relationship != RelationshipChoices.SELF:
            parent_id = update_data["parent"]
            if parent_id:
                if isinstance(parent_id, str):
                    parent = Person.objects.filter(id=parent_id).first()
                    if not parent:
                        raise NotFoundError("Person", parent_id)
                    if parent.status != BusinessStatusChoices.ACTIVE or parent.is_deleted:
                        raise InactiveEntityError("Person", "Parent member must be active to create a dependant")

        for field, value in update_data.items():
            setattr(person, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            person.save()
            return person
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Person", [field], f"Another person with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'card_number' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Person", ["card_number"], "Card number already exists for this company")
            else:
                raise DuplicateError("Person", message="Person with duplicate unique field already exists")

    @staticmethod
    @transaction.atomic
    def person_deactivate(*, person_id: str, user=None) -> Person:
        try:
            person = Person.objects.get(id=person_id, is_deleted=False)
        except Person.DoesNotExist:
            raise NotFoundError("Person", person_id)

        person.status = BusinessStatusChoices.INACTIVE
        person.is_deleted = True
        person.save(update_fields=["status", "is_deleted"])
        return person

    # ------------------------------------------------------------------
    # Bulk Import
    # ------------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def persons_bulk_import(
        *,
        company_id: str,
        scheme_id: str,
        rows: list[dict[str, Any]],
        user=None,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        """
        Two-pass import: principals, then dependants. Uses member_key/parent_key mapping in payload.
        Upsert on (company, card_number).
        """
        created, updated, skipped = [], [], []
        errors: list[dict[str, Any]] = []

        # Basic validation
        if not company_id or not scheme_id:
            raise RequiredFieldError("company_id or scheme_id")

        # Split rows
        principals = []
        dependants = []
        for idx, row in enumerate(rows):
            rel = row.get("relationship")
            if rel == RelationshipChoices.SELF:
                principals.append((idx, row))
            else:
                dependants.append((idx, row))

        # Load scheme and company once for bulk import
        from apps.schemes.models import Scheme
        from apps.companies.models import Company
        try:
            scheme_obj = Scheme.objects.get(id=scheme_id)
            company_obj = Company.objects.get(id=company_id)
        except Scheme.DoesNotExist:
            raise NotFoundError("Scheme", scheme_id)
        except Company.DoesNotExist:
            raise NotFoundError("Company", company_id)

        key_to_person_id: dict[str, str] = {}

        def normalize_payload(row: dict[str, Any], parent_obj=None) -> dict[str, Any]:
            payload = {
                "company": company_obj,
                "scheme": scheme_obj,
                "name": (row.get("name") or "").strip(),
                "national_id": (row.get("national_id") or "").strip() or None,
                "gender": row.get("gender"),
                "relationship": row.get("relationship"),
                "parent": parent_obj,
                "date_of_birth": row.get("date_of_birth") or None,
                "address": row.get("address") or "",
                "phone_number": (row.get("phone_number") or "").strip(),
                "email": (
                    (row.get("email") or "").lower().strip() if row.get("email") else ""
                ),
            }

            # Auto-generate card number if not provided in bulk import
            card_number = (row.get("card_number") or "").strip()
            if not card_number:
                try:
                    card_number = PersonService._generate_card_number(
                        scheme=scheme_obj,
                        relationship=row.get("relationship"),
                        parent=parent_obj,
                        company=company_obj
                    )
                except Exception as e:
                    raise InvalidValueError("card_number", f"Failed to generate card number: {str(e)}")

            payload["card_number"] = card_number
            return payload

        # Pass 1: principals
        for idx, row in principals:
            try:
                payload = normalize_payload(row, parent_obj=None)
                payload["parent"] = None

                existing = Person.objects.filter(
                    company_id=company_id,
                    card_number__iexact=payload["card_number"],
                    is_deleted=False,
                ).first()

                if existing:
                    # Update minimal fields
                    for f in [
                        "name",
                        "gender",
                        "relationship",
                        "national_id",
                        "date_of_birth",
                        "address",
                        "phone_number",
                        "email",
                        "scheme",
                    ]:
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

                member_key = row.get("member_key")
                if member_key:
                    key_to_person_id[member_key] = person_id
            except Exception as exc:
                errors.append({"row": idx, "error": str(exc)})

        # Pass 2: dependants
        for idx, row in dependants:
            try:
                parent_key = row.get("parent_key")
                if not parent_key or parent_key not in key_to_person_id:
                    raise InvalidValueError(
                        "parent_key", "parent_key missing or does not match any principal member_key"
                    )
                parent_id = key_to_person_id[parent_key]
                parent_obj = Person.objects.get(id=parent_id)

                payload = normalize_payload(row, parent_obj=parent_obj)
                payload["parent"] = parent_obj

                existing = Person.objects.filter(
                    company_id=company_id,
                    card_number__iexact=payload["card_number"],
                    is_deleted=False,
                ).first()

                if existing:
                    for f in [
                        "name",
                        "gender",
                        "relationship",
                        "national_id",
                        "date_of_birth",
                        "address",
                        "phone_number",
                        "email",
                        "scheme",
                        "parent",
                    ]:
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
                errors.append({"row": idx, "error": str(exc)})

        return {
            "created_count": len(set(created)),
            "updated_count": len(set(updated)),
            "skipped_count": len(set(skipped)),
            "errors": errors,
            "dry_run": dry_run,
        }
