/**
 * Base API client with axios
 * Handles authentication, error handling, and request/response interceptors
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../../config';

/**
 * API Error response structure
 */
export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

/**
 * Create axios instance with base configuration
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - inject authentication token
  instance.interceptors.request.use(
    async (config) => {
      // Get Clerk token if available
      // This will be set by the auth hook when Clerk is initialized
      const token = (window as any).__CLERK_TOKEN__;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError<ApiError>) => {
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const apiError: ApiError = error.response.data || {
          detail: 'An unexpected error occurred',
        };

        // Log error for debugging
        console.error('API Error:', {
          status: error.response.status,
          data: apiError,
          url: error.config?.url,
        });

        // Handle specific status codes
        switch (error.response.status) {
          case 401:
            // Unauthorized - token expired or invalid
            console.warn('Authentication required or token expired');
            // Could trigger logout or token refresh here
            break;
          case 403:
            // Forbidden - user doesn't have permission
            console.warn('Access forbidden');
            break;
          case 404:
            // Not found
            console.warn('Resource not found');
            break;
          case 500:
            // Server error
            console.error('Server error occurred');
            break;
        }

        return Promise.reject(apiError);
      } else if (error.request) {
        // Request made but no response received
        console.error('Network error:', error.message);
        return Promise.reject({
          detail: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        } as ApiError);
      } else {
        // Something else happened
        console.error('Request error:', error.message);
        return Promise.reject({
          detail: error.message || 'An unexpected error occurred',
          code: 'REQUEST_ERROR',
        } as ApiError);
      }
    }
  );

  return instance;
};

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * Helper function to set authentication token
 * Called by auth hook when user logs in
 */
export const setAuthToken = (token: string | null) => {
  (window as any).__CLERK_TOKEN__ = token;
};

/**
 * Generic API request wrapper with type safety
 */
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.request<T>(config);
  return response.data;
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

export default api;
