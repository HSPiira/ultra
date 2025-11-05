"""
Response caching utilities for API endpoints.

Provides caching mixins and utilities to reduce database load and improve
user experience by serving cached responses even when rate limited.
"""
import hashlib
import json
from functools import wraps
from typing import Optional, Any, Set

from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
from rest_framework import status


# Default cache timeout (in seconds)
# GET requests: 5 minutes (300 seconds)
# List/retrieve operations can be cached longer
DEFAULT_CACHE_TIMEOUT = 300  # 5 minutes
LIST_CACHE_TIMEOUT = 300     # 5 minutes
DETAIL_CACHE_TIMEOUT = 600   # 10 minutes


def generate_cache_key(request, view_name: str, include_user: bool = True, viewset_instance=None) -> str:
    """
    Generate a cache key for a request.
    
    Args:
        request: The request object
        view_name: Name of the view/endpoint
        include_user: Whether to include user ID in cache key
        viewset_instance: Optional viewset instance (for version lookup)
        
    Returns:
        str: Cache key string
    """
    # Build key components
    key_parts = [f"api:{view_name}"]
    
    # Include cache version (for invalidation support)
    # This allows cache invalidation by incrementing version number
    version_key = f"api:{view_name}:version"
    try:
        version = cache.get(version_key, 0)
        key_parts.append(f"v:{version}")
    except Exception:
        # If versioning fails, continue without version (cache will expire via TTL)
        pass
    
    # Include user ID if authenticated (for user-specific data)
    if include_user and hasattr(request, 'user') and request.user.is_authenticated:
        key_parts.append(f"user:{request.user.id}")
    elif include_user:
        key_parts.append("user:anon")
    
    # Include query parameters for filtering/search
    # Handle both DRF Request objects (query_params) and Django WSGIRequest (GET)
    try:
        if hasattr(request, 'query_params'):
            # DRF Request object
            query_params = request.query_params.dict()
        else:
            # Django WSGIRequest object
            query_params = dict(request.GET)
        
        if query_params:
            # Sort query params for consistent keys
            sorted_params = sorted(query_params.items())
            params_str = json.dumps(sorted_params, sort_keys=True)
            params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
            key_parts.append(f"params:{params_hash}")
    except (AttributeError, TypeError):
        # If query params can't be accessed, skip them
        pass
    
    # Include path parameters (like pk)
    try:
        if hasattr(request, 'resolver_match') and request.resolver_match:
            kwargs = getattr(request.resolver_match, 'kwargs', {})
            if kwargs:
                # Sort kwargs for consistent keys
                sorted_kwargs = sorted(kwargs.items())
                kwargs_str = json.dumps(sorted_kwargs, sort_keys=True)
                kwargs_hash = hashlib.md5(kwargs_str.encode()).hexdigest()[:8]
                key_parts.append(f"kwargs:{kwargs_hash}")
    except (AttributeError, TypeError):
        # resolver_match might not be available in all contexts
        pass
    
    return ":".join(key_parts)


def get_cached_response(cache_key: str) -> Optional[Response]:
    """
    Retrieve a cached response if available.
    
    Args:
        cache_key: The cache key
        
    Returns:
        Response or None if not cached
    """
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        # Reconstruct Response from cached data
        response = Response(
            cached_data.get('data'),
            status=cached_data.get('status', status.HTTP_200_OK)
        )
        # Restore headers if cached
        if 'headers' in cached_data:
            for key, value in cached_data['headers'].items():
                response[key] = value
        # Add cache hit header
        response['X-Cache'] = 'HIT'
        return response
    return None


def cache_response(cache_key: str, response: Response, timeout: int = DEFAULT_CACHE_TIMEOUT):
    """
    Cache a response.
    
    Args:
        cache_key: The cache key
        response: The response to cache
        timeout: Cache timeout in seconds
    """
    # Only cache successful GET responses
    if response.status_code in (200, 201, 204):
        # Extract response data
        cached_data = {
            'data': response.data,
            'status': response.status_code,
            'headers': dict(response.items()),
        }
        cache.set(cache_key, cached_data, timeout)
        response['X-Cache'] = 'MISS'


class CacheableResponseMixin:
    """
    Mixin to add caching support to DRF ViewSets.
    
    Automatically caches GET responses and serves cached responses.
    
    Usage:
        class MyViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
            cache_timeout = 300  # Optional: override default timeout
            cache_list_timeout = 300  # Optional: timeout for list actions
            cache_detail_timeout = 600  # Optional: timeout for detail actions
    """
    
    # Cache timeouts (can be overridden in subclasses)
    cache_timeout = DEFAULT_CACHE_TIMEOUT
    cache_list_timeout = LIST_CACHE_TIMEOUT
    cache_detail_timeout = DETAIL_CACHE_TIMEOUT
    
    def dispatch(self, request, *args, **kwargs):
        """
        Override dispatch to cache GET responses.
        """
        # Proceed with normal request handling
        response = super().dispatch(request, *args, **kwargs)
        
        # Cache successful GET responses
        if request.method == 'GET' and response.status_code == 200:
            cache_key = self._get_cache_key(request)
            timeout = self._get_cache_timeout(request)
            cache_response(cache_key, response, timeout)
            response['X-Cache'] = 'MISS'
        
        return response
    
    def finalize_response(self, request, response, *args, **kwargs):
        """
        Override finalize_response to check cache for GET requests.
        Checks cache before finalization to avoid unnecessary work.
        """
        # Check cache for GET requests before finalization
        if request.method == 'GET' and isinstance(response, Response):
            cache_key = self._get_cache_key(request)
            cached_response = get_cached_response(cache_key)
            if cached_response is not None:
                # Cache hit - finalize the cached response with proper renderer setup
                return super().finalize_response(request, cached_response, *args, **kwargs)
        
        # Cache miss - proceed with normal finalization
        response = super().finalize_response(request, response, *args, **kwargs)
        return response
    
    def _get_cache_key(self, request) -> str:
        """Generate cache key for this request."""
        view_name = self.__class__.__name__.lower()
        # For ModelViewSets, include model name in key
        if hasattr(self, 'queryset') and self.queryset is not None:
            try:
                model_name = self.queryset.model.__name__.lower()
                view_name = f"{view_name}:{model_name}"
            except (AttributeError, TypeError):
                # Queryset might not have a model (e.g., is a manager)
                pass
        # Generate cache key (includes version automatically via generate_cache_key)
        return generate_cache_key(request, view_name, include_user=True)
    
    def _get_cache_timeout(self, request) -> int:
        """Get cache timeout based on action type."""
        action = getattr(self, 'action', None)
        
        # Detail actions (retrieve) can be cached longer
        if action == 'retrieve':
            return self.cache_detail_timeout
        
        # Check if this is a detail view (has pk in kwargs)
        try:
            if hasattr(request, 'resolver_match') and request.resolver_match:
                kwargs = getattr(request.resolver_match, 'kwargs', {})
                if 'pk' in kwargs:
                    return self.cache_detail_timeout
        except (AttributeError, TypeError):
            pass
        
        # List actions
        if action == 'list' or action is None:
            return self.cache_list_timeout
        
        # Default timeout
        return self.cache_timeout
    
    def invalidate_cache(self, pattern: Optional[str] = None, user_id: Optional[int] = None):
        """
        Invalidate cache for this viewset.
        
        Args:
            pattern: Optional pattern to match cache keys (e.g., 'user:123')
                    If None, invalidates all cache for this viewset
            user_id: Optional user ID to invalidate user-specific cache
        """
        view_name = self.__class__.__name__.lower()
        if hasattr(self, 'queryset') and self.queryset is not None:
            try:
                model_name = self.queryset.model.__name__.lower()
                view_name = f"{view_name}:{model_name}"
            except (AttributeError, TypeError):
                pass
        
        # Build base cache key prefix
        base_prefix = f"api:{view_name}"
        
        # Try to get cache keys to invalidate
        # For Redis: use delete_pattern (if available)
        # For other backends: use cache versioning or clear all
        try:
            # Try Redis pattern deletion (if using django-redis)
            if hasattr(cache, 'delete_pattern'):
                pattern_to_delete = f"{base_prefix}:*"
                if user_id:
                    pattern_to_delete = f"{base_prefix}:user:{user_id}:*"
                cache.delete_pattern(pattern_to_delete)
                return
        except AttributeError:
            pass
        
        # Fallback: Use cache versioning approach
        # Increment a version number to invalidate all cache for this viewset
        version_key = f"{base_prefix}:version"
        try:
            current_version = cache.get(version_key, 0)
            cache.set(version_key, current_version + 1, timeout=None)
        except Exception:
            # If versioning fails, we'll rely on TTL expiration
            pass
    
    def _get_cache_version(self) -> int:
        """Get current cache version for this viewset."""
        view_name = self.__class__.__name__.lower()
        if hasattr(self, 'queryset') and self.queryset is not None:
            try:
                model_name = self.queryset.model.__name__.lower()
                view_name = f"{view_name}:{model_name}"
            except (AttributeError, TypeError):
                pass
        
        version_key = f"api:{view_name}:version"
        return cache.get(version_key, 0)


class ThrottleAwareCacheMixin(CacheableResponseMixin):
    """
    Enhanced caching mixin that serves cached responses when throttled.
    
    This mixin checks cache BEFORE throttling, allowing users to access
    cached data even when rate limited.
    
    Automatically invalidates cache on create/update/delete operations.
    
    Usage:
        class MyViewSet(ThrottleAwareCacheMixin, viewsets.ModelViewSet):
            throttle_classes = [StrictRateThrottle]
    """
    
    def dispatch(self, request, *args, **kwargs):
        """
        Override dispatch to check cache first for GET requests.
        This bypasses throttling for cached responses.
        """
        # Proceed with normal request handling
        response = super().dispatch(request, *args, **kwargs)
        
        # Cache successful GET responses
        if request.method == 'GET' and response.status_code == 200:
            cache_key = self._get_cache_key(request)
            timeout = self._get_cache_timeout(request)
            cache_response(cache_key, response, timeout)
            response['X-Cache'] = 'MISS'
        
        # Invalidate cache on mutations (POST, PUT, PATCH, DELETE)
        elif request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            # Invalidate cache for this viewset
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
            self.invalidate_cache(user_id=user_id)
        
        return response
    
    def finalize_response(self, request, response, *args, **kwargs):
        """
        Override finalize_response to check cache for GET requests.
        Checks cache before finalization to avoid unnecessary work.
        """
        # Check cache for GET requests before finalization
        if request.method == 'GET' and isinstance(response, Response):
            cache_key = self._get_cache_key(request)
            cached_response = get_cached_response(cache_key)
            if cached_response is not None:
                # Cache hit - finalize the cached response with proper renderer setup
                return super().finalize_response(request, cached_response, *args, **kwargs)
        
        # Cache miss - proceed with normal finalization
        response = super().finalize_response(request, response, *args, **kwargs)
        return response
    
    def create(self, request, *args, **kwargs):
        """Override create to invalidate cache after creation."""
        response = super().create(request, *args, **kwargs)
        # Cache is invalidated in dispatch, but we can also invalidate specific patterns
        if response.status_code in (200, 201):
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
            self.invalidate_cache(user_id=user_id)
        return response
    
    def update(self, request, *args, **kwargs):
        """Override update to invalidate cache after update."""
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
            self.invalidate_cache(user_id=user_id)
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to invalidate cache after deletion."""
        response = super().destroy(request, *args, **kwargs)
        if response.status_code in (200, 204):
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
            self.invalidate_cache(user_id=user_id)
        return response

