// hooks/useSearch.ts (Enhanced Version)
'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, SearchResult, SearchQuery } from '@/lib/api';

// Add these interfaces
interface SmartSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'completion' | 'semantic';
  confidence: number;
  usage: number;
}

interface TrendingQuery {
  query: string;
  count: number;
  lastUsed: string;
  avgResults: number;
}

export function useSearch() {
  const [state, setState] = useState({
    results: [],
    isLoading: false,
    error: null,
    count: 0,
    lastQuery: '',
    processingTime: null,
    hasSearched: false,
  });

  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingQueries, setTrendingQueries] = useState<TrendingQuery[]>([]);

  // Smart suggestions generator
  const generateSmartSuggestions = useCallback((input: string): SmartSuggestion[] => {
    if (!input.trim()) return [];

    const suggestions: SmartSuggestion[] = [];
    const inputLower = input.toLowerCase();

    // 1. Recent similar searches
    const recentMatches = searchHistory
      .filter(item => item.query.toLowerCase().includes(inputLower))
      .slice(0, 3)
      .map(item => ({
        text: item.query,
        type: 'recent' as const,
        confidence: 0.9,
        usage: item.count
      }));

    // 2. Auto-completions
    const completions = [
      `${input} best practices`,
      `${input} implementation`,
      `${input} tutorial guide`,
      `${input} troubleshooting`,
      `${input} examples`
    ].map(text => ({
      text,
      type: 'completion' as const,
      confidence: 0.7,
      usage: 0
    }));

    // 3. Semantic suggestions (based on common patterns)
    const semanticPatterns = {
      'react': ['components', 'hooks', 'state management', 'performance'],
      'vector': ['database', 'embeddings', 'similarity search', 'AI'],
      'auth': ['JWT', 'security', 'middleware', 'authentication'],
      'api': ['REST', 'GraphQL', 'endpoints', 'integration'],
      'deploy': ['docker', 'production', 'CI/CD', 'hosting']
    };

    Object.entries(semanticPatterns).forEach(([key, patterns]) => {
      if (inputLower.includes(key)) {
        patterns.forEach(pattern => {
          if (!suggestions.find(s => s.text.includes(pattern))) {
            suggestions.push({
              text: `${input} ${pattern}`,
              type: 'semantic',
              confidence: 0.8,
              usage: Math.floor(Math.random() * 50) + 10
            });
          }
        });
      }
    });

    // Combine and sort by confidence
    return [...recentMatches, ...completions.slice(0, 2), ...suggestions.slice(0, 3)]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  }, [searchHistory]);

  // Calculate trending queries
  useEffect(() => {
    const calculateTrending = () => {
      const queryStats = searchHistory.reduce((acc, search) => {
        const query = search.query.toLowerCase();
        if (!acc[query]) {
          acc[query] = {
            query: search.query,
            count: 0,
            totalResults: 0,
            lastUsed: search.timestamp
          };
        }
        acc[query].count++;
        acc[query].totalResults += search.count;
        if (new Date(search.timestamp) > new Date(acc[query].lastUsed)) {
          acc[query].lastUsed = search.timestamp;
        }
        return acc;
      }, {});

      const trending = Object.values(queryStats)
        .filter(stat => stat.count >= 2)
        .map(stat => ({
          ...stat,
          avgResults: Math.round(stat.totalResults / stat.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTrendingQueries(trending);
    };

    if (searchHistory.length > 0) {
      calculateTrending();
    }
  }, [searchHistory]);

  // Existing search function (keep as is)
  const search = useCallback(async (query: SearchQuery) => {
    // ... your existing search logic
  }, []);

  return {
    ...state,
    search,
    searchHistory,
    trendingQueries,
    generateSmartSuggestions,
    // ... other existing methods
  };
}
