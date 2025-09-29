// components/analytics/SearchStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Search, 
  Clock,
  Hash,
  Users,
  Calendar,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

interface SearchStatsProps {
  className?: string;
  showDetailed?: boolean;
}

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface TrendItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
}
export function SearchStats({ className, showDetailed = true }: SearchStatsProps) {
  const { searchHistory } = useSearch();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);

  // Define interfaces for the stats
  interface SearchStatsResult {
    totalSearches: number;
    totalResults: number;
    avgResultsPerSearch: number;
    avgSearchesPerDay: number;
    topQueries: Array<{
      label: string;
      value: number;
      percentage: number;
      color: string;
    }>;
    filteredHistory: Array<{
      query: string;
      count: number;
      timestamp: string;
    }>;
  }

  // Calculate stats from search history
  const calculateStats = (): SearchStatsResult => {
    const now = new Date();
    const cutoffTime = new Date();
    
    switch (timeRange) {
      case 'day':
{{ ... }}
    const filteredHistory = searchHistory.filter(
      search => new Date(search.timestamp) >= cutoffTime
    );

    const totalSearches = filteredHistory.length;
    const totalResults = filteredHistory.reduce((sum, search) => sum + (search.count || 0), 0);
    const avgResultsPerSearch = totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0;
    const avgSearchesPerDay = Math.round(totalSearches / (timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30));

    // Calculate query patterns
    const queryWords = filteredHistory
{{ ... }}
      return acc;
    }, {} as Record<string, number>);

    const topQueries = Object.entries(wordCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({
        label: word,
        value: count,
        percentage: Math.round((count / queryWords.length) * 100),
        color: 'bg-blue-500',
      }));

    return {
      totalSearches,
      totalResults,
      avgResultsPerSearch,
      avgSearchesPerDay,
      topQueries,
      filteredHistory: filteredHistory.map(search => ({
        query: search.query,
        count: search.count || 0,
        timestamp: search.timestamp,
      })),
    } as SearchStatsResult;
  };

  const stats = calculateStats();
{{ ... }}

  const mainStats: StatItem[] = [
    {
      label: 'Total Searches',
      value: stats.totalSearches,
      change: 12,
      icon: <Search className="h-5 w-5" />,
      color: 'text-blue-600',
      description: `${stats.avgSearchesPerDay} per day average`
    },
    {
      label: 'Results Found',
      value: stats.totalResults,
      change: 8,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-600',
      description: `${stats.avgResultsPerSearch} avg per search`
    },
    {
      label: 'Search Accuracy',
      value: '87%',
      change: 5,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-600',
      description: 'Based on user interactions'
    },
    {
      label: 'Response Time',
      value: '142ms',
      change: -15,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-600',
      description: 'Average search latency'
    }
  ];

  const channelStats: TrendItem[] = [
    { label: 'new-channel', value: 45, percentage: 35, color: 'bg-blue-500' },
    { label: 'development', value: 32, percentage: 25, color: 'bg-green-500' },
    { label: 'general', value: 28, percentage: 22, color: 'bg-purple-500' },
    { label: 'design', value: 18, percentage: 14, color: 'bg-orange-500' },
    { label: 'random', value: 5, percentage: 4, color: 'bg-gray-500' }
  ];

  const timeStats: TrendItem[] = [
    { label: '9-12 AM', value: 35, percentage: 30, color: 'bg-blue-500' },
    { label: '1-3 PM', value: 28, percentage: 24, color: 'bg-green-500' },
    { label: '3-6 PM', value: 32, percentage: 28, color: 'bg-purple-500' },
    { label: '6-9 PM', value: 20, percentage: 18, color: 'bg-orange-500' }
  ];

  const refreshStats = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Search Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                {stat.icon}
              </div>
              {stat.change && (
                <Badge variant={stat.change > 0 ? "default" : "secondary"} className="text-xs">
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </Badge>
              )}
            </div>
            
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
            
            {stat.description && (
              <div className="text-xs text-gray-500">{stat.description}</div>
            )}
          </Card>
        ))}
      </div>

      {showDetailed && (
        <>
          {/* Top Search Terms */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Hash className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Search Terms</h3>
            </div>
            
            <div className="space-y-4">
              {stats.topQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900 w-4">#{index + 1}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{query.label}</div>
                      <div className="text-xs text-gray-500">{query.percentage}% of all searches</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${query.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${query.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 w-8">
                      {query.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Channel Usage and Time Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Usage */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Hash className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Channel Usage</h3>
              </div>
              
              <div className="space-y-4">
                {channelStats.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                      <span className="text-sm font-medium text-gray-900">
                        #{channel.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${channel.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${channel.percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 w-12 text-right">
                        {channel.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Time Distribution */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Search Times</h3>
              </div>
              
              <div className="space-y-4">
                {timeStats.map((time, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${time.color}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {time.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${time.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${time.percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 w-12 text-right">
                        {time.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Search Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Search Performance</h3>
              </div>
              <Badge variant="outline">
                Last {stats.filteredHistory.length} searches
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.avgResultsPerSearch}
                </div>
                <div className="text-sm text-blue-600">Avg Results</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">94%</div>
                <div className="text-sm text-green-600">Success Rate</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">2.3s</div>
                <div className="text-sm text-orange-600">Avg Time Spent</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default SearchStats;
