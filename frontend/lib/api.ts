import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// API endpoints
export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post('/api/auth/login', data),
    register: (data: { name: string; email: string; password: string }) =>
      apiClient.post('/api/auth/register', data),
    logout: () => apiClient.post('/api/auth/logout'),
    resetPassword: (email: string) =>
      apiClient.post('/api/auth/reset-password', { email }),
  },

  // Search
  search: {
    query: (query: string, filters?: any) =>
      apiClient.post('/api/query/search', { query, ...filters }),
    history: () => apiClient.get('/api/query/history'),
    deleteHistory: (id: string) => apiClient.delete(`/api/query/history/${id}`),
  },

  // Sources
  sources: {
    list: () => apiClient.get('/api/sources'),
    add: (data: any) => apiClient.post('/api/sources', data),
    remove: (id: string) => apiClient.delete(`/api/sources/${id}`),
    sync: (id: string) => apiClient.post(`/api/sources/${id}/sync`),
  },

  // Ingestion
  ingest: {
    slack: (data: any) => apiClient.post('/api/ingest/slack', data),
    googleDrive: (data: any) => apiClient.post('/api/ingest/google-drive', data),
    status: (jobId: string) => apiClient.get(`/api/ingest/status/${jobId}`),
  },

  // Analytics
  analytics: {
    stats: () => apiClient.get('/api/analytics/stats'),
    topSearches: () => apiClient.get('/api/analytics/top-searches'),
    sourceDistribution: () => apiClient.get('/api/analytics/source-distribution'),
  },

  // User
  user: {
    profile: () => apiClient.get('/api/user/profile'),
    update: (data: any) => apiClient.put('/api/user/profile', data),
    settings: () => apiClient.get('/api/user/settings'),
    updateSettings: (data: any) => apiClient.put('/api/user/settings', data),
  },
};
