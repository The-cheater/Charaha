"use client"

import { SearchResult } from '@/types'
import { ResultCard } from './ResultCard'
import { Card, CardContent } from '@/components/ui/card'
import SearchIcon from '@mui/icons-material/Search'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  query: string
}

export function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-funnel text-xl font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground font-dm-sans max-w-md mx-auto">
          We couldn't find anything matching "{query}". Try adjusting your search terms or check your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-dm-sans">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>
      
      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} query={query} />
        ))}
      </div>
    </div>
  )
}
