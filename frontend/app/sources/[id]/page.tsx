'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import IngestionStatus from '@/components/ingestion/IngestionStatus'

interface SourceDetail {
  _id: string
  name: string
  type: string
  status: string
  metadata: {
    url?: string
    workspace?: string
    fileName?: string
  }
  stats: {
    totalChunks: number
    totalMessages: number
    lastMessageDate?: string
  }
  ingestedAt: string
  lastSyncAt?: string
}

export default function SourceDetails() {
  const params = useParams()
  const router = useRouter()
  const sourceId = params.id as string
  
  const [source, setSource] = useState<SourceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch source details from API
    setTimeout(() => {
      // Mock data
      setSource({
        _id: sourceId,
        name: 'Engineering Team',
        type: 'slack_channel',
        status: 'completed',
        metadata: {
          workspace: 'company-workspace',
          url: 'https://company.slack.com/channels/engineering'
        },
        stats: {
          totalChunks: 150,
          totalMessages: 75,
          lastMessageDate: '2025-09-14T10:30:00Z'
        },
        ingestedAt: '2025-09-01T08:00:00Z',
        lastSyncAt: '2025-09-14T10:30:00Z'
      })
      setLoading(false)
    }, 1000)
  }, [sourceId])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading source details...</div>
      </div>
    )
  }

  if (!source) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Source not found</h2>
          <p className="text-gray-600 mt-2">The requested source could not be found.</p>
          <Link href="/sources" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
            ← Back to Sources
          </Link>
        </div>
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
          ← Back to Sources
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{source.name}</h1>
            <p className="text-gray-600 capitalize">{source.type.replace('_', ' ')}</p>
          </div>
          <Link
            href={`/sources/${sourceId}/settings`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <IngestionStatus 
            status={source.status as any}
            message={`Last synced: ${source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString() : 'Never'}`}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Chunks:</span>
              <span className="font-semibold">{source.stats.totalChunks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Messages:</span>
              <span className="font-semibold">{source.stats.totalMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Added:</span>
              <span className="font-semibold">{new Date(source.ingestedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Metadata</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {source.metadata.workspace && (
              <div>
                <span className="text-gray-600">Workspace:</span>
                <p className="font-semibold">{source.metadata.workspace}</p>
              </div>
            )}
            {source.metadata.url && (
              <div>
                <span className="text-gray-600">URL:</span>
                <a 
                  href={source.metadata.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 break-all"
                >
                  {source.metadata.url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Sync Now
        </button>
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Remove Source
        </button>
      </div>
    </div>
  )
}
