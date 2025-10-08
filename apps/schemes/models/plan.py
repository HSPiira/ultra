from django.db import models
from apps.core.models.base import BaseModel

# ---------------------------------------------------------------------
# Plan
# ---------------------------------------------------------------------
class Plan(BaseModel):
    plan_name = models.CharField(max_length=255, help_text="Name of the plan.")
    description = models.TextField(max_length=500, blank=True, help_text="Plan description.")

    class Meta:
        verbose_name = "Plan"
        verbose_name_plural = "Plans"
        db_table = "plans"

    def __str__(self):
        return self.plan_name