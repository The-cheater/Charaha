export interface User {
    id: string
    email: string
    name: string
    avatar?: string
  }
  
  export interface SearchResult {
    id: string
    title: string
    content: string
    source: 'slack' | 'google-docs' | 'notion'
    url: string
    author: string
    timestamp: string
    score: number
  }
  
  export interface SearchQuery {
    query: string
    filters?: {
      source?: string[]
      dateFrom?: string
      dateTo?: string
    }
    limit?: number
  }
  