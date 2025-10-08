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
