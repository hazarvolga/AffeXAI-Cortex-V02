import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    // Use the environment variable for the base URL, fallback to localhost:9005 if not set
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9005/api';
    
    this.instance = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // You can add authentication tokens here if needed
        console.log('Making request to:', config.url);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log('Response received:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('API Error:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config).then((response) => response.data);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config).then((response) => response.data);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config).then((response) => response.data);
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config).then((response) => response.data);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config).then((response) => response.data);
  }
}

const httpClient = new HttpClient();
export default httpClient;