// components/dashboard/QuickActions.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Zap, 
  TrendingUp, 
  Hash, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Filter
} from 'lucide-react';
import { useSearch, useQuickSearch } from '@/hooks/useSearch';

interface QuickActionsProps {
  onSearchSelect?: (query: string) => void;
  className?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  query: string;
  filters?: any;
  color: string;
  count?: number;
  category: 'trending' | 'recent' | 'suggested' | 'filters';
}

export function QuickActions({ onSearchSelect, className }: QuickActionsProps) {
  const { search, searchHistory } = useSearch();
  const { quickSearches, executeQuickSearch } = useQuickSearch();

  // Dynamic trending searches based on common patterns
  const trendingActions: QuickAction[] = [
    {
      id: 'vector-db',
      title: 'Vector Databases',
      description: 'AI, embeddings, semantic search discussions',
      icon: <Sparkles className="h-5 w-5" />,
      query: 'vector databases semantic search Qdrant embeddings',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      count: 24,
      category: 'trending'
    },
    {
      id: 'react-dev',
      title: 'React Development',
      description: 'Frontend components, hooks, UI development',
      icon: <Hash className="h-5 w-5" />,
      query: 'React components frontend development TypeScript',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      count: 18,
      category: 'trending'
    },
    {
      id: 'api-auth',
      title: 'API & Authentication',
      description: 'JWT, security, API endpoints, middleware',
      icon: <Users className="h-5 w-5" />,
      query: 'API authentication JWT security middleware',
      color: 'bg-green-100 text-green-700 border-green-200',
      count: 15,
      category: 'trending'
    }
  ];

  // Recent search shortcuts from history
  const recentActions: QuickAction[] = searchHistory.slice(0, 3).map((item, index) => ({
    id: `recent-${index}`,
    title: item.query.split(' ').slice(0, 2).join(' '),
    description: `${item.count} results found`,
    icon: <Clock className="h-5 w-5" />,
    query: item.query,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    count: item.count,
    category: 'recent'
  }));

  // Smart suggestions based on common use cases
  const suggestedActions: QuickAction[] = [
    {
      id: 'deployment',
      title: 'Deployment & DevOps',
      description: 'Docker, containers, CI/CD, production issues',
      icon: <TrendingUp className="h-5 w-5" />,
      query: 'deployment Docker containers production DevOps',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      category: 'suggested'
    },
    {
      id: 'meetings',
      title: 'Team Meetings',
      description: 'Meeting notes, decisions, action items',
      icon: <Calendar className="h-5 w-5" />,
      query: 'meeting notes decisions action items standup',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      category: 'suggested'
    }
  ];

  // Filter shortcuts
  const filterActions: QuickAction[] = [
    {
      id: 'today-only',
      title: 'Today\'s Messages',
      description: 'Search only messages from today',
      icon: <Filter className="h-5 w-5" />,
      query: '',
      filters: { 
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      color: 'bg-pink-100 text-pink-700 border-pink-200',
      category: 'filters'
    },
    {
      id: 'dev-channel',
      title: 'Development Channel',
      description: 'Search only in development channels',
      icon: <Hash className="h-5 w-5" />,
      query: '',
      filters: { channelName: 'development' },
      color: 'bg-teal-100 text-teal-700 border-teal-200',
      category: 'filters'
    }
  ];

  const handleActionClick = async (action: QuickAction) => {
    if (onSearchSelect) {
      onSearchSelect(action.query);
    } else {
      // Execute search directly
      await search({
        query: action.query || '*',
        topK: 10,
        filters: {
          source: 'slack',
          ...action.filters
        }
      });
    }
  };

  const allActions = [
    ...trendingActions,
    ...recentActions,
    ...suggestedActions,
    ...filterActions
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-6">
        {/* Trending Searches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Trending Searches</h3>
              <Badge variant="outline" className="text-red-600 border-red-300">
                Hot
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingActions.map((action) => (
              <Card 
                key={action.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-400"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    {action.icon}
                  </div>
                  {action.count && (
                    <Badge variant="outline" className="text-xs">
                      {action.count} results
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <div className="flex items-center text-sm text-blue-600">
                  <span>Search now</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {recentActions.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentActions.map((action) => (
                <Card 
                  key={action.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      {action.icon}
                    </div>
                    <div className="text-xs text-gray-500">
                      {action.count} results
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 truncate">{action.query}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Search again</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedActions.map((action) => (
              <Card 
                key={action.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} flex-shrink-0`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                    <div className="flex items-center text-sm text-blue-600">
                      <Search className="h-4 w-4 mr-1" />
                      <span>Explore</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterActions.map((action) => (
              <Card 
                key={action.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Search Buttons */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center mb-4">
            <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Lightning Search</h3>
            <p className="text-sm text-gray-600">Quick searches for common topics</p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {quickSearches.map((quickSearch) => (
              <Button
                key={quickSearch.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  executeQuickSearch(quickSearch);
                  onSearchSelect?.(quickSearch.query);
                }}
                className="flex items-center space-x-2"
              >
                <span>{quickSearch.icon}</span>
                <span>{quickSearch.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
