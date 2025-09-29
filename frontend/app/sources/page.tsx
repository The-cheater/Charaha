'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import SourceCard from '@/components/ingestion/SourceCard'

interface Source {
  _id: string
  name: string
  type: string
  status: string
  stats?: {
    totalChunks?: number
    totalMessages?: number
  }
  ingestedAt: string
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setSources([])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading sources...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Data Sources</h1>
        <Link 
          href="/sources/add/slack"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Source
        </Link>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-6a2 2 0 00-2 2v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3a2 2 0 00-2-2H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data sources yet</h3>
          <p className="text-gray-500 mb-6">Get started by connecting your first data source.</p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/sources/add/slack"
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Connect Slack
            </Link>
            <Link
              href="/sources/add/google"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect Google Drive
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <SourceCard key={source._id} source={source} />
          ))}
        </div>
      )}
    </div>
  )
}
