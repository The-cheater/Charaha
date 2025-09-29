'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdvancedFilters from '@/components/search/AdvancedFilters'
import SearchResults from '@/components/search/SearchResults'

interface SearchFilters {
  sources: string[]
  dateFrom: string
  dateTo: string
  authors: string[]
}

export default function AdvancedSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    sources: [],
    dateFrom: '',
    dateTo: '',
    authors: []
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      // TODO: Implement actual search API call
      console.log('Searching with:', { query, filters })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResults([])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back to Search
          </button>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-gray-600">Search with detailed filters and options</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <AdvancedFilters onFiltersChange={setFilters} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-lg border mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your search query..."
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <SearchResults results={results} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
