from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel


class SchemeItemQuerySet(models.QuerySet):
    """Custom queryset for SchemeItem with helper methods."""

    def for_scheme(self, scheme_id: str):
        """Get all items across all periods for a scheme."""
        from apps.schemes.models import SchemePeriod
        period_ids = SchemePeriod.objects.filter(scheme_id=scheme_id).values_list('id', flat=True)
        return self.filter(scheme_period_id__in=period_ids)

    def for_scheme_period(self, scheme_period_id: str):
        """Get items for a specific scheme period."""
        return self.filter(scheme_period_id=scheme_period_id)

    def _for_content_type(self, model_class, object_id: str = None):
        """
        Helper to filter items by content type.

        Args:
            model_class: The Django model class to filter by
            object_id: Optional specific object ID. If None, returns all items of this type.

        Returns:
            QuerySet filtered by content_type and optionally object_id
        """
        ct = ContentType.objects.get_for_model(model_class)
        queryset = self.filter(content_type=ct)
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        return queryset

    def for_plan(self, plan_id: str = None):
        """
        Filter items related to Plan content type.

        Args:
            plan_id: Optional specific plan ID. If None, returns all plan items.

        Note:
            Imports Plan locally to avoid circular import issues.
        """
        from apps.schemes.models import Plan
        return self._for_content_type(Plan, plan_id)

    def for_benefit(self, benefit_id: str = None):
        """
        Filter items related to Benefit content type.

        Args:
            benefit_id: Optional specific benefit ID. If None, returns all benefit items.

        Note:
            Imports Benefit locally to avoid circular import issues.
        """
        from apps.schemes.models import Benefit
        return self._for_content_type(Benefit, benefit_id)

    def for_hospital(self, hospital_id: str = None):
        """
        Filter items related to Hospital content type.

        Args:
            hospital_id: Optional specific hospital ID. If None, returns all hospital items.

        Note:
            Imports Hospital locally to avoid circular import issues during Django model loading.
        """
        from apps.providers.models import Hospital
        return self._for_content_type(Hospital, hospital_id)

    def for_service(self, service_id: str = None):
        """
        Filter items related to Service content type.

        Args:
            service_id: Optional specific service ID. If None, returns all service items.

        Note:
            Imports Service locally to avoid circular import issues during Django model loading.
        """
        from apps.medical_catalog.models import Service
        return self._for_content_type(Service, service_id)

    def for_labtest(self, labtest_id: str = None):
        """
        Filter items related to LabTest content type.

        Args:
            labtest_id: Optional specific labtest ID. If None, returns all labtest items.

        Note:
            Imports LabTest locally to avoid circular import issues during Django model loading.
        """
        from apps.medical_catalog.models import LabTest
        return self._for_content_type(LabTest, labtest_id)

    def for_medicine(self, medicine_id: str = None):
        """
        Filter items related to Medicine content type.

        Args:
            medicine_id: Optional specific medicine ID. If None, returns all medicine items.

        Note:
            Imports Medicine locally to avoid circular import issues during Django model loading.
        """
        from apps.medical_catalog.models import Medicine
        return self._for_content_type(Medicine, medicine_id)


class SchemeItemManager(models.Manager):
    """Custom manager for SchemeItem using the custom queryset."""

    def get_queryset(self):
        return SchemeItemQuerySet(self.model, using=self._db)
        
        
# ---------------------------------------------------------------------
# SchemeItem
# ---------------------------------------------------------------------
class SchemeItem(BaseModel):
    """
    Links scheme periods to plans, benefits, hospitals, services, lab tests, or medicines.

    Items are period-specific to track changes in coverage, providers, and limits across renewals.
    """

    scheme_period = models.ForeignKey(
        "schemes.SchemePeriod",
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Scheme period this item belongs to."
    )

    # contenttype + object id pair: point to Plan, Benefit, Hospital, Service, LabTest, or Medicine
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to=models.Q(
            app_label="schemes", model__in=["plan", "benefit"]
        ) | models.Q(
            app_label="providers", model__in=["hospital"]
        ) | models.Q(
            app_label="medical_catalog", model__in=["service", "labtest", "medicine"]
        ),
        help_text="Associated plan, benefit, hospital, service, lab test, or medicine.",
    )
    object_id = models.CharField(max_length=30)
    item = GenericForeignKey("content_type", "object_id")

    limit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Coverage or limit amount.",
    )
    copayment_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Copayment percentage.",
    )

    objects = SchemeItemManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Scheme Item"
        verbose_name_plural = "Scheme Items"
        db_table = "scheme_items"

        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["scheme_period", "content_type", "object_id"],
                name="unique_scheme_period_item",
            )
        ]

    def clean(self):
        errors = {}
        if self.copayment_percent is not None and self.copayment_percent < 0:
            errors["copayment_percent"] = "Copayment percentage cannot be negative."
        if self.copayment_percent is not None and self.copayment_percent > 100:
            errors["copayment_percent"] = "Copayment percentage cannot exceed 100."
        if self.limit_amount is not None and self.limit_amount < 0:
            errors["limit_amount"] = "Limit amount cannot be negative."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        """
        String representation of SchemeItem.

        WARNING: This method accesses self.scheme_period.scheme.scheme_name which causes
        2 FK lookups and can lead to N+1 query problems when rendering many SchemeItem instances.

        PERFORMANCE TIP: When querying multiple SchemeItems, always use:
            SchemeItem.objects.select_related('scheme_period__scheme')

        This fetches related scheme_period and scheme in the same query.
        """
        return f"{self.scheme_period.scheme.scheme_name} (Period {self.scheme_period.period_number}) - {self.item}"

