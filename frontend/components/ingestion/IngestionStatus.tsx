'use client'

interface IngestionStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  message?: string
}

export default function IngestionStatus({ status, progress, message }: IngestionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
          icon: '⏳',
          label: 'Pending'
        }
      case 'processing':
        return {
          color: 'text-blue-700 bg-blue-100 border-blue-200',
          icon: '⚡',
          label: 'Processing'
        }
      case 'completed':
        return {
          color: 'text-green-700 bg-green-100 border-green-200',
          icon: '✅',
          label: 'Completed'
        }
      case 'failed':
        return {
          color: 'text-red-700 bg-red-100 border-red-200',
          icon: '❌',
          label: 'Failed'
        }
      default:
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-200',
          icon: '❓',
          label: 'Unknown'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`p-4 rounded-lg border ${config.color}`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <span className="font-semibold">{config.label}</span>
      </div>

      {status === 'processing' && progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm opacity-90">{message}</p>
      )}

      {status === 'processing' && (
        <div className="flex items-center space-x-1 mt-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          <span className="text-xs">Processing data...</span>
        </div>
      )}
    </div>
  )
}
