"""
Request ID middleware for tracking requests across the application.

Generates a unique request ID (CUID2) for each request and includes it in:
- Request object: request.id
- Response header: X-Request-ID
- Supports incoming X-Request-ID header (preserves if exists)

Uses CUID2 for consistency with the rest of the codebase where all model IDs
use CUID2 format.
"""
import logging
import threading
import re

from apps.core.utils.generators import generate_cuid

logger = logging.getLogger(__name__)

# Thread-local storage for request ID
_thread_local = threading.local()

# CUID2 format: 24-25 characters, alphanumeric, starts with lowercase letter
# Pattern: starts with a lowercase letter, followed by alphanumeric characters
CUID2_PATTERN = re.compile(r'^[a-z][a-z0-9]{23,24}$')


def is_valid_cuid2(value: str) -> bool:
    """
    Validate if a string is a valid CUID2 format.
    
    Args:
        value: String to validate
        
    Returns:
        bool: True if valid CUID2 format, False otherwise
    """
    if not value or len(value) < 24 or len(value) > 25:
        return False
    return bool(CUID2_PATTERN.match(value))


class RequestIDMiddleware:
    """
    Middleware to add request ID to all requests and responses.
    
    Adds a unique request ID (CUID2) to each request for tracking purposes.
    The request ID is:
    - Added to request.id
    - Included in response header X-Request-ID
    - Preserved if provided in incoming X-Request-ID header
    
    Uses CUID2 format for consistency with the codebase's ID generation strategy.
    CUID2 provides:
    - Compact format (24-25 chars vs 36 for UUID)
    - Lexicographically sortable (time-ordered)
    - URL-safe
    - Collision-resistant
    """

    def __init__(self, get_response):
        """
        Initialize the middleware.
        
        Args:
            get_response: Next middleware/handler in the chain
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Process the request and add request ID.
        
        Args:
            request: Django HttpRequest object
            
        Returns:
            HttpResponse with X-Request-ID header
        """
        # Check if request ID is already provided in header
        incoming_request_id = request.META.get('HTTP_X_REQUEST_ID', '').strip()
        
        if incoming_request_id:
            # Use provided request ID (validate it's a valid CUID2 format)
            if is_valid_cuid2(incoming_request_id):
                request.id = incoming_request_id
            else:
                # Invalid CUID2 format, generate new one
                request.id = generate_cuid()
                logger.warning(
                    f"Invalid X-Request-ID format received: {incoming_request_id}. "
                    f"Expected CUID2 format (24-25 alphanumeric chars starting with lowercase letter). "
                    f"Generated new request ID: {request.id}"
                )
        else:
            # Generate new CUID2 request ID
            request.id = generate_cuid()

        # Store request ID in thread-local storage for logging
        _thread_local.request_id = request.id

        try:
            # Process the request
            response = self.get_response(request)

            # Add request ID to response header
            response['X-Request-ID'] = request.id

            return response
        finally:
            # Clean up thread-local storage
            if hasattr(_thread_local, 'request_id'):
                delattr(_thread_local, 'request_id')
