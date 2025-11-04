"""
Health check endpoints for monitoring and orchestration.

Provides liveness, readiness, and startup probes for Kubernetes/Docker
and monitoring systems.
"""
import os
import shutil
from datetime import datetime, timezone
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(cache_page(5), name='dispatch')  # Cache for 5 seconds
class HealthCheckView(View):
    """
    Base health check view with common functionality.
    """
    
    def get_health_checks(self):
        """
        Run health checks and return results.
        
        Returns:
            dict: Health check results with status and details
        """
        checks = {}
        
        # Database check
        db_status, db_response_time = self._check_database()
        checks['database'] = {
            'status': 'up' if db_status else 'down',
            'response_time_ms': db_response_time,
        }
        
        # Cache check
        cache_status, cache_response_time = self._check_cache()
        checks['cache'] = {
            'status': 'up' if cache_status else 'down',
            'response_time_ms': cache_response_time,
        }
        
        # Disk space check
        disk_status, disk_free_percent = self._check_disk_space()
        checks['disk'] = {
            'status': 'up' if disk_status else 'down',
            'free_percent': disk_free_percent,
        }
        
        return checks
    
    def _check_database(self):
        """
        Check database connectivity.
        
        Returns:
            tuple: (is_healthy: bool, response_time_ms: float)
        """
        import time
        start_time = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            return True, round(response_time, 2)
        except Exception:
            response_time = (time.time() - start_time) * 1000
            return False, round(response_time, 2)
    
    def _check_cache(self):
        """
        Check cache availability.
        
        Returns:
            tuple: (is_healthy: bool, response_time_ms: float)
        """
        import time
        start_time = time.time()
        try:
            test_key = 'health_check_test'
            cache.set(test_key, 'test', 10)
            cache.get(test_key)
            cache.delete(test_key)
            response_time = (time.time() - start_time) * 1000
            return True, round(response_time, 2)
        except Exception:
            response_time = (time.time() - start_time) * 1000
            return False, round(response_time, 2)
    
    def _check_disk_space(self):
        """
        Check disk space availability.
        
        Returns:
            tuple: (is_healthy: bool, free_percent: float)
        """
        try:
            # Get disk space for the project directory
            stat = shutil.disk_usage(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            free_percent = (stat.free / stat.total) * 100
            
            # Consider healthy if > 10% free
            is_healthy = free_percent > 10.0
            return is_healthy, round(free_percent, 2)
        except Exception:
            return False, 0.0


class LivenessProbeView(HealthCheckView):
    """
    Liveness probe endpoint.
    
    Returns 200 if the application is running.
    No dependency checks - just confirms the process is alive.
    """
    
    def get(self, request):
        """Return liveness status."""
        return JsonResponse({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'service': 'ultra-health-insurance-api',
        })


class ReadinessProbeView(HealthCheckView):
    """
    Readiness probe endpoint.
    
    Returns 200 if the application is ready to serve traffic.
    Checks critical dependencies (database, cache, disk).
    """
    
    def get(self, request):
        """Return readiness status with dependency checks."""
        checks = self.get_health_checks()
        
        # Determine overall status
        all_healthy = all(
            check['status'] == 'up'
            for check in checks.values()
        )
        
        status_code = 200 if all_healthy else 503
        
        response_data = {
            'status': 'ready' if all_healthy else 'not_ready',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'checks': checks,
        }
        
        return JsonResponse(response_data, status=status_code)


class StartupProbeView(HealthCheckView):
    """
    Startup probe endpoint.
    
    Returns 200 once the application has completed startup.
    Similar to readiness but used during initial startup phase.
    """
    
    def get(self, request):
        """Return startup status with dependency checks."""
        checks = self.get_health_checks()
        
        # Determine overall status
        all_healthy = all(
            check['status'] == 'up'
            for check in checks.values()
        )
        
        status_code = 200 if all_healthy else 503
        
        response_data = {
            'status': 'started' if all_healthy else 'starting',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'checks': checks,
        }
        
        return JsonResponse(response_data, status=status_code)
