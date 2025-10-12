from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q
from apps.schemes.models import Benefit
from apps.core.enums.choices import BusinessStatusChoices
import csv
from io import StringIO
from typing import Dict, List, Optional, Any

class BenefitService:
    """
    Benefit business logic for write operations.
    Handles all benefit-related write operations including CRUD, validation, 
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def benefit_create(*, benefit_data: dict, user=None):
        """
        Create a new benefit with validation and duplicate checking.
        
        Args:
            benefit_data: Dictionary containing benefit information
            user: User creating the benefit (for audit trail)
            
        Returns:
            Benefit: The created benefit instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        required_fields = ['benefit_name', 'in_or_out_patient']
        for field in required_fields:
            if not benefit_data.get(field):
                raise ValidationError(f"{field} is required")
        
        # Benefit name validation
        benefit_name = benefit_data.get('benefit_name', '').strip()
        if len(benefit_name) < 2:
            raise ValidationError("Benefit name must be at least 2 characters long")
        if len(benefit_name) > 255:
            raise ValidationError("Benefit name cannot exceed 255 characters")
        
        # Description validation
        if benefit_data.get('description') and len(benefit_data['description']) > 500:
            raise ValidationError("Description cannot exceed 500 characters")
        
        # Patient type validation
        valid_patient_types = ['INPATIENT', 'OUTPATIENT', 'BOTH']
        if benefit_data.get('in_or_out_patient') not in valid_patient_types:
            raise ValidationError("Invalid patient type")
        
        # Limit amount validation
        if benefit_data.get('limit_amount') is not None and benefit_data['limit_amount'] < 0:
            raise ValidationError("Limit amount cannot be negative")
        
        # Check for duplicates (unique together: benefit_name, in_or_out_patient)
        qs = Benefit.objects.filter(is_deleted=False)
        if qs.filter(
            benefit_name__iexact=benefit_name,
            in_or_out_patient=benefit_data.get('in_or_out_patient')
        ).exists():
            raise ValidationError("Benefit with this name and patient type already exists")
        
        # Create benefit
        benefit = Benefit.objects.create(**benefit_data)
        return benefit

    @staticmethod
    @transaction.atomic
    def benefit_update(*, benefit_id: str, update_data: dict, user=None):
        """
        Update benefit with validation and duplicate checking.
        
        Args:
            benefit_id: ID of the benefit to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Benefit: The updated benefit instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist:
            raise ValidationError("Benefit not found")
        
        # Validate data
        if 'benefit_name' in update_data:
            benefit_name = update_data['benefit_name'].strip()
            if len(benefit_name) < 2:
                raise ValidationError("Benefit name must be at least 2 characters long")
            if len(benefit_name) > 255:
                raise ValidationError("Benefit name cannot exceed 255 characters")
        
        if 'description' in update_data and update_data['description'] and len(update_data['description']) > 500:
            raise ValidationError("Description cannot exceed 500 characters")
        
        if 'in_or_out_patient' in update_data:
            valid_patient_types = ['INPATIENT', 'OUTPATIENT', 'BOTH']
            if update_data['in_or_out_patient'] not in valid_patient_types:
                raise ValidationError("Invalid patient type")
        
        if 'limit_amount' in update_data and update_data['limit_amount'] is not None and update_data['limit_amount'] < 0:
            raise ValidationError("Limit amount cannot be negative")
        
        # Check for duplicates (excluding current benefit)
        if 'benefit_name' in update_data or 'in_or_out_patient' in update_data:
            qs = Benefit.objects.filter(is_deleted=False).exclude(id=benefit_id)
            benefit_name = update_data.get('benefit_name', benefit.benefit_name)
            patient_type = update_data.get('in_or_out_patient', benefit.in_or_out_patient)
            if qs.filter(
                benefit_name__iexact=benefit_name,
                in_or_out_patient=patient_type
            ).exists():
                raise ValidationError("Another benefit with this name and patient type already exists")
        
        # Update fields
        for field, value in update_data.items():
            setattr(benefit, field, value)
        
        benefit.save()
        return benefit

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def benefit_activate(*, benefit_id: str, user=None):
        """
        Reactivate a previously deactivated benefit.
        
        Args:
            benefit_id: ID of the benefit to activate
            user: User performing the activation
            
        Returns:
            Benefit: The activated benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist:
            raise ValidationError("Benefit not found")
        
        benefit.status = BusinessStatusChoices.ACTIVE
        benefit.is_deleted = False
        benefit.deleted_at = None
        benefit.deleted_by = None
        benefit.save(update_fields=['status', 'is_deleted', 'deleted_at', 'deleted_by'])
        return benefit

    @staticmethod
    @transaction.atomic
    def benefit_deactivate(*, benefit_id: str, user=None):
        """
        Soft delete / deactivate benefit.
        
        Args:
            benefit_id: ID of the benefit to deactivate
            user: User performing the deactivation
            
        Returns:
            Benefit: The deactivated benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist:
            raise ValidationError("Benefit not found")
        
        benefit.status = BusinessStatusChoices.INACTIVE
        benefit.is_deleted = True
        benefit.save(update_fields=['status', 'is_deleted'])
        return benefit

    @staticmethod
    @transaction.atomic
    def benefit_suspend(*, benefit_id: str, reason: str, user=None):
        """
        Suspend a benefit with reason tracking.
        
        Args:
            benefit_id: ID of the benefit to suspend
            reason: Reason for suspension
            user: User performing the suspension
            
        Returns:
            Benefit: The suspended benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist:
            raise ValidationError("Benefit not found")
        
        benefit.status = BusinessStatusChoices.SUSPENDED
        benefit.save(update_fields=['status'])
        return benefit

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def benefits_bulk_status_update(*, benefit_ids: list, new_status: str, user=None):
        """
        Bulk update benefit status.
        
        Args:
            benefit_ids: List of benefit IDs to update
            new_status: New status to set
            user: User performing the update
            
        Returns:
            int: Number of benefits updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")
        
        updated_count = Benefit.objects.filter(
            id__in=benefit_ids,
            is_deleted=False
        ).update(status=new_status)
        
        return updated_count

    @staticmethod
    def benefits_export_csv(*, filters: dict = None):
        """
        Export filtered benefits to CSV format.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import benefit_list
        
        if filters:
            benefits = benefit_list(filters=filters)
        else:
            benefits = Benefit.objects.filter(is_deleted=False)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Benefit Name', 'Description', 'Patient Type', 'Limit Amount',
            'Status', 'Created At', 'Updated At'
        ])
        
        # Write data
        for benefit in benefits:
            writer.writerow([
                benefit.id,
                benefit.benefit_name,
                benefit.description or '',
                benefit.in_or_out_patient,
                benefit.limit_amount or '',
                benefit.status,
                benefit.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                benefit.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return output.getvalue()
