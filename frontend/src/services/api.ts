// Simple API client using fetch instead of axios to avoid module resolution issues
const API_BASE_URL = 'http://localhost:8000';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'blob' | 'text';
}

class ApiClient {
  private baseURL: string;
  private csrfTokenPromise: Promise<string | null> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Ensures CSRF token is available by fetching it if needed
   * This should be called before making authenticated requests
   */
  async ensureCsrfToken(): Promise<string | null> {
    // If we already have a token in cookie, return it
    const existingToken = this.getCsrfTokenFromCookie();
    if (existingToken) {
      return existingToken;
    }

    // If we're already fetching, wait for that
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    // Fetch CSRF token from backend
    this.csrfTokenPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/v1/auth/csrf/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // Token should now be in cookie from the response
          return this.getCsrfTokenFromCookie() || data.csrfToken || null;
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      } finally {
        this.csrfTokenPromise = null;
      }
      return null;
    })();

    return this.csrfTokenPromise;
  }

  private getCsrfTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, responseType: desiredResponseType, ...fetchInit } = options;

    let endpointWithParams = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      if (Array.from(searchParams.keys()).length > 0) {
        const separator = endpoint.includes('?') ? '&' : '?';
        endpointWithParams = `${endpoint}${separator}${searchParams.toString()}`;
      }
    }

    // Prepend /api/v1 to all endpoints for versioning
    // Ensure endpoint starts with / and add /api/v1 prefix
    const normalizedEndpoint = endpointWithParams.startsWith('/') ? endpointWithParams : `/${endpointWithParams}`;
    const versionedEndpoint = normalizedEndpoint.startsWith('/api/v1/') 
      ? normalizedEndpoint 
      : `/api/v1${normalizedEndpoint}`;
    const url = `${this.baseURL}${versionedEndpoint}`;
    
    // Get CSRF token from cookie (for session-based authentication)
    // For state-changing operations, ensure we have a token
    const method = (fetchInit.method || 'GET').toUpperCase();
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    let csrfToken = this.getCsrfTokenFromCookie();
    
    // If we need CSRF and don't have it, try to fetch it (for first request)
    if (needsCsrf && !csrfToken) {
      // Note: This is async, but we'll proceed anyway
      // The token should be available in subsequent requests after first auth call
      csrfToken = await this.ensureCsrfToken();
    }
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add CSRF token for state-changing operations (required by Django SessionAuthentication)
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      defaultHeaders['X-CSRFToken'] = csrfToken;
    }

    const config: RequestInit = {
      ...fetchInit,
      method,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...fetchInit.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401/403 unauthorized/forbidden - user needs to authenticate
      // But don't redirect if this is the login endpoint itself (allow login errors to be shown)
      if ((response.status === 401 || response.status === 403) && !url.includes('/auth/login/')) {
        // Clear any stored auth data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        console.warn('Authentication required. Please log in to access this resource.');
      }

      let data: T;
      const contentType = response.headers.get('content-type');
      
      // Try to parse response body
      try {
        if (desiredResponseType === 'blob') {
          data = (await response.blob()) as T;
        } else if (desiredResponseType === 'text') {
          const textData = await response.text();
          data = (textData as unknown) as T;
        } else if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textData = await response.text();
          data = (textData ? textData : '{}') as unknown as T;
        }
      } catch (parseError) {
        // If parsing fails, set empty data
        data = {} as T;
      }

      // Check response status after parsing
      if (!response.ok) {
        // Include error details from response if available
        const isObject = typeof data === 'object' && data !== null && !(data instanceof Blob);
        const errorMessage = isObject && 'error' in (data as any)
          ? String((data as any).error)
          : `HTTP error! status: ${response.status}`;
        const errorDetails = isObject && 'details' in (data as any)
          ? (data as any).details
          : undefined;
        
        const error = new Error(errorMessage) as Error & { status?: number; details?: any; response?: any };
        error.status = response.status;
        error.details = errorDetails;
        error.response = data;
        throw error;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error('API request failed:', error);
      // Re-throw with more context if it's not already our custom error
      if (error instanceof Error && !('status' in error)) {
        const enhancedError = error as Error & { url?: string };
        enhancedError.url = url;
        throw enhancedError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...(options || {}), method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export the API client instance
export const api = new ApiClient(API_BASE_URL);