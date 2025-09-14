'use client'

interface SearchHistoryItem {
  _id: string
  query: string
  resultCount: number
  responseTime: number
  createdAt: string
  filters?: {
    sources?: string[]
    dateFrom?: string
    dateTo?: string
    authors?: string[]
  }
}

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  onSearchAgain?: (query: string, filters?: any) => void
  onDelete?: (historyId: string) => void
}

export default function SearchHistory({ history, onSearchAgain, onDelete }: SearchHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const getFiltersText = (filters?: SearchHistoryItem['filters']) => {
    if (!filters) return null
    
    const filterParts = []
    if (filters.sources?.length) {
      filterParts.push(`Sources: ${filters.sources.join(', ')}`)
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = [filters.dateFrom, filters.dateTo].filter(Boolean).join(' to ')
      filterParts.push(`Date: ${dateRange}`)
    }
    if (filters.authors?.length) {
      filterParts.push(`Authors: ${filters.authors.join(', ')}`)
    }
    
    return filterParts.length > 0 ? filterParts.join(' • ') : null
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No search history</h3>
        <p className="text-gray-500">Your searches will appear here for easy access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item._id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => onSearchAgain?.(item.query, item.filters)}
                  className="text-lg font-medium text-gray-900 hover:text-blue-600 text-left"
                >
                  "{item.query}"
                </button>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {item.resultCount} results
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.responseTime}ms
                  </span>
                </div>
              </div>

              {getFiltersText(item.filters) && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1 mb-2">
                  {getFiltersText(item.filters)}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSearchAgain?.(item.query, item.filters)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Search Again
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item._id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
