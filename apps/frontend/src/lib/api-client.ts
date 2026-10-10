import { API_CONFIG } from '@/config/api.config';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { errorLogger, ErrorSeverity, ErrorCategory } from '@/services/error-logger.service';

/**
 * API Client with automatic error tracking
 */
class ApiClient {
  private instance: AxiosInstance;
  private apiUrl: string;

  constructor() {
    this.apiUrl = API_CONFIG.API_URL;

    this.instance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor - add auth token
    this.instance.interceptors.request.use(
      (config) => {
        // Add JWT token from localStorage if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Log API call start time
        if (config.headers) {
          config.headers['X-Request-Start-Time'] = Date.now().toString();
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - handle errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful API call
        this.logSuccessfulApiCall(response);
        return response;
      },
      (error: AxiosError) => {
        // Log failed API call
        this.logFailedApiCall(error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Log successful API call
   */
  private logSuccessfulApiCall(response: AxiosResponse) {
    if (process.env.NODE_ENV === 'development') {
      const startTime = parseInt(response.config.headers?.['X-Request-Start-Time'] as string || '0', 10);
      const duration = Date.now() - startTime;

      console.log(
        `✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`,
      );
    }
  }

  /**
   * Log failed API call with error tracking
   */
  private logFailedApiCall(error: AxiosError) {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 0;
    const message = this.extractErrorMessage(error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ API Error: ${method} ${url} - ${status} ${message}`,
        error,
      );
    }

    // Get current user ID if available
    let userId: number | undefined;
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Log to backend error tracking
    errorLogger.logApiError(url, method, status, message, userId);
  }

  /**
   * Extract error message from axios error
   */
  private extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (typeof data === 'string') return data;
    }

    if (error.message) return error.message;

    return 'Unknown error';
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
