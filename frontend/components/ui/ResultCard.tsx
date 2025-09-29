// components/ui/ResultCard.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { 
  ExternalLink, 
  Hash, 
  Clock, 
  MessageCircle, 
  Heart,
  Copy,
  Share,
  Bookmark,
  TrendingUp,
  User
} from 'lucide-react';
import { SearchResult } from '@/lib/api';
import { useState } from 'react';

interface ResultCardProps {
  result: SearchResult;
  query?: string;
  index?: number;
  onResultClick?: (result: SearchResult) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ResultCard({ 
  result, 
  query, 
  index, 
  onResultClick, 
  showActions = true,
  compact = false 
}: ResultCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Highlight matching text
  const highlightText = (text: string, query?: string) => {
    if (!query) return text;
    
    const words = query.toLowerCase().split(' ').filter(w => w.length > 2);
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1h ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent match';
    if (score >= 0.6) return 'Good match';
    if (score >= 0.4) return 'Fair match';
    return 'Weak match';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && result.metadata.permalink) {
      try {
        await navigator.share({
          title: `Message from #${result.metadata.channelName}`,
          text: result.text.substring(0, 100) + '...',
          url: result.metadata.permalink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      await navigator.clipboard.writeText(result.metadata.permalink);
    }
  };

  const handleResultClick = () => {
    onResultClick?.(result);
    if (result.metadata.permalink) {
      window.open(result.metadata.permalink, '_blank');
    }
  };

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleResultClick}>
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className={`text-xs px-2 py-1 ${getScoreColor(result.score)}`}>
                {Math.round(result.score * 100)}%
              </Badge>
              <span className="text-xs text-gray-500">#{result.metadata.channelName}</span>
              <span className="text-xs text-gray-500">@{result.metadata.userName}</span>
            </div>
            <p 
              className="text-sm text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: highlightText(result.text, query) }}
            />
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {index !== undefined && (
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
          )}
          
          <Avatar className="w-8 h-8">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {result.metadata.userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </Avatar>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {result.metadata.userRealName || result.metadata.userName}
              </span>
              <span className="text-gray-500">in</span>
              <div className="flex items-center space-x-1">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">
                  {result.metadata.channelName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatTimestamp(result.metadata.timestamp)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`px-3 py-1 ${getScoreColor(result.score)}`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {Math.round(result.score * 100)}% match
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div 
          className="text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightText(result.text, query) }}
        />
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          {result.metadata.threadTs && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>Thread message</span>
            </div>
          )}
          
          {result.metadata.reactions && result.metadata.reactions.length > 0 && (
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{result.metadata.reactions.length} reactions</span>
            </div>
          )}
          
          {result.metadata.replyCount && result.metadata.replyCount > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{result.metadata.replyCount} replies</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-xs">Relevance: {getScoreLabel(result.score)}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="h-4 w-4 mr-1" />
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700"
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`${isBookmarked ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>

          <Button
            onClick={handleResultClick}
            size="sm"
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in Slack</span>
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ResultCard;
