"""
Custom throttle classes for API rate limiting.

Provides fine-grained control over API request rates to prevent abuse
and ensure system stability.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, ScopedRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Burst rate throttle: 10 requests per minute.
    
    Used for sensitive endpoints like login and password reset
    to prevent brute force attacks.
    """
    rate = '10/minute'
    scope = 'burst'


class StrictRateThrottle(UserRateThrottle):
    """
    Strict rate throttle: 20 requests per hour.
    
    Used for resource-intensive operations like bulk uploads
    and data exports to prevent system overload.
    """
    rate = '20/hour'
    scope = 'strict'


class ExportRateThrottle(UserRateThrottle):
    """
    Export rate throttle: 5 requests per hour.
    
    Used for CSV/Excel export endpoints to prevent
    excessive resource consumption.
    """
    rate = '5/hour'
    scope = 'export'


class ScopedRateThrottleCustom(ScopedRateThrottle):
    """
    Custom scoped rate throttle for per-endpoint rate limiting.
    
    Allows different endpoints to have different rate limits
    defined in settings.DEFAULT_THROTTLE_RATES.
    """
    pass


class AnonBurstRateThrottle(AnonRateThrottle):
    """
    Anonymous burst rate throttle: 10 requests per minute.
    
    Used for public endpoints that need burst protection
    like login endpoints.
    """
    rate = '10/minute'
    scope = 'anon_burst'


def check_throttle_for_view(request, throttle_class):
    """
    Helper function to check throttling for Django Views (non-DRF).
    
    Args:
        request: Django HttpRequest object
        throttle_class: Throttle class to use
        
    Returns:
        tuple: (allowed: bool, wait_time: int or None)
    """
    throttle = throttle_class()
    # Create a minimal view-like object for throttling
    # DRF throttling needs a view with request attribute
    class MinimalView:
        pass
    
    view = MinimalView()
    view.request = request
    
    # Get the throttle key for this request
    throttle_key = throttle.get_cache_key(request, view)
    if throttle_key is None:
        # No throttling applied (e.g., for authenticated users on AnonRateThrottle)
        return True, None
    
    allowed = throttle.allow_request(request, view)
    if not allowed:
        wait_time = throttle.wait()
        return False, wait_time
    return True, None
