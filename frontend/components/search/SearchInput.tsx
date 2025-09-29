// components/search/SearchInput.tsx (Add suggestions)
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

export function SearchInput({ onSearch, isLoading, placeholder }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { generateSmartSuggestions } = useSearch();
  const inputRef = useRef(null);

  const suggestions = generateSmartSuggestions(query);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestionText) => {
    setQuery(suggestionText);
    onSearch(suggestionText);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

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
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex].text);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'recent': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'trending': return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'semantic': return <Sparkles className="h-4 w-4 text-purple-400" />;
      default: return <Search className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
              setSelectedIndex(-1);
            }}
            onFocus={() => query && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-24 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 px-4 py-1.5 rounded-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>

      {/* Smart Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2">
              Smart Suggestions
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectSuggestion(suggestion.text)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.usage > 0 && (
                      <div className="text-xs text-gray-500">
                        {suggestion.usage} results found
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${
                      suggestion.type === 'trending' ? 'bg-red-50 text-red-600 border-red-200' :
                      suggestion.type === 'recent' ? 'bg-gray-50 text-gray-600' :
                      suggestion.type === 'semantic' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    {suggestion.type}
                  </Badge>
                  {suggestion.confidence >= 0.8 && (
                    <div className="text-green-500">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
