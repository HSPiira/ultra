import { api } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  csrfToken?: string;
  user?: User;
}

export const authApi = {
  /**
   * Get CSRF token from backend
   */
  async getCsrfToken(): Promise<string | null> {
    try {
      const response = await api.get<LoginResponse>('/auth/login/');
      return response.data.csrfToken || null;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  },

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // First, get CSRF token
      await this.getCsrfToken();

      // Then perform login
      const response = await api.post<LoginResponse>('/auth/login/', credentials);
      
      // Log response for debugging
      console.log('Login response:', response);
      
      if (response.data.success && response.data.user) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        return response.data;
      } else {
        // Login failed - return error from response
        const errorMsg = response.data.error || 'Login failed';
        console.error('Login failed:', errorMsg, response.data);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      // Extract error message from error response
      // The API client throws an error with error.response containing the parsed JSON data
      let errorMessage = 'Login failed';
      if (error.response && typeof error.response === 'object') {
        // Error response from API client - the response property contains the backend JSON
        errorMessage = error.response.error || errorMessage;
      } else if (error.message && !error.message.includes('HTTP error! status: 401')) {
        // Use error message if it's not the generic HTTP error
        errorMessage = error.message;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/', {});
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local storage anyway
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const isAuth = localStorage.getItem('isAuthenticated');
    const user = this.getCurrentUser();
    return isAuth === 'true' && user !== null;
  },
};
