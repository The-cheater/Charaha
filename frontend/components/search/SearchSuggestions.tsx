// components/search/SearchSuggestions.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, TrendingUp, Hash, User } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
  onClose: () => void;
  recentSearches?: string[];
}

interface Suggestion {
  type: 'recent' | 'trending' | 'completion' | 'channel' | 'user';
  text: string;
  icon: React.ReactNode;
  count?: number;
  description?: string;
}

export function SearchSuggestions({
  query,
  onSuggestionSelect,
  isVisible,
  onClose,
  recentSearches = []
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchHistory } = useSearch();

  // Predefined trending searches and completions
  const trendingSuggestions = [
    { text: 'vector databases semantic search', count: 45, description: 'AI and machine learning discussions' },
    { text: 'React frontend components', count: 32, description: 'UI development conversations' },
    { text: 'authentication security JWT', count: 28, description: 'Security and auth topics' },
    { text: 'API integration webhooks', count: 24, description: 'Integration discussions' },
    { text: 'deployment Docker containers', count: 21, description: 'DevOps and deployment' },
  ];

  const channelSuggestions = [
    '#general', '#development', '#design', '#random', '#announcements',
    '#backend', '#frontend', '#devops', '#meetings', '#social'
  ];

  const userSuggestions = [
    'sai303599', 'john.doe', 'jane.smith', 'mike.chen', 'sarah.wilson'
  ];

  useEffect(() => {
    if (!query.trim()) {
      // Show recent and trending when no query
      const recentSuggs: Suggestion[] = searchHistory.slice(0, 5).map(item => ({
        type: 'recent',
        text: item.query,
        icon: <Clock className="h-4 w-4" />,
        count: item.count,
        description: `${item.count} results found`
      }));

      const trendingSuggs: Suggestion[] = trendingSuggestions.slice(0, 3).map(item => ({
        type: 'trending',
        text: item.text,
        icon: <TrendingUp className="h-4 w-4" />,
        count: item.count,
        description: item.description
      }));

      setSuggestions([...recentSuggs, ...trendingSuggs]);
      return;
    }

    // Generate suggestions based on query
    const newSuggestions: Suggestion[] = [];
    const queryLower = query.toLowerCase();

    // Auto-completions
    const completions = [
      `${query} implementation`,
      `${query} best practices`,
      `${query} tutorial`,
      `${query} examples`,
      `${query} troubleshooting`
    ];

    completions.forEach(completion => {
      if (completion.toLowerCase() !== queryLower) {
        newSuggestions.push({
          type: 'completion',
          text: completion,
          icon: <Search className="h-4 w-4" />,
        });
      }
    });

    // Channel suggestions
    if (queryLower.includes('#') || queryLower.includes('channel')) {
      channelSuggestions
        .filter(channel => channel.toLowerCase().includes(queryLower.replace('#', '')))
        .slice(0, 3)
        .forEach(channel => {
          newSuggestions.push({
            type: 'channel',
            text: `${query} in ${channel}`,
            icon: <Hash className="h-4 w-4" />,
            description: `Search in ${channel} channel`
          });
        });
    }

    // User suggestions
    if (queryLower.includes('@') || queryLower.includes('user') || queryLower.includes('from')) {
      userSuggestions
        .filter(user => user.toLowerCase().includes(queryLower.replace('@', '')))
        .slice(0, 3)
        .forEach(user => {
          newSuggestions.push({
            type: 'user',
            text: `${query} from ${user}`,
            icon: <User className="h-4 w-4" />,
            description: `Messages from @${user}`
          });
        });
    }

    // Recent similar searches
    const similarRecent = searchHistory
      .filter(item => 
        item.query.toLowerCase().includes(queryLower) && 
        item.query.toLowerCase() !== queryLower
      )
      .slice(0, 2)
      .map(item => ({
        type: 'recent' as const,
        text: item.query,
        icon: <Clock className="h-4 w-4" />,
        count: item.count,
        description: `${item.count} results found`
      }));

    newSuggestions.push(...similarRecent);

    // Trending matches
    const trendingMatches = trendingSuggestions
      .filter(item => item.text.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .map(item => ({
        type: 'trending' as const,
        text: item.text,
        icon: <TrendingUp className="h-4 w-4" />,
        count: item.count,
        description: item.description
      }));

    newSuggestions.push(...trendingMatches);

    setSuggestions(newSuggestions.slice(0, 8)); // Limit to 8 suggestions
    setSelectedIndex(-1);
  }, [query, searchHistory]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSuggestionSelect(suggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, suggestions]);

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'recent': return 'Recent';
      case 'trending': return 'Trending';
      case 'completion': return 'Suggestion';
      case 'channel': return 'Channel';
      case 'user': return 'User';
      default: return '';
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'recent': return 'bg-gray-100 text-gray-600';
      case 'trending': return 'bg-red-100 text-red-600';
      case 'completion': return 'bg-blue-100 text-blue-600';
      case 'channel': return 'bg-green-100 text-green-600';
      case 'user': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 max-h-96 overflow-y-auto shadow-lg">
      <div ref={containerRef} className="py-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${suggestion.text}-${index}`}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors ${
              index === selectedIndex 
                ? 'bg-blue-50 border-l-blue-500' 
                : 'border-l-transparent'
            }`}
            onClick={() => onSuggestionSelect(suggestion.text)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-gray-400 mt-0.5">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 ${getSuggestionTypeColor(suggestion.type)}`}
                    >
                      {getSuggestionTypeLabel(suggestion.type)}
                    </Badge>
                  </div>
                  {suggestion.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </div>
              {suggestion.count && (
                <div className="text-xs text-gray-400 ml-2">
                  {suggestion.count} results
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
