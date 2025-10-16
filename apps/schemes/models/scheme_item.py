from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel
from apps.schemes.models.scheme import Scheme


# ---------------------------------------------------------------------
# SchemeItem
# ---------------------------------------------------------------------
class SchemeItem(BaseModel):
    """Links schemes to either plans or benefits."""

    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="items")

    # contenttype + object id pair: point to Plan or Benefit (or future types)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to=models.Q(app_label="schemes", model__in=["plan", "benefit"]),
        help_text="Associated plan or benefit.",
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


# Managers
SchemeItem.objects = SchemeItemManager()
SchemeItem.all_objects = models.Manager()
