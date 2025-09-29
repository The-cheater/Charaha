// components/search/AdvancedFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, Users, Hash, Clock } from 'lucide-react';
import { api, SlackChannel } from '@/lib/api';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  isVisible: boolean;
  onToggle: () => void;
}

interface SearchFilters {
  source: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  messageType: string;
}

export function AdvancedFilters({ onFiltersChange, initialFilters, isVisible, onToggle }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    source: 'all',
    channelId: '',
    channelName: '',
    userId: '',
    userName: '',
    startDate: '',
    endDate: '',
    messageType: 'all',
    ...initialFilters,
  });

  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Load Slack channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setIsLoading(true);
        const response = await api.getSlackChannels();
        if (response.data) {
          setChannels(response.data.channels);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isVisible) {
      loadChannels();
    }
  }, [isVisible]);

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value && value !== 'all' && value !== ''
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      source: 'all',
      channelId: '',
      channelName: '',
      userId: '',
      userName: '',
      startDate: '',
      endDate: '',
      messageType: 'all',
    });
  };

  const clearFilter = (key: keyof SearchFilters) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'source' || key === 'messageType' ? 'all' : '',
    }));
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      default:
        return;
    }
    
    updateFilter('startDate', start.toISOString().split('T')[0]);
    updateFilter('endDate', now.toISOString().split('T')[0]);
  };

  if (!isVisible) {
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="default">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Source Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Hash className="h-4 w-4 mr-1" />
            Source
          </label>
          <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="slack">Slack Only</SelectItem>
              <SelectItem value="google">Google Drive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Channel Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Hash className="h-4 w-4 mr-1" />
            Channel
          </label>
          <Select value={filters.channelId} onValueChange={(value) => {
            const channel = channels.find(c => c.id === value);
            updateFilter('channelId', value);
            updateFilter('channelName', channel?.name || '');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Channels</SelectItem>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${channel.isPrivate ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <span>#{channel.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-1" />
            User
          </label>
          <Input
            placeholder="Enter username"
            value={filters.userName}
            onChange={(e) => updateFilter('userName', e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            From Date
          </label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            To Date
          </label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />
        </div>

        {/* Message Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Message Type
          </label>
          <Select value={filters.messageType} onValueChange={(value) => updateFilter('messageType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All messages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="thread">Thread Messages</SelectItem>
              <SelectItem value="main">Main Messages</SelectItem>
              <SelectItem value="reactions">With Reactions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Date Ranges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-600 mr-2">Quick ranges:</span>
        {['today', 'week', 'month', 'quarter'].map((range) => (
          <Button
            key={range}
            variant="outline"
            size="sm"
            onClick={() => getDateRange(range)}
            className="text-xs"
          >
            Last {range}
          </Button>
        ))}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600">Active filters:</span>
          {filters.source !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Source: {filters.source}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('source')} />
            </Badge>
          )}
          {filters.channelName && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Channel: #{filters.channelName}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                clearFilter('channelId');
                clearFilter('channelName');
              }} />
            </Badge>
          )}
          {filters.userName && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>User: {filters.userName}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('userName')} />
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Date: {filters.startDate || '...'} to {filters.endDate || '...'}
              </span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                clearFilter('startDate');
                clearFilter('endDate');
              }} />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}

export type { SearchFilters };
