from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q
from apps.schemes.models import Plan
from apps.core.enums.choices import BusinessStatusChoices
import csv
from io import StringIO
from typing import Dict, List, Optional, Any

class PlanService:
    """
    Plan business logic for write operations.
    Handles all plan-related write operations including CRUD, validation, 
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def plan_create(*, plan_data: dict, user=None):
        """
        Create a new plan with validation and duplicate checking.
        
        Args:
            plan_data: Dictionary containing plan information
            user: User creating the plan (for audit trail)
            
        Returns:
            Plan: The created plan instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        required_fields = ['plan_name']
        for field in required_fields:
            if not plan_data.get(field):
                raise ValidationError(f"{field} is required")
        
        # Plan name validation
        plan_name = plan_data.get('plan_name', '').strip()
        if len(plan_name) < 2:
            raise ValidationError("Plan name must be at least 2 characters long")
        if len(plan_name) > 255:
            raise ValidationError("Plan name cannot exceed 255 characters")
        
        # Description validation
        if plan_data.get('description') and len(plan_data['description']) > 500:
            raise ValidationError("Description cannot exceed 500 characters")
        
        # Check for duplicates
        qs = Plan.objects.filter(is_deleted=False)
        if qs.filter(plan_name__iexact=plan_name).exists():
            raise ValidationError("Plan with this name already exists")
        
        # Create plan
        plan = Plan.objects.create(**plan_data)
        return plan

    @staticmethod
    @transaction.atomic
    def plan_update(*, plan_id: str, update_data: dict, user=None):
        """
        Update plan with validation and duplicate checking.
        
        Args:
            plan_id: ID of the plan to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Plan: The updated plan instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            plan = Plan.objects.get(id=plan_id, is_deleted=False)
        except Plan.DoesNotExist:
            raise ValidationError("Plan not found")
        
        # Validate data
        if 'plan_name' in update_data:
            plan_name = update_data['plan_name'].strip()
            if len(plan_name) < 2:
                raise ValidationError("Plan name must be at least 2 characters long")
            if len(plan_name) > 255:
                raise ValidationError("Plan name cannot exceed 255 characters")
        
        if 'description' in update_data and update_data['description'] and len(update_data['description']) > 500:
            raise ValidationError("Description cannot exceed 500 characters")
        
        # Check for duplicates (excluding current plan)
        if 'plan_name' in update_data:
            qs = Plan.objects.filter(is_deleted=False).exclude(id=plan_id)
            if qs.filter(plan_name__iexact=update_data['plan_name']).exists():
                raise ValidationError("Another plan with this name already exists")
        
        # Update fields
        for field, value in update_data.items():
            setattr(plan, field, value)
        
        plan.save()
        return plan

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def plan_activate(*, plan_id: str, user=None):
        """
        Reactivate a previously deactivated plan.
        
        Args:
            plan_id: ID of the plan to activate
            user: User performing the activation
            
        Returns:
            Plan: The activated plan instance
        """
        try:
            plan = Plan.objects.get(id=plan_id, is_deleted=False)
        except Plan.DoesNotExist:
            raise ValidationError("Plan not found")
        
        plan.status = BusinessStatusChoices.ACTIVE
        plan.is_deleted = False
        plan.deleted_at = None
        plan.deleted_by = None
        plan.save(update_fields=['status', 'is_deleted', 'deleted_at', 'deleted_by'])
        return plan

    @staticmethod
    @transaction.atomic
    def plan_deactivate(*, plan_id: str, user=None):
        """
        Soft delete / deactivate plan.
        
        Args:
            plan_id: ID of the plan to deactivate
            user: User performing the deactivation
            
        Returns:
            Plan: The deactivated plan instance
        """
        try:
            plan = Plan.objects.get(id=plan_id, is_deleted=False)
        except Plan.DoesNotExist:
            raise ValidationError("Plan not found")
        
        plan.status = BusinessStatusChoices.INACTIVE
        plan.is_deleted = True
        plan.save(update_fields=['status', 'is_deleted'])
        return plan

    @staticmethod
    @transaction.atomic
    def plan_suspend(*, plan_id: str, reason: str, user=None):
        """
        Suspend a plan with reason tracking.
        
        Args:
            plan_id: ID of the plan to suspend
            reason: Reason for suspension
            user: User performing the suspension
            
        Returns:
            Plan: The suspended plan instance
        """
        try:
            plan = Plan.objects.get(id=plan_id, is_deleted=False)
        except Plan.DoesNotExist:
            raise ValidationError("Plan not found")
        
        plan.status = BusinessStatusChoices.SUSPENDED
        plan.save(update_fields=['status'])
        return plan

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    @transaction.atomic
    def plans_bulk_status_update(*, plan_ids: list, new_status: str, user=None):
        """
        Bulk update plan status.
        
        Args:
            plan_ids: List of plan IDs to update
            new_status: New status to set
            user: User performing the update
            
        Returns:
            int: Number of plans updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")
        
        updated_count = Plan.objects.filter(
            id__in=plan_ids,
            is_deleted=False
        ).update(status=new_status)
        
        return updated_count

    @staticmethod
    def plans_export_csv(*, filters: dict = None):
        """
        Export filtered plans to CSV format.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import plan_list
        
        if filters:
            plans = plan_list(filters=filters)
        else:
            plans = Plan.objects.filter(is_deleted=False)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Plan Name', 'Description', 'Status', 'Created At', 'Updated At'
        ])
        
        # Write data
        for plan in plans:
            writer.writerow([
                plan.id,
                plan.plan_name,
                plan.description or '',
                plan.status,
                plan.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                plan.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return output.getvalue()
