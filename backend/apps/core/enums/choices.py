from django.db import models


# ---------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------
class BusinessStatusChoices(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"


class GenderChoices(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"


class RelationshipChoices(models.TextChoices):
    SELF = "SELF", "Self"
    SPOUSE = "SPOUSE", "Spouse"
    CHILD = "CHILD", "Child"


class ClaimStatusChoices(models.TextChoices):
    """Claim processing status choices."""
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    PAID = "PAID", "Paid"
    CANCELLED = "CANCELLED", "Cancelled"
