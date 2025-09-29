'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SlackConnector from '@/components/ingestion/SlackConnector'

export default function ConnectSlack() {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (data: any) => {
    setIsConnecting(true)
    try {
      // TODO: Implement actual Slack connection
      console.log('Connecting Slack:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to sources page
      router.push('/sources')
    } catch (error) {
      console.error('Failed to connect Slack:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <h1 className="text-2xl font-bold mt-4">Connect Slack</h1>
            <p className="text-gray-600 mt-2">
              Connect your Slack workspace to search through messages and conversations.
            </p>
          </div>

          {isConnecting ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Connecting to Slack...</p>
            </div>
          ) : (
            <SlackConnector onConnect={handleConnect} />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Sources
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
