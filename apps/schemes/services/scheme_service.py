from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q
from apps.schemes.models import Scheme
from apps.core.enums.choices import BusinessStatusChoices
import csv
from io import StringIO
from typing import Dict, List, Optional, Any

class SchemeService:
    """
    Scheme business logic for write operations.
    Handles all scheme-related write operations including CRUD, validation, 
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def scheme_create(*, scheme_data: dict, user=None):
        """
        Create a new scheme with validation and duplicate checking.
        
        Args:
            scheme_data: Dictionary containing scheme information
            user: User creating the scheme (for audit trail)
            
        Returns:
            Scheme: The created scheme instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        required_fields = ['scheme_name', 'company', 'card_code', 'start_date', 'end_date']
        for field in required_fields:
            if not scheme_data.get(field):
                raise ValidationError(f"{field} is required")
        
        # Date validation
        if scheme_data.get('start_date') and scheme_data.get('end_date'):
            if scheme_data['start_date'] >= scheme_data['end_date']:
                raise ValidationError("End date must be after start date")
        
        # Card code validation
        card_code = scheme_data.get('card_code', '').strip()
        if len(card_code) != 3:
            raise ValidationError("Card code must be exactly 3 characters")
        
        # Check for duplicates
        qs = Scheme.objects.filter(is_deleted=False)
        if qs.filter(
            Q(scheme_name__iexact=scheme_data.get('scheme_name')) | 
            Q(card_code__iexact=card_code)
        ).exists():
            raise ValidationError("Scheme with this name or card code already exists")
        
        # Create scheme
        scheme = Scheme.objects.create(**scheme_data)
        return scheme

    @staticmethod
    @transaction.atomic
    def scheme_update(*, scheme_id: str, update_data: dict, user=None):
        """
        Update scheme with validation and duplicate checking.
        
        Args:
            scheme_id: ID of the scheme to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Scheme: The updated scheme instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise ValidationError("Scheme not found")
        
        # Validate data
        if 'scheme_name' in update_data and not update_data['scheme_name']:
            raise ValidationError("scheme_name is required")
        if 'company' in update_data and not update_data['company']:
            raise ValidationError("company is required")
        if 'card_code' in update_data and not update_data['card_code']:
            raise ValidationError("card_code is required")
        
        # Date validation
        start_date = update_data.get('start_date', scheme.start_date)
        end_date = update_data.get('end_date', scheme.end_date)
        if start_date and end_date and start_date >= end_date:
            raise ValidationError("End date must be after start date")
        
        # Card code validation
        if 'card_code' in update_data:
            card_code = update_data['card_code'].strip()
            if len(card_code) != 3:
                raise ValidationError("Card code must be exactly 3 characters")
        
        # Check for duplicates (excluding current scheme)
        if 'scheme_name' in update_data or 'card_code' in update_data:
            qs = Scheme.objects.filter(is_deleted=False).exclude(id=scheme_id)
            scheme_name = update_data.get('scheme_name', scheme.scheme_name)
            card_code = update_data.get('card_code', scheme.card_code)
            if qs.filter(
                Q(scheme_name__iexact=scheme_name) | Q(card_code__iexact=card_code)
            ).exists():
                raise ValidationError("Another scheme with this name or card code already exists")
        
        # Update fields
        for field, value in update_data.items():
            setattr(scheme, field, value)
        
        scheme.save()
        return scheme

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def scheme_activate(*, scheme_id: str, user=None):
        """
        Reactivate a previously deactivated scheme.
        
        Args:
            scheme_id: ID of the scheme to activate
            user: User performing the activation
            
        Returns:
            Scheme: The activated scheme instance
        """
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise ValidationError("Scheme not found")
        
        scheme.status = BusinessStatusChoices.ACTIVE
        scheme.is_deleted = False
        scheme.deleted_at = None
        scheme.deleted_by = None
        scheme.save(update_fields=['status', 'is_deleted', 'deleted_at', 'deleted_by'])
        return scheme

    @staticmethod
    @transaction.atomic
    def scheme_deactivate(*, scheme_id: str, user=None):
        """
        Soft delete / deactivate scheme.
        
        Args:
            scheme_id: ID of the scheme to deactivate
            user: User performing the deactivation
            
        Returns:
            Scheme: The deactivated scheme instance
        """
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise ValidationError("Scheme not found")
        
        scheme.status = BusinessStatusChoices.INACTIVE
        scheme.is_deleted = True
        scheme.save(update_fields=['status', 'is_deleted'])
        return scheme

    @staticmethod
    @transaction.atomic
    def scheme_suspend(*, scheme_id: str, reason: str, user=None):
        """
        Suspend a scheme with reason tracking.
        
        Args:
            scheme_id: ID of the scheme to suspend
            reason: Reason for suspension
            user: User performing the suspension
            
        Returns:
            Scheme: The suspended scheme instance
        """
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise ValidationError("Scheme not found")
        
        scheme.status = BusinessStatusChoices.SUSPENDED
        suspension_note = f"\nSuspended: {reason}"
        scheme.remark = f"{scheme.remark}{suspension_note}" if scheme.remark else f"Suspended: {reason}"
        scheme.save(update_fields=['status', 'remark'])
        return scheme

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def schemes_bulk_status_update(*, scheme_ids: list, new_status: str, user=None):
        """
        Bulk update scheme status.
        
        Args:
            scheme_ids: List of scheme IDs to update
            new_status: New status to set
            user: User performing the update
            
        Returns:
            int: Number of schemes updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")
        
        updated_count = Scheme.objects.filter(
            id__in=scheme_ids,
            is_deleted=False
        ).update(status=new_status)
        
        return updated_count

    @staticmethod
    def schemes_export_csv(*, filters: dict = None):
        """
        Export filtered schemes to CSV format.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import scheme_list
        
        if filters:
            schemes = scheme_list(filters=filters)
        else:
            schemes = Scheme.objects.filter(is_deleted=False)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Scheme Name', 'Company', 'Card Code', 'Description', 
            'Start Date', 'End Date', 'Termination Date', 'Limit Amount',
            'Family Applicable', 'Status', 'Created At', 'Updated At'
        ])
        
        # Write data
        for scheme in schemes:
            writer.writerow([
                scheme.id,
                scheme.scheme_name,
                scheme.company.company_name if scheme.company else '',
                scheme.card_code,
                scheme.description or '',
                scheme.start_date.strftime('%Y-%m-%d'),
                scheme.end_date.strftime('%Y-%m-%d'),
                scheme.termination_date.strftime('%Y-%m-%d') if scheme.termination_date else '',
                scheme.limit_amount,
                scheme.family_applicable,
                scheme.status,
                scheme.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                scheme.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return output.getvalue()
