"""
Utility functions for schemes app.

Provides helper functions for claims processing, coverage validation,
and scheme-related calculations.
"""
from decimal import Decimal
from typing import Optional, Any
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType


def validate_claim_coverage(
    *,
    scheme_id: str,
    claim_date,
    service_or_provider,
    claim_amount: Decimal
) -> dict[str, Any]:
    """
    Validate if a claim is covered based on period-specific items.

    This function determines:
    1. If there's an active scheme period on the claim date
    2. If the service/provider is covered in that period
    3. The copayment amount and covered amount based on period-specific limits

    Args:
        scheme_id: Scheme ID to validate against
        claim_date: Date of the claim
        service_or_provider: The service, hospital, or other item being claimed
        claim_amount: Total claim amount

    Returns:
        Dictionary with coverage information:
            - covered (bool): Whether the claim is covered
            - copayment (Decimal): Amount patient pays (if covered)
            - covered_amount (Decimal): Amount scheme covers (if covered)
            - period_id (str): Period ID that applies
            - period_number (int): Period number
            - reason (str): Reason if not covered
            - limit_amount (Decimal): Maximum coverage limit for this item
            - remaining_limit (Decimal): How much limit is remaining (if tracked)

    Raises:
        ValidationError: If no active period exists for claim date

    Example:
        >>> from apps.medical_catalog.models import Service
        >>> service = Service.objects.get(service_name="Consultation")
        >>> result = validate_claim_coverage(
        ...     scheme_id="scheme_id",
        ...     claim_date=date(2025, 6, 15),
        ...     service_or_provider=service,
        ...     claim_amount=Decimal("5000.00")
        ... )
        >>> if result["covered"]:
        ...     print(f"Covered: {result['covered_amount']}, Copay: {result['copayment']}")
        ... else:
        ...     print(f"Not covered: {result['reason']}")
    """
    from apps.schemes.models import SchemeItem
    from apps.schemes.selectors.scheme_period_selector import scheme_period_on_date_get

    # Find period active on claim date
    period = scheme_period_on_date_get(
        scheme_id=scheme_id,
        when_date=claim_date
    )

    if not period:
        raise ValidationError(
            f"No active scheme period found for date {claim_date}. "
            "The scheme may not have been active or may have been terminated."
        )

    # Get content type for the service/provider
    content_type = ContentType.objects.get_for_model(service_or_provider)

    # Check if service/provider is covered in this period
    try:
        item = SchemeItem.objects.get(
            scheme_period=period,
            content_type=content_type,
            object_id=service_or_provider.id,
            is_deleted=False
        )

        # Validate against limit amount
        if item.limit_amount and claim_amount > item.limit_amount:
            return {
                "covered": False,
                "reason": f"Claim amount {claim_amount} exceeds limit of {item.limit_amount} for this period",
                "period_id": period.id,
                "period_number": period.period_number,
                "limit_amount": item.limit_amount,
                "copayment": Decimal("0.00"),
                "covered_amount": Decimal("0.00"),
                "remaining_limit": item.limit_amount,
            }

        # Calculate copayment and covered amount
        copayment_percent = item.copayment_percent or Decimal("0.00")
        copayment = (claim_amount * copayment_percent / Decimal("100")).quantize(Decimal("0.01"))
        covered_amount = claim_amount - copayment

        return {
            "covered": True,
            "copayment": copayment,
            "covered_amount": covered_amount,
            "period_id": period.id,
            "period_number": period.period_number,
            "limit_amount": item.limit_amount,
            "copayment_percent": copayment_percent,
            "remaining_limit": item.limit_amount - claim_amount if item.limit_amount else None,
        }

    except SchemeItem.DoesNotExist:
        # Service/provider not covered in this period
        service_name = getattr(service_or_provider, 'name', None) or str(service_or_provider)

        return {
            "covered": False,
            "reason": f"{service_name} is not covered in period {period.period_number}",
            "period_id": period.id,
            "period_number": period.period_number,
            "copayment": Decimal("0.00"),
            "covered_amount": Decimal("0.00"),
            "limit_amount": None,
            "remaining_limit": None,
        }


def calculate_scheme_utilization(
    *,
    scheme_id: str,
    period_id: Optional[str] = None
) -> dict[str, Any]:
    """
    Calculate utilization statistics for a scheme or specific period.

    Args:
        scheme_id: Scheme ID
        period_id: Optional specific period ID. If None, uses current period.

    Returns:
        Dictionary with utilization statistics:
            - period_id: Period being analyzed
            - period_number: Period number
            - total_limit: Total limit amount for the period
            - total_claimed: Total amount claimed (requires claims app)
            - utilization_percent: Percentage of limit utilized
            - remaining_amount: Amount remaining in limit

    Note:
        This function requires the claims app to be implemented for accurate
        claimed amount calculation. Returns placeholder data until then.
    """
    from apps.schemes.selectors.scheme_period_selector import (
        scheme_period_get,
        scheme_period_current_get
    )

    # Get the period
    if period_id:
        period = scheme_period_get(period_id=period_id)
    else:
        period = scheme_period_current_get(scheme_id=scheme_id)
        if not period:
            raise ValidationError(f"No current period found for scheme {scheme_id}")

    # TODO: When claims app is implemented, calculate actual claimed amounts
    # For now, return structure with placeholder values
    total_claimed = Decimal("0.00")  # Placeholder

    utilization_percent = Decimal("0.00")
    if period.limit_amount and period.limit_amount > 0:
        utilization_percent = (
            (total_claimed / period.limit_amount) * Decimal("100")
        ).quantize(Decimal("0.01"))

    remaining_amount = period.limit_amount - total_claimed

    return {
        "period_id": period.id,
        "period_number": period.period_number,
        "scheme_name": period.scheme.scheme_name,
        "start_date": period.start_date,
        "end_date": period.end_date,
        "total_limit": period.limit_amount,
        "total_claimed": total_claimed,
        "utilization_percent": utilization_percent,
        "remaining_amount": remaining_amount,
        "is_current": period.is_current,
    }
