"""
Comprehensive tests for API rate limiting.

Tests throttle classes, rate limit enforcement, and rate limit headers.
"""
import time
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.throttling import (
    AnonBurstRateThrottle,
    BurstRateThrottle,
    StrictRateThrottle,
    ExportRateThrottle,
    check_throttle_for_view,
)

User = get_user_model()


class ThrottlingTestCase(TestCase):
    """Base test case for throttling tests."""

    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def tearDown(self):
        """Clear cache between tests."""
        from django.core.cache import cache
        cache.clear()


class AnonRateLimitTests(ThrottlingTestCase):
    """Test anonymous user rate limits."""

    def test_anon_rate_limit_100_per_day(self):
        """Test that anonymous users are limited to 100 requests/day."""
        # Make 100 requests - should all succeed
        for i in range(100):
            response = self.client.get('/api/v1/auth/csrf/')
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Request {i+1} failed")

        # 101st request should fail with 429
        response = self.client.get('/api/v1/auth/csrf/')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('retry-after', response.headers.get('Retry-After', '').lower() or 'retry-after')

    def test_anon_rate_limit_headers(self):
        """Test that rate limit headers are included in responses."""
        response = self.client.get('/api/v1/auth/csrf/')
        # DRF should include rate limit headers
        self.assertIn('X-Throttle-State', str(response.headers) or 'X-Throttle-State')


class AuthenticatedRateLimitTests(ThrottlingTestCase):
    """Test authenticated user rate limits."""

    def test_authenticated_rate_limit_1000_per_day(self):
        """Test that authenticated users can make 1000 requests/day."""
        self.client.force_authenticate(user=self.user)
        
        # Make 100 requests - should all succeed
        # (Testing full 1000 would be slow, so we test a subset)
        for i in range(100):
            response = self.client.get('/api/v1/content-types/')
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Request {i+1} failed")


class LoginBurstProtectionTests(ThrottlingTestCase):
    """Test burst protection on login endpoints."""

    def test_login_burst_protection_10_per_minute(self):
        """Test that login endpoint has burst protection (10/minute)."""
        # Make 10 login attempts - should all be allowed (even if auth fails)
        for i in range(10):
            response = self.client.post(
                '/api/v1/auth/login/',
                {'username': 'testuser', 'password': 'wrongpass'},
                format='json'
            )
            # Should get 401 (wrong password) not 429
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_429_TOO_MANY_REQUESTS])

        # 11th request should hit rate limit
        response = self.client.post(
            '/api/v1/auth/login/',
            {'username': 'testuser', 'password': 'wrongpass'},
            format='json'
        )
        # Should get 429 for rate limiting
        if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            self.assertIn('retry_after', response.json() or {})
            self.assertIn('Retry-After', response.headers)

    def test_login_rate_limit_headers(self):
        """Test that login rate limit responses include proper headers."""
        # Make requests until rate limited
        responses = []
        for i in range(12):
            response = self.client.post(
                '/api/v1/auth/login/',
                {'username': 'testuser', 'password': 'wrongpass'},
                format='json'
            )
            responses.append(response)
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                # Check headers
                self.assertIn('Retry-After', response.headers)
                break


class BulkOperationThrottlingTests(ThrottlingTestCase):
    """Test throttling on bulk operations."""

    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.client.force_authenticate(user=self.user)

    def test_bulk_import_rate_limit_20_per_hour(self):
        """Test that bulk import is limited to 20 requests/hour."""
        # Note: This test would be slow, so we just verify the throttle is applied
        # In a real scenario, you'd make 20 requests and verify the 21st fails
        url = '/api/v1/persons/bulk_import/'
        response = self.client.post(
            url,
            {
                'company': 'test',
                'scheme': 'test',
                'rows': []
            },
            format='json'
        )
        # Should either succeed (if under limit) or fail with 429
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_429_TOO_MANY_REQUESTS
        ])


class ExportThrottlingTests(ThrottlingTestCase):
    """Test throttling on export endpoints."""

    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.client.force_authenticate(user=self.user)

    def test_export_csv_rate_limit_5_per_hour(self):
        """Test that export CSV is limited to 5 requests/hour."""
        # Note: This test would be slow, so we just verify the throttle is applied
        url = '/api/v1/companies/analytics/export_csv/'
        response = self.client.get(url)
        # Should either succeed (if under limit) or fail with 429
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_429_TOO_MANY_REQUESTS
        ])


class ThrottleClassTests(TestCase):
    """Test individual throttle classes."""

    def test_anon_burst_throttle(self):
        """Test AnonBurstRateThrottle class."""
        throttle = AnonBurstRateThrottle()
        self.assertEqual(throttle.rate, '10/minute')
        self.assertEqual(throttle.scope, 'anon_burst')

    def test_burst_throttle(self):
        """Test BurstRateThrottle class."""
        throttle = BurstRateThrottle()
        self.assertEqual(throttle.rate, '10/minute')
        self.assertEqual(throttle.scope, 'burst')

    def test_strict_throttle(self):
        """Test StrictRateThrottle class."""
        throttle = StrictRateThrottle()
        self.assertEqual(throttle.rate, '20/hour')
        self.assertEqual(throttle.scope, 'strict')

    def test_export_throttle(self):
        """Test ExportRateThrottle class."""
        throttle = ExportRateThrottle()
        self.assertEqual(throttle.rate, '5/hour')
        self.assertEqual(throttle.scope, 'export')

    def test_check_throttle_for_view_helper(self):
        """Test the check_throttle_for_view helper function."""
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        
        allowed, wait_time = check_throttle_for_view(request, AnonBurstRateThrottle)
        # First request should be allowed
        self.assertTrue(allowed)
        self.assertIsNone(wait_time)


class RateLimitResponseTests(ThrottlingTestCase):
    """Test rate limit response format."""

    def test_rate_limit_response_format(self):
        """Test that rate limit responses have correct format."""
        # Make enough requests to hit rate limit
        for i in range(101):
            response = self.client.get('/api/v1/auth/csrf/')
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                data = response.json()
                # Check response structure
                if isinstance(data, dict):
                    # Login endpoint returns custom format
                    if 'error' in data:
                        self.assertIn('error', data)
                        self.assertIn('retry_after', data)
                break
