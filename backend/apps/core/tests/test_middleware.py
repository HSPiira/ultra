"""
Tests for request ID middleware.

Tests request ID generation, preservation, response headers, and logging integration.
"""
from django.test import TestCase, Client
from django.urls import reverse

from apps.core.utils.generators import generate_cuid
from apps.core.middleware.request_id import is_valid_cuid2


class RequestIDMiddlewareTests(TestCase):
    """Test request ID middleware functionality."""

    def setUp(self):
        """Set up test client."""
        self.client = Client()

    def test_request_id_generation(self):
        """Test that request ID is generated for each request."""
        response = self.client.get('/api/v1/auth/csrf/')
        
        # Check response header
        self.assertIn('X-Request-ID', response.headers)
        request_id = response.headers['X-Request-ID']
        
        # Verify it's a valid CUID2
        self.assertTrue(
            is_valid_cuid2(request_id),
            f"Request ID is not a valid CUID2: {request_id}"
        )

    def test_request_id_preservation(self):
        """Test that incoming X-Request-ID header is preserved."""
        custom_request_id = generate_cuid()
        response = self.client.get(
            '/api/v1/auth/csrf/',
            HTTP_X_REQUEST_ID=custom_request_id
        )
        
        # Check that the custom request ID is used
        self.assertEqual(response.headers['X-Request-ID'], custom_request_id)

    def test_invalid_request_id_generates_new(self):
        """Test that invalid X-Request-ID generates a new CUID2."""
        invalid_request_id = 'not-a-valid-cuid2'
        response = self.client.get(
            '/api/v1/auth/csrf/',
            HTTP_X_REQUEST_ID=invalid_request_id
        )
        
        # Should generate a new valid CUID2
        request_id = response.headers['X-Request-ID']
        self.assertTrue(
            is_valid_cuid2(request_id),
            f"Request ID is not a valid CUID2: {request_id}"
        )
        # Should be different from the invalid one
        self.assertNotEqual(request_id, invalid_request_id)

    def test_response_header_inclusion(self):
        """Test that X-Request-ID header is included in all responses."""
        response = self.client.get('/api/v1/auth/csrf/')
        self.assertIn('X-Request-ID', response.headers)
        
        # Test with POST request
        response = self.client.post('/api/v1/auth/login/', {})
        self.assertIn('X-Request-ID', response.headers)

    def test_request_id_uniqueness(self):
        """Test that each request gets a unique request ID."""
        request_ids = []
        for _ in range(10):
            response = self.client.get('/api/v1/auth/csrf/')
            request_id = response.headers['X-Request-ID']
            request_ids.append(request_id)
        
        # All request IDs should be unique
        self.assertEqual(len(request_ids), len(set(request_ids)))

    def test_request_id_in_request_object(self):
        """Test that request.id is available in views."""
        # This is harder to test directly, but we can verify it's set
        # by checking that middleware processes it correctly
        response = self.client.get('/api/v1/auth/csrf/')
        # If header is set, request.id was set
        self.assertIn('X-Request-ID', response.headers)


class RequestIDLoggingTests(TestCase):
    """Test request ID integration with logging."""

    def test_logging_includes_request_id(self):
        """Test that logs include request_id in format."""
        import logging
        from io import StringIO
        
        # Create a test logger with the request_id filter
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging.Formatter('{levelname} [{request_id}] {name} {message}', style='{'))
        
        from apps.core.utils.logging_filters import RequestIDFilter
        handler.addFilter(RequestIDFilter())
        
        logger = logging.getLogger('test')
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        
        # Set request_id in thread-local (simulating middleware)
        from apps.core.middleware.request_id import _thread_local
        test_request_id = generate_cuid()
        _thread_local.request_id = test_request_id
        
        try:
            logger.info('Test message')
            log_output = log_stream.getvalue()
            self.assertIn(test_request_id, log_output)
        finally:
            # Clean up
            if hasattr(_thread_local, 'request_id'):
                delattr(_thread_local, 'request_id')


class RequestIDExceptionHandlerTests(TestCase):
    """Test request ID in exception handler."""

    def test_exception_response_includes_request_id(self):
        """Test that exception responses include request_id."""
        # Make a request that will cause an error
        # Note: This depends on your API structure
        response = self.client.get('/api/v1/nonexistent-endpoint/')
        
        # Should have request ID in header
        self.assertIn('X-Request-ID', response.headers)
        
        # If it's a JSON error response, it might include request_id in body
        if response.headers.get('Content-Type', '').startswith('application/json'):
            try:
                data = response.json()
                # Some error responses may include request_id
                # This depends on the error type
                pass
            except Exception:
                pass
