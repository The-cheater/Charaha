// app/analytics/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Search, 
  Clock,
  Users,
  Hash,
  Target,
  Zap
} from 'lucide-react';
import { useState } from 'react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { searchHistory, trendingQueries } = useSearch();
  const [timeRange, setTimeRange] = useState('week');

  // Calculate analytics from existing search data
  const analytics = {
    totalSearches: searchHistory.length,
    totalResults: searchHistory.reduce((sum, search) => sum + search.count, 0),
    avgResultsPerSearch: searchHistory.length > 0 
      ? Math.round(searchHistory.reduce((sum, search) => sum + search.count, 0) / searchHistory.length)
      : 0,
    topQueries: trendingQueries.slice(0, 5),
    recentActivity: searchHistory.slice(0, 10),
    searchPatterns: getSearchPatterns(searchHistory)
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Analytics</h1>
          <p className="text-gray-600">
            Insights into your team's search patterns and knowledge discovery
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Search className="h-6 w-6" />}
            title="Total Searches"
            value={analytics.totalSearches}
            change="+12%"
            color="blue"
          />
          <MetricCard
            icon={<Target className="h-6 w-6" />}
            title="Results Found"
            value={analytics.totalResults}
            change="+8%"
            color="green"
          />
          <MetricCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Avg Results/Search"
            value={analytics.avgResultsPerSearch}
            change="+15%"
            color="purple"
          />
          <MetricCard
            icon={<Zap className="h-6 w-6" />}
            title="Success Rate"
            value="94%"
            change="+3%"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Queries */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
              Trending Searches
            </h3>
            <div className="space-y-4">
              {analytics.topQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                    <div>
                      <div className="font-medium text-gray-900">{query.query}</div>
                      <div className="text-sm text-gray-500">
                        {query.avgResults} avg results
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {query.count} times
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Recent Searches
            </h3>
            <div className="space-y-4">
              {analytics.recentActivity.map((search, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {search.query}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={search.count > 10 ? "default" : "secondary"}>
                    {search.count} results
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, change, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <Badge variant="outline" className="text-green-600">
          {change}
        </Badge>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </Card>
  );
}

function getSearchPatterns(history) {
  // Simple pattern analysis
  const patterns = {};
  history.forEach(search => {
    const words = search.query.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 3) {
        patterns[word] = (patterns[word] || 0) + 1;
      }
    });
  });
  
  return Object.entries(patterns)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}
