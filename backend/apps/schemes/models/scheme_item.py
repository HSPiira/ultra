from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel
from apps.schemes.models.scheme import Scheme


class SchemeItemManager(models.Manager):
    def for_scheme(self, scheme_id: str):
        return self.filter(scheme_id=scheme_id)

    def for_plan(self, plan_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.schemes.models import Plan

        ct = ContentType.objects.get_for_model(Plan)
        return self.filter(content_type=ct, object_id=plan_id)

    def for_benefit(self, benefit_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.schemes.models import Benefit

        ct = ContentType.objects.get_for_model(Benefit)
        return self.filter(content_type=ct, object_id=benefit_id)

    def for_hospital(self, hospital_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.providers.models import Hospital

        ct = ContentType.objects.get_for_model(Hospital)
        return self.filter(content_type=ct, object_id=hospital_id)

    def for_service(self, service_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.medical_catalog.models import Service

        ct = ContentType.objects.get_for_model(Service)
        return self.filter(content_type=ct, object_id=service_id)

    def for_labtest(self, labtest_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.medical_catalog.models import LabTest

        ct = ContentType.objects.get_for_model(LabTest)
        return self.filter(content_type=ct, object_id=labtest_id)

    def for_medicine(self, medicine_id: str):
        from django.contrib.contenttypes.models import ContentType

        from apps.medical_catalog.models import Medicine

        ct = ContentType.objects.get_for_model(Medicine)
        return self.filter(content_type=ct, object_id=medicine_id)
        
        
# ---------------------------------------------------------------------
# SchemeItem
# ---------------------------------------------------------------------
class SchemeItem(BaseModel):
    """Links schemes to plans, benefits, hospitals, services, lab tests, or medicines."""

    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="items")

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
        unique_together = ("scheme", "content_type", "object_id")

        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["scheme", "content_type", "object_id"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["scheme", "content_type", "object_id"],
                name="unique_scheme_item",
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
        return f"{self.scheme.scheme_name} - {self.item}"

