// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types
interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface SearchQuery {
  query: string;
  topK?: number;
  filters?: {
    source?: string;
    channelId?: string;
    channelName?: string;
    userId?: string;
    userName?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: {
    source: string;
    messageId: string;
    channelId: string;
    channelName: string;
    userId: string;
    userName: string;
    userRealName: string;
    timestamp: string;
    permalink: string;
    reactions?: any[];
    threadTs?: string;
    replyCount?: number;
  };
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: any[];
}

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  topic: string;
  purpose: string;
  created: string;
  isMember: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Handle specific error cases
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 4000.');
      }
      
      if (error.message?.includes('Invalid token')) {
        // Clear invalid token
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  // Authentication
  async login(credentials: LoginData): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      const response = await this.request<{user: User, token: string}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Store token and user data
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async signup(userData: SignupData): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      const response = await this.request<{user: User, token: string}>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // Store token and user data
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get stored user data
  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Failed to parse stored user data');
          return null;
        }
      }
    }
    return null;
  }

  // Search
  async search(query: SearchQuery): Promise<ApiResponse<{results: SearchResult[], count: number, processingTime?: string}>> {
    try {
      return await this.request<{results: SearchResult[], count: number, processingTime?: string}>('/query', {
        method: 'POST',
        body: JSON.stringify(query),
      });
    } catch (error: any) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Slack Integration
  async getSlackChannels(): Promise<ApiResponse<{channels: SlackChannel[]}>> {
    try {
      return await this.request<{channels: SlackChannel[]}>('/ingest/slack/channels');
    } catch (error: any) {
      console.error('Failed to get Slack channels:', error);
      throw error;
    }
  }

  async ingestSlackChannel(channelId: string, limit = 50): Promise<ApiResponse<{
    channelId: string;
    processed: number;
    stored: number;
    failed?: number;
    errors?: any[];
  }>> {
    try {
      return await this.request<{
        channelId: string;
        processed: number;
        stored: number;
        failed?: number;
        errors?: any[];
      }>('/ingest/slack', {
        method: 'POST',
        body: JSON.stringify({ channelId, limit }),
      });
    } catch (error: any) {
      console.error('Slack ingestion failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    uptime: number;
    services: {
      mongodb: { status: string };
      vector_db: { status: string };
      slack: { status: string };
    };
  }>> {
    try {
      return await this.request<{
        status: string;
        timestamp: string;
        uptime: number;
        services: {
          mongodb: { status: string };
          vector_db: { status: string };
          slack: { status: string };
        };
      }>('/health');
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Check if server is reachable
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();
export type { SearchResult, SlackChannel, SearchQuery, User, ApiResponse };
