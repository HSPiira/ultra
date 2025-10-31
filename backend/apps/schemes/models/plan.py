from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel


# ---------------------------------------------------------------------
# Plan
# ---------------------------------------------------------------------
class Plan(BaseModel):
    plan_name = models.CharField(
        max_length=255, unique=True, help_text="Name of the plan."
    )
    description = models.TextField(
        max_length=500, blank=True, help_text="Plan description."
    )

    class Meta:
        verbose_name = "Plan"
        verbose_name_plural = "Plans"
        db_table = "plans"

    def __str__(self):
        return self.plan_name

    def clean(self):
        """Validate plan data."""
        errors = {}

        # Normalize plan_name by stripping whitespace
        if self.plan_name:
            self.plan_name = self.plan_name.strip()
            if not self.plan_name:
                errors["plan_name"] = "Plan name cannot be empty or whitespace only."

        if errors:
            raise ValidationError(errors)

    def soft_delete(self, user=None):
        """Prevent deletion when plan has benefits."""
        from apps.schemes.models.benefit import Benefit

        if Benefit.all_objects.filter(plan_id=self.id, is_deleted=False).exists():
            raise ValidationError(
                "Cannot delete plan with existing benefits. Remove benefits first."
            )

        super().soft_delete(user=user)
