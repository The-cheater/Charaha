export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: 'admin' | 'user';
    createdAt?: string;
  }
  
  export interface SearchResult {
    id: string;
    title: string;
    content: string;
    source: string;
    type: 'document' | 'message' | 'spreadsheet' | 'presentation';
    date: string;
    relevance: number;
    url?: string;
    metadata?: Record<string, any>;
  }
  
  export interface Source {
    id: string;
    name: string;
    type: 'slack' | 'google-drive' | 'notion' | 'github';
    status: 'active' | 'syncing' | 'error' | 'inactive';
    documents: number;
    lastSync: string;
    icon: string;
    color: string;
  }
  
  export interface SearchHistory {
    id: string;
    query: string;
    timestamp: string;
    results: number;
    source: string;
  }
  
  export interface AnalyticsStats {
    totalSearches: number;
    activeUsers: number;
    avgQueryTime: number;
    successRate: number;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  