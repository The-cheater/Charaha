'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SourceSettings() {
  const params = useParams()
  const router = useRouter()
  const sourceId = params.id as string

  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: '1h',
    includePrivate: false,
    notifications: true
  })

  const handleSave = async () => {
    // TODO: Save settings to API
    console.log('Saving settings:', settings)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back to Source
        </button>
        <h1 className="text-3xl font-bold">Source Settings</h1>
        <p className="text-gray-600">Configure settings for this data source</p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Auto Sync</h3>
              <p className="text-sm text-gray-600">Automatically sync new content</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
              className="toggle"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Sync Interval</label>
            <select
              value={settings.syncInterval}
              onChange={(e) => setSettings({...settings, syncInterval: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="15m">Every 15 minutes</option>
              <option value="1h">Every hour</option>
              <option value="6h">Every 6 hours</option>
              <option value="24h">Daily</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Include Private Content</h3>
              <p className="text-sm text-gray-600">Include private channels/files</p>
            </div>
            <input
              type="checkbox"
              checked={settings.includePrivate}
              onChange={(e) => setSettings({...settings, includePrivate: e.target.checked})}
              className="toggle"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600">Get notified about sync status</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              className="toggle"
            />
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
