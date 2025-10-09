'use client';

import { useState } from 'react';
import { api } from './api';
import { toast } from 'sonner';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  type: string;
  date: string;
  relevance: number;
  url?: string;
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = async (searchQuery: string, filters?: any) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setQuery(searchQuery);

    try {
      const response: any = await api.search.query(searchQuery, filters);
      setResults(response.results || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setQuery('');
  };

  return {
    results,
    loading,
    query,
    search,
    clearResults,
  };
};
