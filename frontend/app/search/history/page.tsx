'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchHistory from '@/components/search/SearchHistory'

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
  }
}

export default function SearchHistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch search history from API
    setTimeout(() => {
      setHistory([])
      setLoading(false)
    }, 1000)
  }, [])

  const handleSearchAgain = (query: string, filters?: any) => {
    // Navigate to search page with pre-filled query
    const searchParams = new URLSearchParams()
    searchParams.set('q', query)
    if (filters) {
      searchParams.set('filters', JSON.stringify(filters))
    }
    router.push(`/search?${searchParams.toString()}`)
  }

  const handleDeleteHistory = async (historyId: string) => {
    // TODO: Delete history item
    setHistory(history.filter(item => item._id !== historyId))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading search history...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back to Search
        </button>
        <h1 className="text-3xl font-bold">Search History</h1>
        <p className="text-gray-600">Your recent searches</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No search history</h3>
          <p className="text-gray-500 mb-6">Your search history will appear here.</p>
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start Searching
          </button>
        </div>
      ) : (
        <SearchHistory
          history={history}
          onSearchAgain={handleSearchAgain}
          onDelete={handleDeleteHistory}
        />
      )}
    </div>
  )
}
