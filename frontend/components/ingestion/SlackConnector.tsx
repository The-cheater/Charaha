import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SlackConnector() {
  const [slackToken, setSlackToken] = useState('');
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!slackToken) return;

    setIsConnecting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock connected channels
      const mockChannels = ['general', 'random', 'development', 'design'];
      setConnectedChannels(mockChannels);
    } catch (error) {
      console.error('Failed to connect to Slack:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (channel: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setConnectedChannels(prev => prev.filter(c => c !== channel));
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Slack Integration</CardTitle>
        <CardDescription>
          Connect your Slack workspace to enable search across your channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="password"
            placeholder="Enter your Slack Bot Token"
            value={slackToken}
            onChange={(e) => setSlackToken(e.target.value)}
          />
        </div>

        <Button
          onClick={handleConnect}
          disabled={!slackToken || isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Slack'}
        </Button>

        {connectedChannels.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Connected Channels:</h4>
            <div className="space-y-2">
              {connectedChannels.map((channel) => (
                <div key={channel} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">#{channel}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(channel)}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
