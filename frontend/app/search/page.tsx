"use client"

import { useState } from 'react'
import { SearchInput } from '@/components/search/SearchInput'
import { SearchResults } from '@/components/search/SearchResults'
import { FilterPanel } from '@/components/search/FilterPanel'
import { Card } from '@/components/ui/card'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    setIsSearching(true)
    
    // Simulate API call
    setTimeout(() => {
      setResults([
        {
          id: '1',
          title: 'API Documentation Update',
          content: 'Updated the authentication endpoints with new OAuth2 flow...',
          source: 'google-docs',
          url: 'https://docs.google.com/document/d/1234',
          author: 'john@company.com',
          timestamp: '2025-09-08T10:30:00Z',
          score: 0.95
        },
        // Add more mock results
      ])
      setIsSearching(false)
    }, 1000)
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-funnel text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground font-dm-sans">
          Find information across all your team's knowledge sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel />
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          <SearchInput onSearch={handleSearch} />
          
          {query && (
            <Card className="p-6">
              <SearchResults 
                results={results} 
                isLoading={isSearching} 
                query={query}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
