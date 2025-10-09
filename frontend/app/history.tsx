'use client';

import { motion } from 'framer-motion';
import { Clock, Search, FileText, Calendar, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState('all');

  const history = [
    {
      query: 'Q4 marketing strategy document',
      timestamp: '2024-10-09 11:45 AM',
      results: 12,
      source: 'Google Drive',
      category: 'Today',
    },
    {
      query: 'team standup notes last week',
      timestamp: '2024-10-09 10:30 AM',
      results: 8,
      source: 'Slack',
      category: 'Today',
    },
    {
      query: 'product roadmap 2024',
      timestamp: '2024-10-08 4:15 PM',
      results: 24,
      source: 'Notion',
      category: 'Yesterday',
    },
    {
      query: 'customer feedback analysis',
      timestamp: '2024-10-08 2:20 PM',
      results: 18,
      source: 'Google Drive',
      category: 'Yesterday',
    },
    {
      query: 'budget planning spreadsheet',
      timestamp: '2024-10-07 3:45 PM',
      results: 6,
      source: 'Google Drive',
      category: 'This Week',
    },
  ];

  const groupedHistory = history.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof history>);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black font-display mb-3">
              <span className="gradient-text">Search History</span>
            </h1>
            <p className="text-xl text-gray-400">
              View and manage your past searches
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-3 mb-8"
      >
        {['all', 'today', 'week', 'month'].map((filter) => (
          <Badge
            key={filter}
            variant={selectedDate === filter ? 'default' : 'outline'}
            className={`cursor-pointer capitalize ${
              selectedDate === filter
                ? 'bg-purple-600 border-purple-600'
                : 'border-white/10 hover:bg-white/5'
            }`}
            onClick={() => setSelectedDate(filter)}
          >
            {filter}
          </Badge>
        ))}
      </motion.div>

      {/* History Groups */}
      <div className="space-y-12">
        {Object.entries(groupedHistory).map(([category, items], groupIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + groupIndex * 0.1 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              {category}
            </h2>
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + groupIndex * 0.1 + index * 0.05 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <Card className="glass p-5 border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Search className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-400 transition-colors">
                            {item.query}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {item.timestamp}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {item.source}
                            </span>
                            <span className="text-purple-400">
                              {item.results} results
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
