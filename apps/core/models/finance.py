
from .base import BaseModel


class FinancialTransaction(BaseModel):
    """
    Minimal financial abstraction to unify financial record behavior.
    Domain models can extend this to inherit status/soft-delete and timestamps.
    """

    class Meta:
        abstract = True
