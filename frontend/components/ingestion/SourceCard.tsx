'use client'
import Link from 'next/link'

interface SourceCardProps {
  source: {
    _id: string
    name: string
    type: string
    status: string
    stats?: {
      totalChunks?: number
      totalMessages?: number
    }
    ingestedAt: string
    lastSyncAt?: string
  }
}

export default function SourceCard({ source }: SourceCardProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'slack_channel':
        return { icon: '💬', label: 'Slack Channel', color: 'bg-purple-100 text-purple-700' }
      case 'google_doc':
        return { icon: '📄', label: 'Google Doc', color: 'bg-blue-100 text-blue-700' }
      case 'google_drive_folder':
        return { icon: '📁', label: 'Google Drive', color: 'bg-green-100 text-green-700' }
      default:
        return { icon: '📋', label: 'Unknown', color: 'bg-gray-100 text-gray-700' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const typeConfig = getTypeConfig(source.type)

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${typeConfig.color} flex items-center justify-center`}>
              <span className="text-lg">{typeConfig.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{source.name}</h3>
              <p className="text-sm text-gray-600">{typeConfig.label}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(source.status)}`}>
            {source.status}
          </span>
        </div>

        {source.stats && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {source.stats.totalChunks !== undefined && (
              <div>
                <span className="text-gray-500">Chunks:</span>
                <p className="font-semibold">{source.stats.totalChunks.toLocaleString()}</p>
              </div>
            )}
            {source.stats.totalMessages !== undefined && (
              <div>
                <span className="text-gray-500">Messages:</span>
                <p className="font-semibold">{source.stats.totalMessages.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500">
            <p>Added {new Date(source.ingestedAt).toLocaleDateString()}</p>
            {source.lastSyncAt && (
              <p>Last sync {new Date(source.lastSyncAt).toLocaleDateString()}</p>
            )}
          </div>
          <Link 
            href={`/sources/${source._id}`}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  )
}
