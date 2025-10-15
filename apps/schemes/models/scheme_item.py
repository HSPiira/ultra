from django.db import models
from apps.core.models.base import BaseModel
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
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

    limit_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, help_text="Coverage or limit amount.")
    copayment_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Copayment percentage.")

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
            models.UniqueConstraint(fields=["scheme", "content_type", "object_id"], name="unique_scheme_item")
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