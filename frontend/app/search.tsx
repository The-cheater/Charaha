'use client';

import { motion } from 'framer-motion';
import { Search, Sparkles, Filter, Clock, FileText, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const mockResults = [
    {
      title: 'Q4 Marketing Strategy Document',
      content: 'Comprehensive marketing strategy for Q4 2024 including budget allocation, campaign timelines, and KPIs...',
      source: 'Google Drive',
      type: 'Document',
      date: '2 days ago',
      relevance: 98,
    },
    {
      title: 'Team Standup - Marketing Discussion',
      content: 'Discussion about Q4 marketing initiatives, budget concerns, and team alignment on priorities...',
      source: 'Slack',
      type: 'Message',
      date: '1 week ago',
      relevance: 95,
    },
    {
      title: 'Marketing Budget 2024 Spreadsheet',
      content: 'Detailed breakdown of marketing spend by quarter, channel allocation, and ROI projections...',
      source: 'Google Drive',
      type: 'Spreadsheet',
      date: '3 weeks ago',
      relevance: 87,
    },
  ];

  const handleSearch = () => {
    setSearching(true);
    setTimeout(() => setSearching(false), 1500);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black font-display mb-4">
            <span className="gradient-text">Search</span> Everything
          </h1>
          <p className="text-xl text-gray-400">
            AI-powered semantic search across all your sources
          </p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="glass p-2 rounded-2xl border border-purple-500/30">
            <div className="flex items-center gap-3 px-4 py-4">
              <Search className="w-7 h-7 text-purple-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="What would you like to know?"
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-xl"
              />
              <Button
                size="lg"
                onClick={handleSearch}
                disabled={searching || !query}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
              >
                {searching ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 mb-12"
        >
          <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Badge variant="outline" className="cursor-pointer hover:bg-purple-500/10">All Sources</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-purple-500/10">Last 30 Days</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-purple-500/10">Documents</Badge>
        </motion.div>

        {/* Results */}
        {query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                Found <span className="text-white font-semibold">{mockResults.length} results</span> in 0.3s
              </p>
            </div>

            {mockResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <Card className="glass p-6 border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                        {result.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed mb-4">
                        {result.content}
                      </p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {result.relevance}% match
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      {result.type === 'Document' && <FileText className="w-4 h-4" />}
                      {result.type === 'Message' && <MessageSquare className="w-4 h-4" />}
                      {result.type === 'Spreadsheet' && <FileText className="w-4 h-4" />}
                      {result.source}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {result.date}
                    </span>
                    <span>•</span>
                    <span className="text-purple-400">{result.type}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <Search className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Start Searching</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Type your question above to search across all your connected sources
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
