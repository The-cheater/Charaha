// components/ingestion/SlackConnector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Hash, 
  Download, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { api, SlackChannel } from '@/lib/api';

interface SlackConnectorProps {
  onIngestionComplete?: (results: { processed: number; stored: number; failed?: number }) => void;
}

interface IngestionStatus {
  channelId: string;
  status: 'idle' | 'ingesting' | 'success' | 'error';
  progress?: number;
  message?: string;
  results?: { processed: number; stored: number; failed?: number };
}

export function SlackConnector({ onIngestionComplete }: SlackConnectorProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestionStatuses, setIngestionStatuses] = useState<Record<string, IngestionStatus>>({});
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check Slack connection status
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const response = await api.healthCheck();
      
      if (response.data?.services?.slack?.status === 'healthy') {
        setConnectionStatus('connected');
        loadChannels();
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setError('Failed to connect to Slack workspace');
    }
  };

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getSlackChannels();
      if (response.data) {
        setChannels(response.data.channels);
        
        // Initialize ingestion statuses
        const statuses: Record<string, IngestionStatus> = {};
        response.data.channels.forEach(channel => {
          statuses[channel.id] = { channelId: channel.id, status: 'idle' };
        });
        setIngestionStatuses(statuses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Slack channels');
    } finally {
      setIsLoading(false);
    }
  };

  const ingestChannel = async (channelId: string, limit = 100) => {
    setIngestionStatuses(prev => ({
      ...prev,
      [channelId]: { 
        ...prev[channelId], 
        status: 'ingesting', 
        progress: 0,
        message: 'Starting ingestion...'
      }
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setIngestionStatuses(prev => {
          if (prev[channelId]?.status === 'ingesting') {
            const currentProgress = prev[channelId]?.progress || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 20, 90);
            
            return {
              ...prev,
              [channelId]: {
                ...prev[channelId],
                progress: newProgress,
                message: `Processing messages... ${Math.round(newProgress)}%`
              }
            };
          }
          return prev;
        });
      }, 1000);

      const response = await api.ingestSlackChannel(channelId, limit);
      
      clearInterval(progressInterval);

      if (response.data) {
        setIngestionStatuses(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            status: 'success',
            progress: 100,
            message: `Successfully processed ${response.data!.processed} messages`,
            results: response.data!
          }
        }));

        onIngestionComplete?.(response.data);
      }
    } catch (err: any) {
      setIngestionStatuses(prev => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          status: 'error',
          message: err.message || 'Ingestion failed'
        }
      }));
    }
  };

  const ingestSelectedChannels = async () => {
    for (const channelId of selectedChannels) {
      await ingestChannel(channelId);
      // Small delay between channels
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setSelectedChannels(new Set());
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const memberChannels = channels.filter(c => c.isMember).map(c => c.id);
    setSelectedChannels(new Set(memberChannels));
  };

  const clearSelection = () => {
    setSelectedChannels(new Set());
  };

  const getStatusIcon = (status: IngestionStatus['status']) => {
    switch (status) {
      case 'ingesting':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: IngestionStatus['status']) => {
    switch (status) {
      case 'ingesting':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  if (connectionStatus === 'checking') {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Checking Slack connection...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Slack Not Connected</h3>
          <p className="text-gray-600 mb-4">
            Unable to connect to your Slack workspace. Please check your configuration.
          </p>
          <Button onClick={checkConnection} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Slack Workspace Connected</h3>
              <p className="text-sm text-gray-600">TeamMemory Search workspace is active</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700">Connected</Badge>
        </div>
      </Card>

      {/* Bulk Actions */}
      {channels.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bulk Channel Ingestion</h3>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={channels.filter(c => c.isMember).length === 0}
              >
                Select All Available
              </Button>
              {selectedChannels.size > 0 && (
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear ({selectedChannels.size})
                </Button>
              )}
            </div>
          </div>
          
          {selectedChannels.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedChannels.size} channel{selectedChannels.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                onClick={ingestSelectedChannels}
                disabled={Object.values(ingestionStatuses).some(s => s.status === 'ingesting')}
              >
                <Download className="h-4 w-4 mr-2" />
                Ingest Selected
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Channels List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Available Channels</h3>
            <p className="text-sm text-gray-600">
              Select channels to ingest their messages for AI-powered search
            </p>
          </div>
          <Button
            onClick={loadChannels}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading channels...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((channel) => {
              const status = ingestionStatuses[channel.id];
              return (
                <div
                  key={channel.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedChannels.has(channel.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedChannels.has(channel.id)}
                        onChange={() => toggleChannelSelection(channel.id)}
                        disabled={!channel.isMember || status?.status === 'ingesting'}
                        className="rounded"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          channel.isPrivate ? 'bg-orange-400' : 'bg-green-400'
                        }`} />
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {channel.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {status && getStatusBadge(status.status)}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{channel.memberCount}</span>
                        </div>
                        
                        {channel.isMember ? (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            ✅ Bot member
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            ❌ Bot not member
                          </Badge>
                        )}
                      </div>

                      <Button
                        onClick={() => ingestChannel(channel.id)}
                        disabled={!channel.isMember || status?.status === 'ingesting'}
                        size="sm"
                      >
                        {status?.status === 'ingesting' ? (
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.status)}
                            <span>{Math.round(status.progress || 0)}%</span>
                          </div>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Ingest
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Channel Description */}
                  {channel.purpose && (
                    <p className="text-sm text-gray-600 mt-2 ml-8">
                      {channel.purpose}
                    </p>
                  )}

                  {/* Status Message */}
                  {status?.message && (
                    <div className="mt-3 ml-8">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status.status)}
                        <span className="text-sm text-gray-600">
                          {status.message}
                        </span>
                      </div>
                      
                      {status.status === 'ingesting' && status.progress && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {status.results && (
                        <div className="mt-2 text-xs text-gray-500">
                          Processed: {status.results.processed} • Stored: {status.results.stored}
                          {status.results.failed && ` • Failed: ${status.results.failed}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {channels.length === 0 && !error && (
              <div className="text-center py-8 text-gray-500">
                No channels found. Make sure your Slack app is properly configured.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>1. Invite the bot:</strong> For channels showing "Bot not member", go to Slack and type:</p>
              <code className="block bg-white px-3 py-1 rounded border text-blue-900">
                /invite @TeamMemory Search
              </code>
              <p><strong>2. Ingest messages:</strong> Click "Ingest" to process recent conversations</p>
              <p><strong>3. Start searching:</strong> Use natural language to find any conversation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
