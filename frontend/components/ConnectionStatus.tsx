// components/ConnectionStatus.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const { checkConnection } = useAuth();

  useEffect(() => {
    const checkServerStatus = async () => {
      setServerStatus('checking');
      const connected = await checkConnection();
      setServerStatus(connected ? 'connected' : 'disconnected');
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkConnection]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm">No internet connection</span>
        </div>
      </div>
    );
  }

  if (serverStatus === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm">Server disconnected</span>
        </div>
      </div>
    );
  }

  if (serverStatus === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm">Checking connection...</span>
        </div>
      </div>
    );
  }

  return null;
}
