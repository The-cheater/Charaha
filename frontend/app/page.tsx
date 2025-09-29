// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { SearchInput } from '@/components/search/SearchInput';
import SearchResults from '@/components/search/SearchResults';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { results, isLoading, error, count, search, lastQuery } = useSearch();
  const [filters, setFilters] = useState({
    source: 'slack',
    channelName: '',
    userName: '',
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    await search({
      query,
      topK: 10,
      filters: filters.source === 'all' ? {} : {
        source: filters.source,
        ...(filters.channelName && { channelName: filters.channelName }),
        ...(filters.userName && { userName: filters.userName }),
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TeamMemory...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">TeamMemory</h1>
              <div className="hidden sm:block text-sm text-gray-500">
                AI-Powered Team Knowledge Search
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Search Your Team Knowledge
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find any conversation, document, or information from your team's Slack channels 
              using natural language queries powered by AI.
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-4xl mx-auto mb-6">
            <SearchInput 
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Search for 'vector databases', 'React components', 'authentication setup'..."
            />
          </div>

          {/* Quick Filters */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Source:</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="slack">Slack Only</option>
                  <option value="all">All Sources</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Channel:</label>
                <input
                  type="text"
                  value={filters.channelName}
                  onChange={(e) => setFilters(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="e.g. new-channel"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm w-32"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">User:</label>
                <input
                  type="text"
                  value={filters.userName}
                  onChange={(e) => setFilters(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="e.g. sai303599"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm w-32"
                />
              </div>

              {(filters.channelName || filters.userName) && (
                <button
                  onClick={() => setFilters({ source: 'slack', channelName: '', userName: '' })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {lastQuery && !error && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results for "{lastQuery}"
              </h3>
              <span className="text-sm text-gray-500">
                {count} result{count !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <SearchResults 
              results={results} 
              isLoading={isLoading}
              query={lastQuery}
            />
          </div>
        )}

        {/* Welcome Message for First Time */}
        {!lastQuery && !isLoading && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-4">👋 Welcome to TeamMemory!</p>
              <p className="mb-6">Start by searching for any topic from your team's conversations.</p>
              
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => handleSearch('vector databases')}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 text-left"
                >
                  <div className="font-medium text-gray-900">🔍 Technical Discussions</div>
                  <div className="text-sm text-gray-600 mt-1">Find conversations about technology</div>
                </button>
                
                <button
                  onClick={() => handleSearch('React frontend')}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 text-left"
                >
                  <div className="font-medium text-gray-900">⚛️ Development Topics</div>
                  <div className="text-sm text-gray-600 mt-1">Search for coding discussions</div>
                </button>
                
                <button
                  onClick={() => handleSearch('team meetings')}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 text-left"
                >
                  <div className="font-medium text-gray-900">🤝 Team Activities</div>
                  <div className="text-sm text-gray-600 mt-1">Find meeting notes and updates</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
