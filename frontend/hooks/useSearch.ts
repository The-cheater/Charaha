"use client"

import { useState } from 'react'
import { SearchResult, SearchQuery } from '@/types'

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: SearchQuery) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'API Documentation Update',
          content: 'Updated the authentication endpoints with new OAuth2 flow implementation. This includes breaking changes that affect all client applications.',
          source: 'google-docs',
          url: 'https://docs.google.com/document/d/1234',
          author: 'john@company.com',
          timestamp: '2025-09-08T10:30:00Z',
          score: 0.95
        },
        {
          id: '2',
          title: 'Team Standup Notes',
          content: 'Discussed the new feature rollout timeline and identified potential blockers in the authentication system.',
          source: 'slack',
          url: 'https://slack.com/archives/C123/p1234567890',
          author: 'sarah@company.com',
          timestamp: '2025-09-08T09:15:00Z',
          score: 0.87
        }
      ]
      
      setResults(mockResults)
    } catch (err) {
      setError('Failed to search. Please try again.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

  return {
    results,
    isLoading,
    error,
    search,
    clearResults
  }
}
