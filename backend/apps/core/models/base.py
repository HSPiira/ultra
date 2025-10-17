from django.db import models
from django.utils import timezone

from ..enums.choices import BusinessStatusChoices
from ..utils.generators import generate_cuid


# ---------------------------------------------------------------------
# Custom Manager for Soft Delete
# ---------------------------------------------------------------------
class ActiveManager(models.Manager):
    """Default manager that excludes deleted records."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False).order_by("-created_at")


# ---------------------------------------------------------------------
# Base Model with Soft Delete + Business Status
# ---------------------------------------------------------------------
class BaseModel(models.Model):
    """
    Abstract base model providing:
    - Unique CUID-based primary key
    - Created/updated timestamps
    - Business status
    - Soft delete capability (is_deleted, deleted_at, deleted_by)
    """

    id = models.CharField(
        primary_key=True, max_length=25, default=generate_cuid, editable=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="When record was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="When record was last updated."
    )
    status = models.CharField(
        max_length=10,
        choices=BusinessStatusChoices.choices,
        default=BusinessStatusChoices.ACTIVE,
        help_text="Business or operational status of this record.",
    )

    # Soft delete lifecycle fields
    is_deleted = models.BooleanField(
        default=False, help_text="Indicates if record is soft deleted."
    )
    deleted_at = models.DateTimeField(
        null=True, blank=True, help_text="When record was soft deleted."
    )
    deleted_by = models.ForeignKey(
        "auth.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="User who deleted the record.",
    )

    # Managers
    objects = ActiveManager()  # Default manager filters out deleted
    all_objects = models.Manager()  # Includes everything

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.__class__.__name__}({self.id})"

    # -----------------------------------------------------------------
    # Lifecycle helpers
    # -----------------------------------------------------------------
    def soft_delete(self, user=None):
        """Marks the record as deleted without removing it from the DB."""
        if not self.is_deleted:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            if user:
                self.deleted_by = user
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def restore(self):
        """Restores a previously soft-deleted record."""
        if self.is_deleted:
            self.is_deleted = False
            self.deleted_at = None
            self.deleted_by = None
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def delete(self, *args, **kwargs):
        """Override default delete to always soft delete."""
        self.soft_delete()
