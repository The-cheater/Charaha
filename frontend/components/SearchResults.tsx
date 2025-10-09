'use client';

import { motion } from 'framer-motion';
import { FileText, MessageSquare, ExternalLink, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { SearchResult } from '@/lib/useSearch';

interface SearchResultsProps {
  results: SearchResult[];
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'slack':
      return <MessageSquare className="w-5 h-5 text-purple-400" />;
    case 'google-drive':
      return <FileText className="w-5 h-5 text-blue-400" />;
    default:
      return <FileText className="w-5 h-5 text-gray-400" />;
  }
};

const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case 'slack':
      return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    case 'google-drive':
      return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    default:
      return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  }
};

export default function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No results found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-400">
        Found <span className="text-white font-semibold">{results.length}</span> results
      </p>

      <div className="space-y-4">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`p-6 glass border bg-gradient-to-br ${getSourceColor(
                result.source
              )} hover:scale-[1.02] transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    {getSourceIcon(result.source)}
                    <Badge variant="outline" className="capitalize">
                      {result.source}
                    </Badge>
                    <Badge variant="secondary">{result.type}</Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(result.date)}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {result.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-gray-300 line-clamp-2">{result.content}</p>

                  {/* Relevance Score */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.relevance * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(result.relevance * 100)}% match
                    </span>
                  </div>
                </div>

                {/* External Link */}
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-400 hover:text-white" />
                  </a>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
