"""
Selectors package for schemes app.
Organized by domain for better maintainability.
"""

from .benefit_selector import (
    benefit_data_integrity_check,
    benefit_get,
    benefit_health_score_get,
    benefit_health_scores_list,
    benefit_list,
    benefit_list_needing_attention,
    benefit_statistics_get,
)
from .plan_selector import (
    plan_data_integrity_check,
    plan_get,
    plan_health_score_get,
    plan_health_scores_list,
    plan_list,
    plan_list_needing_attention,
    plan_statistics_get,
)
from .scheme_item_selector import (
    scheme_item_data_integrity_check,
    scheme_item_get,
    scheme_item_health_score_get,
    scheme_item_health_scores_list,
    scheme_item_list,
    scheme_item_list_by_content_type,
    scheme_item_list_by_scheme,
    scheme_item_list_needing_attention,
    scheme_item_statistics_get,
)
from .scheme_selector import (
    scheme_data_integrity_check,
    scheme_get,
    scheme_health_score_get,
    scheme_health_scores_list,
    scheme_list,
    scheme_list_by_company,
    scheme_list_needing_attention,
    scheme_statistics_get,
)

__all__ = [
    # Scheme selectors
    "scheme_list",
    "scheme_get",
    "scheme_list_by_company",
    "scheme_statistics_get",
    "scheme_health_score_get",
    "scheme_health_scores_list",
    "scheme_list_needing_attention",
    "scheme_data_integrity_check",
    # Plan selectors
    "plan_list",
    "plan_get",
    "plan_statistics_get",
    "plan_health_score_get",
    "plan_health_scores_list",
    "plan_list_needing_attention",
    "plan_data_integrity_check",
    # Benefit selectors
    "benefit_list",
    "benefit_get",
    "benefit_statistics_get",
    "benefit_health_score_get",
    "benefit_health_scores_list",
    "benefit_list_needing_attention",
    "benefit_data_integrity_check",
    # Scheme Item selectors
    "scheme_item_list",
    "scheme_item_get",
    "scheme_item_list_by_scheme",
    "scheme_item_list_by_content_type",
    "scheme_item_statistics_get",
    "scheme_item_health_score_get",
    "scheme_item_health_scores_list",
    "scheme_item_list_needing_attention",
    "scheme_item_data_integrity_check",
]
