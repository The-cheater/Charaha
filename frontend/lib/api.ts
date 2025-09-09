const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(userData: any) {
    return this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  // Search endpoints
  async search(query: any) {
    return this.request<{ results: any[]; total: number }>('/query', {
      method: 'POST',
      body: JSON.stringify(query),
    })
  }

  // Ingestion endpoints
  async ingestSlack(channelId: string, since?: string) {
    return this.request('/ingest/slack', {
      method: 'POST',
      body: JSON.stringify({ channelId, since }),
    })
  }

  async ingestGoogleDocs(fileId: string) {
    return this.request('/ingest/drive', {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    })
  }

  // User endpoints
  async getProfile() {
    return this.request<any>('/user/profile')
  }

  async updateProfile(data: any) {
    return this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Analytics endpoints
  async getAnalytics(timeRange?: string) {
    const params = timeRange ? `?timeRange=${timeRange}` : ''
    return this.request<any>(`/analytics${params}`)
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  }
}

export const api = new ApiClient(API_BASE)
