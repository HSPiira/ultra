import logging

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler following HackSoft pattern.
    Handles Django ValidationError and other exceptions consistently.
    """
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
        response.data = custom_response_data
        return response

    # Handle Django ValidationError
    if isinstance(exc, ValidationError):
        logger.error(f"ValidationError: {exc}")
        return Response(
            {
                "success": False,
                "error": {
                    "type": "ValidationError",
                    "message": "Validation failed",
                    "details": (
                        exc.message_dict if hasattr(exc, "message_dict") else str(exc)
                    ),
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Handle IntegrityError
    if isinstance(exc, IntegrityError):
        logger.error(f"IntegrityError: {exc}")
        return Response(
            {
                "success": False,
                "error": {
                    "type": "IntegrityError",
                    "message": "Database integrity constraint violated",
                    "details": str(exc),
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Handle other unhandled exceptions
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return Response(
        {
            "success": False,
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected error occurred",
                "details": str(exc) if hasattr(exc, "__str__") else "Unknown error",
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
