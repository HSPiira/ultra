"""
Base service class for common service layer functionality.

Provides abstract methods and utility functions to eliminate code duplication
across service classes. All service classes should inherit from this base class.
"""
from abc import ABC, abstractmethod
from typing import Type, Optional

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.db.models import Model

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InactiveEntityError,
)
from apps.core.utils.integrity import is_unique_constraint_violation
from apps.core.utils.validation import validate_required_fields


class BaseService(ABC):
    """
    Abstract base class for all service classes.
    
    Provides common functionality for:
    - Error handling (ValidationError, IntegrityError)
    - Required field validation
    - Foreign key resolution
    - Status management (activate, deactivate, suspend)
    - Bulk operations
    
    Subclasses must define:
    - entity_model: The Django model class
    - entity_name: Human-readable name for error messages
    """
    
    # Override these in subclasses
    entity_model: Type[Model] = None
    entity_name: str = "Entity"
    unique_fields: list = []  # Fields that should be checked for duplicates
    
    @classmethod
    def _validate_required_fields(cls, data: dict, fields: list):
        """
        Validate required fields using utility function.
        
        Args:
            data: Dictionary containing data to validate
            fields: List of required field names
        """
        validate_required_fields(data, fields, cls.entity_name)
    
    @classmethod
    def _filter_model_fields(cls, data: dict, allowed_fields: set) -> dict:
        """
        Filter data dictionary to only include allowed model fields.
        
        Useful for services that receive extra fields from API requests
        that shouldn't be passed to model constructors.
        
        Args:
            data: Dictionary containing data to filter
            allowed_fields: Set of allowed field names
            
        Returns:
            Filtered dictionary with only allowed fields
        """
        return {k: v for k, v in data.items() if k in allowed_fields}
    
    @classmethod
    def _resolve_foreign_key(
        cls,
        data: dict,
        field_name: str,
        model_class: Type[Model],
        entity_name: str,
        validate_active: bool = True
    ) -> Optional[Model]:
        """
        Resolve a foreign key field from string ID to model instance.
        
        Args:
            data: Dictionary containing the data
            field_name: Name of the field to resolve
            model_class: Model class to resolve to
            entity_name: Name for error messages
            validate_active: Whether to validate entity is active and not deleted
            
        Returns:
            Model instance or None if field not in data
            
        Raises:
            NotFoundError: If entity doesn't exist
            InactiveEntityError: If entity exists but is inactive/deleted
        """
        if field_name not in data:
            return None
        
        value = data[field_name]
        
        # Already a model instance
        if isinstance(value, model_class):
            instance = value
        else:
            # Resolve by ID
            try:
                # If validate_active, use objects manager (filters deleted/inactive)
                # Otherwise use all_objects if available (for soft-deleted entities)
                if validate_active:
                    queryset = model_class.objects
                else:
                    queryset = model_class.all_objects if hasattr(model_class, 'all_objects') else model_class.objects
                instance = queryset.get(id=value)
            except model_class.DoesNotExist:
                raise NotFoundError(entity_name, value)
        
        # Additional validation if validate_active and we used all_objects
        if validate_active:
            # Double-check status (in case objects manager doesn't filter by status)
            if hasattr(instance, 'is_deleted') and instance.is_deleted:
                raise InactiveEntityError(entity_name, f"{entity_name} is deleted")
            if hasattr(instance, 'status') and instance.status != BusinessStatusChoices.ACTIVE:
                raise InactiveEntityError(entity_name, f"{entity_name} must be active")
        
        data[field_name] = instance
        return instance
    
    @classmethod
    def _handle_validation_error(cls, exc: ValidationError) -> None:
        """
        Handle ValidationError and convert to appropriate ServiceError.
        
        Args:
            exc: ValidationError exception
            
        Raises:
            DuplicateError: If validation error is about uniqueness
            ValidationError: Re-raises original if not a uniqueness error
        """
        if hasattr(exc, 'message_dict'):
            for field, messages in exc.message_dict.items():
                if any('already exists' in str(msg).lower() for msg in messages):
                    raise DuplicateError(
                        cls.entity_name,
                        [field],
                        f"{cls.entity_name} with this {field} already exists"
                    ) from exc
        # Not a uniqueness error - re-raise original
        raise exc
    
    @classmethod
    def _handle_integrity_error(cls, exc: IntegrityError) -> None:
        """
        Handle IntegrityError and convert to DuplicateError when appropriate.
        
        Args:
            exc: IntegrityError exception
            
        Raises:
            DuplicateError: If error is about unique constraint violation
            IntegrityError: Re-raises original if not a uniqueness error
        """
        if not is_unique_constraint_violation(exc):
            # Not a uniqueness constraint - re-raise
            raise exc
        
        # Check unique fields to identify the problematic field
        error_msg = str(exc).lower()
        
        for field in cls.unique_fields:
            if field in error_msg:
                raise DuplicateError(
                    cls.entity_name,
                    [field],
                    f"{cls.entity_name} with this {field} already exists"
                ) from exc
        
        # Generic duplicate error
        raise DuplicateError(
            cls.entity_name,
            message=f"{cls.entity_name} with duplicate unique field already exists"
        ) from exc
    
    @classmethod
    def _get_entity(cls, entity_id: str, raise_if_deleted: bool = True):
        """
        Get entity instance by ID.
        
        Args:
            entity_id: ID of the entity
            raise_if_deleted: Whether to raise error if entity is deleted
            
        Returns:
            Model instance
            
        Raises:
            NotFoundError: If entity doesn't exist or is deleted
        """
        queryset = cls.entity_model.objects if raise_if_deleted else cls.entity_model.all_objects
        
        try:
            return queryset.get(id=entity_id, is_deleted=False)
        except cls.entity_model.DoesNotExist:
            raise NotFoundError(cls.entity_name, entity_id)
    
    @classmethod
    @transaction.atomic
    def activate(cls, *, entity_id: str, user=None):
        """
        Activate an entity (set status to ACTIVE, restore if soft-deleted).
        
        Args:
            entity_id: ID of the entity to activate
            user: User performing the activation
            
        Returns:
            Activated entity instance
            
        Raises:
            NotFoundError: If entity doesn't exist
        """
        instance = cls._get_entity(entity_id)
        
        instance.status = BusinessStatusChoices.ACTIVE
        instance.is_deleted = False
        instance.deleted_at = None
        instance.deleted_by = None
        instance.save(update_fields=["status", "is_deleted", "deleted_at", "deleted_by"])
        
        return instance
    
    @classmethod
    @transaction.atomic
    def deactivate(cls, *, entity_id: str, user=None, soft_delete: bool = False):
        """
        Deactivate an entity (set status to INACTIVE, optionally soft-delete).
        
        Args:
            entity_id: ID of the entity to deactivate
            user: User performing the deactivation
            soft_delete: Whether to also soft-delete the entity
            
        Returns:
            Deactivated entity instance
            
        Raises:
            NotFoundError: If entity doesn't exist
        """
        instance = cls._get_entity(entity_id)
        
        instance.status = BusinessStatusChoices.INACTIVE
        update_fields = ["status"]
        
        if soft_delete:
            instance.is_deleted = True
            update_fields.append("is_deleted")
        
        instance.save(update_fields=update_fields)
        return instance
    
    @classmethod
    @transaction.atomic
    def suspend(cls, *, entity_id: str, reason: str = None, user=None):
        """
        Suspend an entity (set status to SUSPENDED).
        
        Args:
            entity_id: ID of the entity to suspend
            reason: Optional reason for suspension
            user: User performing the suspension
            
        Returns:
            Suspended entity instance
            
        Raises:
            NotFoundError: If entity doesn't exist
        """
        instance = cls._get_entity(entity_id)
        
        instance.status = BusinessStatusChoices.SUSPENDED
        update_fields = ["status"]
        
        # Optionally add reason to description field
        if reason and hasattr(instance, 'description'):
            suspension_note = f"\nSuspended: {reason}"
            instance.description = (
                f"{instance.description}{suspension_note}"
                if instance.description
                else f"Suspended: {reason}"
            )
            update_fields.append("description")
        
        instance.save(update_fields=update_fields)
        return instance
    
    @classmethod
    @transaction.atomic
    def bulk_status_update(
        cls,
        *,
        entity_ids: list,
        new_status: str,
        user=None
    ):
        """
        Bulk update status for multiple entities.
        
        Args:
            entity_ids: List of entity IDs to update
            new_status: New status value (must be valid BusinessStatusChoices)
            user: User performing the update
            
        Returns:
            Number of entities updated
            
        Raises:
            InvalidValueError: If new_status is not valid
        """
        from apps.core.exceptions.service_errors import InvalidValueError
        
        # Validate status
        valid_statuses = [choice[0] for choice in BusinessStatusChoices.choices]
        if new_status not in valid_statuses:
            raise InvalidValueError(
                "new_status",
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get entities
        entities = cls.entity_model.objects.filter(
            id__in=entity_ids,
            is_deleted=False
        )
        
        # Update status
        update_count = entities.update(status=new_status)
        
        # If activating, also restore soft-deleted entities
        if new_status == BusinessStatusChoices.ACTIVE:
            entities.update(
                is_deleted=False,
                deleted_at=None,
                deleted_by=None
            )
        
        return update_count
