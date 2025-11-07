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

    def for_plan(self, plan_id: str = None):
        """
        Filter items related to Plan content type.

        Args:
            plan_id: Optional specific plan ID. If None, returns all plan items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.schemes.models import Plan

        ct = ContentType.objects.get_for_model(Plan)
        queryset = self.filter(content_type=ct)
        if plan_id:
            queryset = queryset.filter(object_id=plan_id)
        return queryset

    def for_benefit(self, benefit_id: str = None):
        """
        Filter items related to Benefit content type.

        Args:
            benefit_id: Optional specific benefit ID. If None, returns all benefit items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.schemes.models import Benefit

        ct = ContentType.objects.get_for_model(Benefit)
        queryset = self.filter(content_type=ct)
        if benefit_id:
            queryset = queryset.filter(object_id=benefit_id)
        return queryset

    def for_hospital(self, hospital_id: str = None):
        """
        Filter items related to Hospital content type.

        Args:
            hospital_id: Optional specific hospital ID. If None, returns all hospital items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.providers.models import Hospital

        ct = ContentType.objects.get_for_model(Hospital)
        queryset = self.filter(content_type=ct)
        if hospital_id:
            queryset = queryset.filter(object_id=hospital_id)
        return queryset

    def for_service(self, service_id: str = None):
        """
        Filter items related to Service content type.

        Args:
            service_id: Optional specific service ID. If None, returns all service items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.medical_catalog.models import Service

        ct = ContentType.objects.get_for_model(Service)
        queryset = self.filter(content_type=ct)
        if service_id:
            queryset = queryset.filter(object_id=service_id)
        return queryset

    def for_labtest(self, labtest_id: str = None):
        """
        Filter items related to LabTest content type.

        Args:
            labtest_id: Optional specific labtest ID. If None, returns all labtest items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.medical_catalog.models import LabTest

        ct = ContentType.objects.get_for_model(LabTest)
        queryset = self.filter(content_type=ct)
        if labtest_id:
            queryset = queryset.filter(object_id=labtest_id)
        return queryset

    def for_medicine(self, medicine_id: str = None):
        """
        Filter items related to Medicine content type.

        Args:
            medicine_id: Optional specific medicine ID. If None, returns all medicine items.
        """
        from django.contrib.contenttypes.models import ContentType
        from apps.medical_catalog.models import Medicine

        ct = ContentType.objects.get_for_model(Medicine)
        queryset = self.filter(content_type=ct)
        if medicine_id:
            queryset = queryset.filter(object_id=medicine_id)
        return queryset


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
            models.Index(fields=["scheme_period", "content_type", "object_id"]),
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
        return f"{self.scheme_period.scheme.scheme_name} (Period {self.scheme_period.period_number}) - {self.item}"

