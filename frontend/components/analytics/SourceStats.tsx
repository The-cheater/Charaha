'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SourceStatsData {
  totalSources: number
  totalDocuments: number
  totalChunks: number
  storageUsed: number
  sourceBreakdown: Array<{
    type: string
    count: number
    documents: number
    chunks: number
    lastSync: string
    status: 'active' | 'inactive' | 'error'
  }>
  recentActivity: Array<{
    action: string
    source: string
    timestamp: string
    status: 'success' | 'failed' | 'processing'
  }>
  syncStatus: {
    totalSyncing: number
    lastSyncTime: string
    nextScheduledSync: string
  }
}

export default function SourceStats() {
  const [stats, setStats] = useState<SourceStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/analytics/sources')
      // setStats(response.data)
      
      // Mock data
      setTimeout(() => {
        setStats({
          totalSources: 12,
          totalDocuments: 3847,
          totalChunks: 18492,
          storageUsed: 2.3, // GB
          sourceBreakdown: [
            {
              type: 'slack_channel',
              count: 5,
              documents: 1249,
              chunks: 8934,
              lastSync: '2025-09-14T10:30:00Z',
              status: 'active'
            },
            {
              type: 'google_doc',
              count: 4,
              documents: 1876,
              chunks: 7213,
              lastSync: '2025-09-14T09:15:00Z',
              status: 'active'
            },
            {
              type: 'google_drive_folder',
              count: 2,
              documents: 634,
              chunks: 1892,
              lastSync: '2025-09-14T08:45:00Z',
              status: 'active'
            },
            {
              type: 'notion',
              count: 1,
              documents: 88,
              chunks: 453,
              lastSync: '2025-09-13T14:20:00Z',
              status: 'inactive'
            }
          ],
          recentActivity: [
            {
              action: 'Sync completed',
              source: 'Engineering Slack',
              timestamp: '2025-09-14T10:30:00Z',
              status: 'success'
            },
            {
              action: 'Document indexed',
              source: 'API Documentation',
              timestamp: '2025-09-14T10:15:00Z',
              status: 'success'
            },
            {
              action: 'Sync started',
              source: 'Product Docs Drive',
              timestamp: '2025-09-14T10:00:00Z',
              status: 'processing'
            },
            {
              action: 'Sync failed',
              source: 'Marketing Notion',
              timestamp: '2025-09-14T09:45:00Z',
              status: 'failed'
            },
            {
              action: 'New source added',
              source: 'Support Slack',
              timestamp: '2025-09-14T09:30:00Z',
              status: 'success'
            }
          ],
          syncStatus: {
            totalSyncing: 2,
            lastSyncTime: '2025-09-14T10:30:00Z',
            nextScheduledSync: '2025-09-14T11:00:00Z'
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch source stats:', error)
      setLoading(false)
    }
  }

  const formatFileSize = (gb: number) => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(1)} MB`
    }
    return `${gb.toFixed(1)} GB`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'slack_channel': return '💬'
      case 'google_doc': return '📄'
      case 'google_drive_folder': return '📁'
      case 'notion': return '📝'
      default: return '📋'
    }
  }

  const getSourceLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'success': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load source statistics</p>
        <button 
          onClick={fetchStats}
          className="mt-2 text-blue-500 hover:text-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Source Analytics</h2>
        <Link 
          href="/sources"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Manage Sources
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Sources</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSources}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Chunks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChunks.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.storageUsed)}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Source Breakdown</h3>
        <div className="space-y-4">
          {stats.sourceBreakdown.map((source, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-4 last:border-b-0">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getSourceIcon(source.type)}</span>
                <div>
                  <p className="font-medium">{getSourceLabel(source.type)}</p>
                  <p className="text-sm text-gray-600">{source.count} sources</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="font-semibold">{source.documents.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">documents</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{source.chunks.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">chunks</p>
                </div>
                <div className="text-center">
                  <p className="text-sm">{formatTimeAgo(source.lastSync)}</p>
                  <p className="text-xs text-gray-600">last sync</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                  {source.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Sync Status</h3>
          {stats.syncStatus.totalSyncing > 0 && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">{stats.syncStatus.totalSyncing} sources syncing</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Last Sync</p>
            <p className="font-semibold">{formatTimeAgo(stats.syncStatus.lastSyncTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Scheduled Sync</p>
            <p className="font-semibold">
              {new Date(stats.syncStatus.nextScheduledSync).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Currently Syncing</p>
            <p className="font-semibold">{stats.syncStatus.totalSyncing} sources</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(activity.status).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[1]}`}></span>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.action}</span>
                  {' '}for{' '}
                  <span className="font-medium">{activity.source}</span>
                </p>
                <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
