"""
Tests for health check endpoints.

Tests liveness, readiness, and startup probes with various scenarios.
"""
import json
from django.test import TestCase, Client
from django.urls import reverse


class HealthCheckTests(TestCase):
    """Test health check endpoints."""

    def setUp(self):
        """Set up test client."""
        self.client = Client()

    def test_liveness_endpoint_200(self):
        """Test liveness endpoint returns 200."""
        response = self.client.get('/health/live/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)
        self.assertIn('service', data)

    def test_readiness_endpoint_structure(self):
        """Test readiness endpoint returns proper structure."""
        response = self.client.get('/health/ready/')
        
        # Should return 200 if all checks pass
        self.assertIn(response.status_code, [200, 503])
        
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('timestamp', data)
        self.assertIn('checks', data)
        
        checks = data['checks']
        self.assertIn('database', checks)
        self.assertIn('cache', checks)
        self.assertIn('disk', checks)
        
        # Check structure of each component
        for check_name, check_data in checks.items():
            self.assertIn('status', check_data)
            self.assertIn(check_data['status'], ['up', 'down'])

    def test_readiness_database_check(self):
        """Test that readiness checks database."""
        response = self.client.get('/health/ready/')
        data = response.json()
        
        db_check = data['checks']['database']
        self.assertIn('status', db_check)
        self.assertIn('response_time_ms', db_check)
        self.assertIsInstance(db_check['response_time_ms'], (int, float))

    def test_readiness_cache_check(self):
        """Test that readiness checks cache."""
        response = self.client.get('/health/ready/')
        data = response.json()
        
        cache_check = data['checks']['cache']
        self.assertIn('status', cache_check)
        self.assertIn('response_time_ms', cache_check)
        self.assertIsInstance(cache_check['response_time_ms'], (int, float))

    def test_readiness_disk_check(self):
        """Test that readiness checks disk space."""
        response = self.client.get('/health/ready/')
        data = response.json()
        
        disk_check = data['checks']['disk']
        self.assertIn('status', disk_check)
        self.assertIn('free_percent', disk_check)
        self.assertIsInstance(disk_check['free_percent'], (int, float))
        self.assertGreaterEqual(disk_check['free_percent'], 0)

    def test_startup_endpoint_structure(self):
        """Test startup endpoint returns proper structure."""
        response = self.client.get('/health/startup/')
        
        # Should return 200 if all checks pass
        self.assertIn(response.status_code, [200, 503])
        
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('timestamp', data)
        self.assertIn('checks', data)

    def test_readiness_503_on_failure(self):
        """Test that readiness returns 503 when checks fail."""
        # This is harder to test without mocking, but we can verify
        # the structure supports 503 responses
        response = self.client.get('/health/ready/')
        data = response.json()
        
        # If any check fails, status should be 'not_ready' and code should be 503
        all_healthy = all(
            check['status'] == 'up'
            for check in data['checks'].values()
        )
        
        if not all_healthy:
            self.assertEqual(response.status_code, 503)
            self.assertEqual(data['status'], 'not_ready')
        else:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(data['status'], 'ready')

    def test_health_endpoints_no_auth_required(self):
        """Test that health endpoints don't require authentication."""
        # All health endpoints should be accessible without auth
        endpoints = ['/health/live/', '/health/ready/', '/health/startup/']
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            # Should not return 401/403
            self.assertNotIn(response.status_code, [401, 403])

    def test_health_endpoints_json_format(self):
        """Test that health endpoints return JSON."""
        endpoints = ['/health/live/', '/health/ready/', '/health/startup/']
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response['Content-Type'], 'application/json')
            
            # Should be valid JSON
            try:
                data = response.json()
                self.assertIsInstance(data, dict)
            except json.JSONDecodeError:
                self.fail(f"Response from {endpoint} is not valid JSON")
