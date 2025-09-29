// components/dashboard/RecentActivity.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { 
  Clock, 
  Search, 
  TrendingUp, 
  Hash, 
  User, 
  Calendar,
  BarChart3,
  RefreshCw,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useAuth } from '@/hooks/useAuth';

interface RecentActivityProps {
  className?: string;
  maxItems?: number;
}

interface ActivityItem {
  id: string;
  type: 'search' | 'result_click' | 'filter_applied' | 'channel_ingested';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    query?: string;
    resultCount?: number;
    channelName?: string;
    userName?: string;
    score?: number;
    timeSpent?: number;
    url?: string;
  };
  icon: React.ReactNode;
  color: string;
}

export function RecentActivity({ className, maxItems = 10 }: RecentActivityProps) {
  const { searchHistory } = useSearch();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate activity items from search history and synthetic data
  useEffect(() => {
    const generateActivities = () => {
      setIsLoading(true);
      
      const searchActivities: ActivityItem[] = searchHistory.slice(0, 5).map((search, index) => ({
        id: `search-${index}`,
        type: 'search' as const,
        title: `Searched "${search.query}"`,
        description: `Found ${search.count} results`,
        timestamp: search.timestamp,
        metadata: {
          query: search.query,
          resultCount: search.count,
        },
        icon: <Search className="h-4 w-4" />,
        color: 'text-blue-600'
      }));

      // Add some synthetic activity data for demonstration
      const syntheticActivities: ActivityItem[] = [
        {
          id: 'click-1',
          type: 'result_click',
          title: 'Opened Slack message',
          description: 'From #new-channel by sai303599',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          metadata: {
            channelName: 'new-channel',
            userName: 'sai303599',
            score: 0.87,
            url: 'https://teammemorysearch.slack.com/archives/...'
          },
          icon: <ExternalLink className="h-4 w-4" />,
          color: 'text-green-600'
        },
        {
          id: 'filter-1',
          type: 'filter_applied',
          title: 'Applied channel filter',
          description: 'Filtered results to #new-channel',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          metadata: {
            channelName: 'new-channel'
          },
          icon: <Hash className="h-4 w-4" />,
          color: 'text-purple-600'
        },
        {
          id: 'ingest-1',
          type: 'channel_ingested',
          title: 'Channel messages ingested',
          description: '15 new messages from #new-channel',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: {
            channelName: 'new-channel',
            resultCount: 15
          },
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-orange-600'
        }
      ];

      // Combine and sort by timestamp
      const combinedActivities = [...searchActivities, ...syntheticActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);

      setActivities(combinedActivities);
      setIsLoading(false);
    };

    generateActivities();
  }, [searchHistory, maxItems]);

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'search': return 'Search';
      case 'result_click': return 'Clicked';
      case 'filter_applied': return 'Filter';
      case 'channel_ingested': return 'Ingested';
      default: return 'Activity';
    }
  };

  const getActivityTypeBadgeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'search': return 'bg-blue-100 text-blue-700';
      case 'result_click': return 'bg-green-100 text-green-700';
      case 'filter_applied': return 'bg-purple-100 text-purple-700';
      case 'channel_ingested': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.type === 'search' && activity.metadata?.query) {
      // Re-execute search
      // This would trigger a search with the same query
      console.log('Re-execute search:', activity.metadata.query);
    } else if (activity.type === 'result_click' && activity.metadata?.url) {
      // Open the original URL
      window.open(activity.metadata.url, '_blank');
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {activities.length} items
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.reload()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">Start searching to see your activity here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                activity.type === 'search' || activity.type === 'result_click' 
                  ? 'hover:bg-gray-50 cursor-pointer' 
                  : 'bg-gray-50/50'
              }`}
              onClick={() => handleActivityClick(activity)}
            >
              {/* Avatar/Icon */}
              <div className="flex-shrink-0">
                {activity.type === 'search' || activity.type === 'result_click' ? (
                  <Avatar className="w-8 h-8">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {user?.name.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className={activity.color}>
                      {activity.icon}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${getActivityTypeBadgeColor(activity.type)}`}
                  >
                    {getActivityTypeLabel(activity.type)}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 truncate mb-2">
                  {activity.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{getRelativeTime(activity.timestamp)}</span>
                    
                    {activity.metadata?.resultCount && (
                      <span className="flex items-center space-x-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{activity.metadata.resultCount} results</span>
                      </span>
                    )}
                    
                    {activity.metadata?.score && (
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{(activity.metadata.score * 100).toFixed(0)}% match</span>
                      </span>
                    )}

                    {activity.metadata?.channelName && (
                      <span className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>#{activity.metadata.channelName}</span>
                      </span>
                    )}
                  </div>

                  {(activity.type === 'search' || activity.type === 'result_click') && (
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Show More Button */}
          {activities.length >= maxItems && (
            <div className="text-center pt-4 border-t">
              <Button variant="outline" size="sm">
                View All Activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Activity Summary */}
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {searchHistory.length}
              </div>
              <div className="text-sm text-gray-600">Total Searches</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {searchHistory.reduce((sum, search) => sum + search.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Results Found</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
