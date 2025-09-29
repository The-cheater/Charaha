// app/sources/slack/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api, SlackChannel } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SlackIntegrationPage() {
  const { isAuthenticated } = useAuth();
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestingChannels, setIngestingChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      loadChannels();
    }
  }, [isAuthenticated]);

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getSlackChannels();
      if (response.data) {
        setChannels(response.data.channels);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Slack channels');
    } finally {
      setIsLoading(false);
    }
  };

  const ingestChannel = async (channelId: string) => {
    setIngestingChannels(prev => new Set(prev.add(channelId)));
    
    try {
      const response = await api.ingestSlackChannel(channelId, 50);
      if (response.data) {
        alert(`Successfully ingested ${response.data.stored} messages from channel!`);
      }
    } catch (err: any) {
      alert(`Failed to ingest channel: ${err.message}`);
    } finally {
      setIngestingChannels(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access Slack integration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Slack Integration</h1>
          <p className="text-gray-600">
            Connect your Slack workspace to make team conversations searchable with AI.
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Slack Workspace</h2>
              <p className="text-sm text-gray-600 mt-1">
                TeamMemory Search workspace is connected
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
          </div>
        </div>

        {/* Channels Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Available Channels</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select channels to ingest their messages for AI-powered search
                </p>
              </div>
              <button
                onClick={loadChannels}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Slack channels...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          channel.isPrivate ? 'bg-orange-400' : 'bg-green-400'
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            #{channel.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{channel.memberCount} members</span>
                            <span>{channel.isMember ? '✅ Bot is member' : '❌ Bot not member'}</span>
                            <span>{channel.isPrivate ? '🔒 Private' : '🌍 Public'}</span>
                          </div>
                          {channel.purpose && (
                            <p className="text-sm text-gray-600 mt-1 max-w-md">
                              {channel.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {!channel.isMember && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          Invite bot first
                        </span>
                      )}
                      <button
                        onClick={() => ingestChannel(channel.id)}
                        disabled={!channel.isMember || ingestingChannels.has(channel.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {ingestingChannels.has(channel.id) ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Ingesting...</span>
                          </div>
                        ) : (
                          'Ingest Messages'
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {channels.length === 0 && !error && (
                  <div className="text-center py-8 text-gray-500">
                    No channels found. Make sure your Slack app is properly configured.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How to use Slack Integration</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. <strong>Invite the bot:</strong> For channels showing "Bot not member", go to the channel in Slack and type <code className="bg-white px-1 rounded">/invite @TeamMemory Search</code></p>
            <p>2. <strong>Ingest messages:</strong> Click "Ingest Messages" to process recent conversations from that channel</p>
            <p>3. <strong>Start searching:</strong> Use the main search page to find conversations using natural language</p>
            <p>4. <strong>AI-powered:</strong> Search works by understanding meaning, not just keywords</p>
          </div>
        </div>
      </div>
    </div>
  );
}
