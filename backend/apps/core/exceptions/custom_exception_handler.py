import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

# Import centralized test detection from settings
IS_TESTING = settings.IS_TESTING


def custom_exception_handler(exc, context):
    """
    Custom exception handler following HackSoft pattern.
    Handles Django ValidationError and other exceptions consistently.
    Includes request_id in error responses.
    """
    # Get request_id from context if available
    request = context.get('request') if context else None
    request_id = getattr(request, 'id', None) if request else None
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the error response format
        custom_response_data = {
            "success": False,
            "error": {
                "type": exc.__class__.__name__,
                "message": str(exc),
                "details": response.data if hasattr(response, "data") else None,
            },
        }
        if request_id:
            custom_response_data["request_id"] = request_id
        response.data = custom_response_data
        # Log with request_id
        if request_id:
            logger.error(f"[{request_id}] Exception: {exc}", exc_info=True)
        else:
            logger.error(f"Exception: {exc}", exc_info=True)
        return response

    # Handle Django ValidationError
    if isinstance(exc, ValidationError):
        # Only log validation errors when not testing (they're expected during tests)
        if not IS_TESTING:
            log_msg = f"[{request_id}] ValidationError: {exc}" if request_id else f"ValidationError: {exc}"
            logger.error(log_msg)
        error_response = {
            "success": False,
            "error": {
                "type": "ValidationError",
                "message": "Validation failed",
                "details": (
                    exc.message_dict if hasattr(exc, "message_dict") else str(exc)
                ),
            },
        }
        if request_id:
            error_response["request_id"] = request_id
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

    # Handle IntegrityError
    if isinstance(exc, IntegrityError):
        # Only log integrity errors when not testing (they're expected during tests)
        if not IS_TESTING:
            log_msg = f"[{request_id}] IntegrityError: {exc}" if request_id else f"IntegrityError: {exc}"
            logger.error(log_msg)
        error_response = {
            "success": False,
            "error": {
                "type": "IntegrityError",
                "message": "Database integrity constraint violated",
                "details": str(exc),
            },
        }
        if request_id:
            error_response["request_id"] = request_id
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

    # Handle other unhandled exceptions
    log_msg = f"[{request_id}] Unhandled exception: {exc}" if request_id else f"Unhandled exception: {exc}"
    logger.error(log_msg, exc_info=True)
    error_response = {
        "success": False,
        "error": {
            "type": "InternalServerError",
            "message": "An unexpected error occurred",
            "details": str(exc) if hasattr(exc, "__str__") else "Unknown error",
        },
    }
    if request_id:
        error_response["request_id"] = request_id
    return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
