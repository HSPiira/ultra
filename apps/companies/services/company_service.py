from django.db.models import Q, Count, Avg
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import Scheme
import csv
from io import StringIO
from typing import Dict, List, Optional, Any

class CompanyService:
    """
    Comprehensive company business logic and data access layer.
    Handles all company-related operations including CRUD, validation, 
    relationships, and business analytics.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    def create_company(company_data: dict, user=None):
        """
        Create a new company with validation and duplicate checking.
        
        Args:
            company_data: Dictionary containing company information
            user: User creating the company (for audit trail)
            
        Returns:
            Company: The created company instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        CompanyService.validate_company_data(company_data)
        
        # Check for duplicates
        if CompanyService.check_company_duplicates(
            company_data.get('company_name'), 
            company_data.get('email')
        ):
            raise ValidationError("Company with this name or email already exists")
        
        # Create company
        company = Company.objects.create(**company_data)
        return company

    @staticmethod
    def update_company(company_id: str, update_data: dict, user=None):
        """
        Update company with validation and duplicate checking.
        
        Args:
            company_id: ID of the company to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Company: The updated company instance
            
        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist:
            raise ValidationError("Company not found")
        
        # Validate data
        CompanyService.validate_company_data(update_data)
        
        # Check for duplicates (excluding current company)
        if CompanyService.check_company_duplicates(
            update_data.get('company_name', company.company_name),
            update_data.get('email', company.email),
            exclude_id=company_id
        ):
            raise ValidationError("Another company with this name or email already exists")
        
        # Update fields
        for field, value in update_data.items():
            setattr(company, field, value)
        
        company.save()
        return company

    @staticmethod
    def get_company(company_id: str):
        """
        Get a single company by ID.
        
        Args:
            company_id: ID of the company
            
        Returns:
            Company: The company instance or None if not found
        """
        try:
            return Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist:
            return None

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------
    
    @staticmethod
    def activate_company(company_id: str, user=None):
        """
        Reactivate a previously deactivated company.
        
        Args:
            company_id: ID of the company to activate
            user: User performing the activation
            
        Returns:
            Company: The activated company instance
        """
        company = CompanyService.get_company(company_id)
        if not company:
            raise ValidationError("Company not found")
        
        company.status = BusinessStatusChoices.ACTIVE
        company.is_deleted = False
        company.deleted_at = None
        company.deleted_by = None
        company.save(update_fields=['status', 'is_deleted', 'deleted_at', 'deleted_by'])
        return company

    @staticmethod
    def deactivate_company(company_id: str, user=None):
        """
        Soft delete / deactivate company.
        
        Args:
            company_id: ID of the company to deactivate
            user: User performing the deactivation
            
        Returns:
            Company: The deactivated company instance
        """
        company = CompanyService.get_company(company_id)
        if not company:
            raise ValidationError("Company not found")
        
        company.status = BusinessStatusChoices.INACTIVE
        company.is_deleted = True
        company.save(update_fields=['status', 'is_deleted'])
        return company

    @staticmethod
    def suspend_company(company_id: str, reason: str, user=None):
        """
        Suspend a company with reason tracking.
        
        Args:
            company_id: ID of the company to suspend
            reason: Reason for suspension
            user: User performing the suspension
            
        Returns:
            Company: The suspended company instance
        """
        company = CompanyService.get_company(company_id)
        if not company:
            raise ValidationError("Company not found")
        
        company.status = BusinessStatusChoices.SUSPENDED
        suspension_note = f"\nSuspended: {reason}"
        company.remark = f"{company.remark}{suspension_note}" if company.remark else f"Suspended: {reason}"
        company.save(update_fields=['status', 'remark'])
        return company

    # ---------------------------------------------------------------------
    # Filtering and Search
    # ---------------------------------------------------------------------
    
    @staticmethod
    def filter_companies(filters: dict):
        """
        Central filtering logic that can be reused by views, cron jobs, etc.
        
        Args:
            filters: Dictionary containing filter criteria
            
        Returns:
            QuerySet: Filtered company queryset
        """
        qs = Company.objects.filter(is_deleted=False)

        if filters.get('status'):
            qs = qs.filter(status=filters['status'])

        if filters.get('industry'):
            qs = qs.filter(industry_id=filters['industry'])

        if filters.get('query'):
            q = filters['query']
            qs = qs.filter(
                Q(company_name__icontains=q) |
                Q(contact_person__icontains=q) |
                Q(email__icontains=q) |
                Q(phone_number__icontains=q)
            )

        return qs

    @staticmethod
    def search_companies_advanced(search_params: dict):
        """
        Advanced search with multiple criteria.
        
        Args:
            search_params: Dictionary containing advanced search criteria
            
        Returns:
            QuerySet: Filtered company queryset
        """
        qs = Company.objects.filter(is_deleted=False)
        
        # Industry filter
        if search_params.get('industry_ids'):
            qs = qs.filter(industry_id__in=search_params['industry_ids'])
        
        # Status filter
        if search_params.get('statuses'):
            qs = qs.filter(status__in=search_params['statuses'])
        
        # Date range filters
        if search_params.get('created_after'):
            qs = qs.filter(created_at__gte=search_params['created_after'])
        if search_params.get('created_before'):
            qs = qs.filter(created_at__lte=search_params['created_before'])
        
        # Has schemes filter
        if search_params.get('has_schemes') is not None:
            if search_params['has_schemes']:
                qs = qs.filter(schemes__isnull=False).distinct()
            else:
                qs = qs.filter(schemes__isnull=True)
        
        # Text search across multiple fields
        if search_params.get('search_text'):
            search_text = search_params['search_text']
            qs = qs.filter(
                Q(company_name__icontains=search_text) |
                Q(contact_person__icontains=search_text) |
                Q(email__icontains=search_text) |
                Q(phone_number__icontains=search_text) |
                Q(company_address__icontains=search_text) |
                Q(remark__icontains=search_text)
            )
        
        return qs

    # ---------------------------------------------------------------------
    # Relationship Management
    # ---------------------------------------------------------------------
    
    @staticmethod
    def get_company_schemes(company_id: str):
        """
        Get all schemes associated with a company.
        
        Args:
            company_id: ID of the company
            
        Returns:
            QuerySet: Schemes associated with the company
        """
        return Scheme.objects.filter(company_id=company_id, is_deleted=False)

    @staticmethod
    def get_companies_by_industry(industry_id: str):
        """
        Get all companies in a specific industry.
        
        Args:
            industry_id: ID of the industry
            
        Returns:
            QuerySet: Companies in the specified industry
        """
        return Company.objects.filter(industry_id=industry_id, is_deleted=False)

    @staticmethod
    def get_company_contact_info(company_id: str):
        """
        Get formatted contact information for a company.
        
        Args:
            company_id: ID of the company
            
        Returns:
            dict: Formatted contact information
        """
        company = CompanyService.get_company(company_id)
        if not company:
            return None
        
        return {
            'company_name': company.company_name,
            'contact_person': company.contact_person,
            'email': company.email,
            'phone_number': company.phone_number,
            'website': company.website,
            'address': company.company_address
        }

    # ---------------------------------------------------------------------
    # Analytics and Statistics
    # ---------------------------------------------------------------------
    
    @staticmethod
    def get_company_statistics():
        """
        Get comprehensive company statistics.
        
        Returns:
            dict: Company statistics
        """
        stats = Company.objects.filter(is_deleted=False).aggregate(
            total_companies=Count('id'),
            active_companies=Count('id', filter=Q(status=BusinessStatusChoices.ACTIVE)),
            inactive_companies=Count('id', filter=Q(status=BusinessStatusChoices.INACTIVE)),
            suspended_companies=Count('id', filter=Q(status=BusinessStatusChoices.SUSPENDED))
        )
        
        # Add industry breakdown
        industry_stats = Company.objects.filter(is_deleted=False).values(
            'industry__industry_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        stats['by_industry'] = list(industry_stats)
        
        return stats

    @staticmethod
    def get_companies_with_recent_activity(days: int = 30):
        """
        Get companies with recent scheme activity.
        
        Args:
            days: Number of days to look back for activity
            
        Returns:
            QuerySet: Companies with recent activity
        """
        from datetime import datetime, timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        
        return Company.objects.filter(
            is_deleted=False,
            schemes__created_at__gte=cutoff_date
        ).distinct()

    @staticmethod
    def get_company_health_score(company_id: str):
        """
        Calculate company health score based on various factors.
        
        Args:
            company_id: ID of the company
            
        Returns:
            dict: Health score and factors
        """
        company = CompanyService.get_company(company_id)
        if not company:
            return None
        
        score = 0
        factors = {}
        
        # Status factor (40 points)
        if company.status == BusinessStatusChoices.ACTIVE:
            score += 40
            factors['status'] = 'Active'
        elif company.status == BusinessStatusChoices.SUSPENDED:
            score += 20
            factors['status'] = 'Suspended'
        else:
            score += 0
            factors['status'] = 'Inactive'
        
        # Scheme activity factor (30 points)
        scheme_count = CompanyService.get_company_schemes(company_id).count()
        if scheme_count > 0:
            score += min(30, scheme_count * 10)
            factors['schemes'] = f'{scheme_count} active schemes'
        else:
            factors['schemes'] = 'No active schemes'
        
        # Contact completeness factor (20 points)
        contact_score = 0
        if company.email:
            contact_score += 5
        if company.phone_number:
            contact_score += 5
        if company.website:
            contact_score += 5
        if company.company_address:
            contact_score += 5
        
        score += contact_score
        factors['contact_completeness'] = f'{contact_score}/20'
        
        # Recent activity factor (10 points)
        recent_activity = CompanyService.get_companies_with_recent_activity(30).filter(id=company_id).exists()
        if recent_activity:
            score += 10
            factors['recent_activity'] = 'Active in last 30 days'
        else:
            factors['recent_activity'] = 'No recent activity'
        
        return {
            'score': min(100, score),
            'factors': factors,
            'grade': 'A' if score >= 80 else 'B' if score >= 60 else 'C' if score >= 40 else 'D'
        }

    # ---------------------------------------------------------------------
    # Validation and Data Integrity
    # ---------------------------------------------------------------------
    
    @staticmethod
    def validate_company_data(data: dict):
        """
        Validate company data before creation/update.
        
        Args:
            data: Dictionary containing company data
            
        Raises:
            ValidationError: If data is invalid
        """
        required_fields = ['company_name', 'contact_person', 'email', 'phone_number', 'industry']
        for field in required_fields:
            if not data.get(field):
                raise ValidationError(f"{field} is required")
        
        # Email format validation
        if data.get('email') and '@' not in data['email']:
            raise ValidationError("Invalid email format")
        
        # Phone number basic validation
        if data.get('phone_number'):
            phone = data['phone_number'].replace('+', '').replace('-', '').replace(' ', '')
            if not phone.isdigit() or len(phone) < 10:
                raise ValidationError("Invalid phone number format")

    @staticmethod
    def check_company_duplicates(company_name: str, email: str, exclude_id=None):
        """
        Check for duplicate companies by name or email.
        
        Args:
            company_name: Company name to check
            email: Email to check
            exclude_id: Company ID to exclude from check (for updates)
            
        Returns:
            bool: True if duplicates exist
        """
        qs = Company.objects.filter(is_deleted=False)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        
        return qs.filter(
            Q(company_name__iexact=company_name) | Q(email__iexact=email)
        ).exists()

    @staticmethod
    def validate_company_data_integrity():
        """
        Run data integrity checks on all companies.
        
        Returns:
            dict: Integrity check results
        """
        issues = []
        
        # Check for companies without required fields
        companies_missing_data = Company.objects.filter(
            is_deleted=False
        ).filter(
            Q(company_name__isnull=True) | Q(company_name='') |
            Q(contact_person__isnull=True) | Q(contact_person='') |
            Q(email__isnull=True) | Q(email='') |
            Q(phone_number__isnull=True) | Q(phone_number='')
        )
        
        if companies_missing_data.exists():
            issues.append({
                'type': 'missing_required_data',
                'count': companies_missing_data.count(),
                'companies': list(companies_missing_data.values_list('id', 'company_name'))
            })
        
        # Check for duplicate emails
        duplicate_emails = Company.objects.filter(
            is_deleted=False
        ).values('email').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        
        if duplicate_emails.exists():
            issues.append({
                'type': 'duplicate_emails',
                'count': duplicate_emails.count(),
                'emails': list(duplicate_emails.values_list('email', flat=True))
            })
        
        return {
            'total_issues': len(issues),
            'issues': issues,
            'status': 'healthy' if len(issues) == 0 else 'needs_attention'
        }

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------
    
    @staticmethod
    def bulk_update_company_status(company_ids: list, new_status: str, user=None):
        """
        Bulk update company status.
        
        Args:
            company_ids: List of company IDs to update
            new_status: New status to set
            user: User performing the update
            
        Returns:
            int: Number of companies updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")
        
        updated_count = Company.objects.filter(
            id__in=company_ids,
            is_deleted=False
        ).update(status=new_status)
        
        return updated_count

    @staticmethod
    def export_companies_to_csv(filters: dict = None):
        """
        Export filtered companies to CSV format.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            str: CSV content as string
        """
        if filters:
            companies = CompanyService.filter_companies(filters)
        else:
            companies = Company.objects.filter(is_deleted=False)
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Company Name', 'Contact Person', 'Email', 'Phone Number',
            'Website', 'Address', 'Industry', 'Status', 'Created At', 'Updated At'
        ])
        
        # Write data
        for company in companies:
            writer.writerow([
                company.id,
                company.company_name,
                company.contact_person,
                company.email,
                company.phone_number,
                company.website or '',
                company.company_address,
                company.industry.industry_name if company.industry else '',
                company.status,
                company.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                company.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return output.getvalue()

    @staticmethod
    def get_companies_needing_attention():
        """
        Get companies that need attention (inactive schemes, missing data, etc.).
        
        Returns:
            QuerySet: Companies needing attention
        """
        # Companies with no active schemes
        companies_no_schemes = Company.objects.filter(
            is_deleted=False,
            schemes__isnull=True
        )
        
        # Companies with suspended status
        companies_suspended = Company.objects.filter(
            is_deleted=False,
            status=BusinessStatusChoices.SUSPENDED
        )
        
        # Companies with missing contact information
        companies_missing_contact = Company.objects.filter(
            is_deleted=False
        ).filter(
            Q(email__isnull=True) | Q(email='') |
            Q(phone_number__isnull=True) | Q(phone_number='')
        )
        
        # Combine all
        all_attention_needed = companies_no_schemes.union(
            companies_suspended,
            companies_missing_contact
        )
        
        return all_attention_needed.distinct()