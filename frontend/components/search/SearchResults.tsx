'use client'

interface SearchResult {
  id: string
  score: number
  text: string
  source: string
  snippet: string
  metadata: {
    createdAt: string
    category?: string
    author?: string
    [key: string]: any
  }
}

interface SearchResultsProps {
  results: any[]
  query: string
  loading?: boolean
  responseTime?: number
  isLoading?: boolean // For backward compatibility
}

export default function SearchResults({ 
  results, 
  query, 
  loading = false, 
  isLoading = loading, // Support both loading and isLoading for backward compatibility
  responseTime 
}: SearchResultsProps) {
{{ ... }}
    return Math.round(score * 100)
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'slack': return '💬'
      case 'google-docs': return '📄'
      case 'notion': return '📝'
      case 'confluence': return '🏢'
      default: return '📋'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const highlightQuery = (text: string, query: string) => {
    if (!query) return text
    
    const queryWords = query.split(' ').filter(w => w.length > 2)
    let highlightedText = text
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      )
    })
    
    return highlightedText
  }

  if (loading || isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-full mb-1"></div>
            <div className="bg-gray-200 h-3 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500">
          Try adjusting your search terms or check your spelling.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold">{results.length}</span> results for "{query}"
        </div>
        {responseTime && (
          <div className="text-sm text-gray-500">
            Response time: {responseTime}ms
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {results.map((result) => (
          <div key={result.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Result Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getSourceIcon(result.source)}</span>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {result.source.replace('-', ' ')}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatDate(result.metadata.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {formatScore(result.score)}% match
                </div>
              </div>
            </div>

            {/* Result Content */}
            <div className="mb-3">
              <p 
                className="text-gray-900 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: highlightQuery(result.snippet, query) 
                }}
              />
            </div>

            {/* Result Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {result.metadata.author && (
                <span>By {result.metadata.author}</span>
              )}
              {result.metadata.category && (
                <span>Category: {result.metadata.category}</span>
              )}
              <span>ID: {result.id}</span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center space-x-3">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Full Content
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-800">
                Similar Results
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-800">
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {results.length >= 5 && (
        <div className="text-center pt-6">
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Load More Results
          </button>
        </div>
      )}
    </div>
  )
}
