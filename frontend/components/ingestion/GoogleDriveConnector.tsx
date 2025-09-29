'use client'
import { useState } from 'react'

interface GoogleDriveConnectorProps {
  onConnect?: (data: any) => void
}

export default function GoogleDriveConnector({ onConnect }: GoogleDriveConnectorProps) {
  const [folderUrl, setFolderUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      let folderId = null
      
      if (folderUrl.trim()) {
        // Extract folder ID from Google Drive URL
        const match = folderUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/)
        folderId = match ? match[1] : null
      }

      await onConnect?.({ 
        folderUrl: folderUrl.trim() || null,
        folderId,
        type: 'google-drive' 
      })
    } catch (error) {
      console.error('Failed to connect Google Drive:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Folder URL (Optional)
        </label>
        <input
          type="url"
          value={folderUrl}
          onChange={(e) => setFolderUrl(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://drive.google.com/drive/folders/..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify a folder to limit access, or leave empty for full access
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Connecting...' : 'Connect Google Drive'}
      </button>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• You'll be redirected to Google to authorize access</p>
        <p>• We only read documents, never modify or delete</p>
        <p>• Supports Google Docs, Sheets, and uploaded files</p>
        <p>• You can revoke access anytime from Google Account settings</p>
      </div>
    </div>
  )
}
