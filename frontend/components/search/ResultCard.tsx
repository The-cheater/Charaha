"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchResult } from '@/types'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import ShareIcon from '@mui/icons-material/Share'
import PersonIcon from '@mui/icons-material/Person'
import { formatDistanceToNow } from 'date-fns'

interface ResultCardProps {
  result: SearchResult
  query: string
}

export function ResultCard({ result, query }: ResultCardProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'slack': return '💬'
      case 'google-docs': return '📄'
      case 'notion': return '📝'
      default: return '📋'
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'slack': return 'bg-purple-100 text-purple-800'
      case 'google-docs': return 'bg-blue-100 text-blue-800'
      case 'notion': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const highlightQuery = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={getSourceColor(result.source)}>
                  <span className="mr-1">{getSourceIcon(result.source)}</span>
                  {result.source.replace('-', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              
              <h3 className="font-funnel text-lg font-semibold hover:text-primary cursor-pointer">
                <span dangerouslySetInnerHTML={{ 
                  __html: highlightQuery(result.title, query) 
                }} />
              </h3>
            </div>
            
            <Button variant="ghost" size="sm" asChild>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <OpenInNewIcon className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Content */}
          <div className="text-muted-foreground font-dm-sans">
            <p dangerouslySetInnerHTML={{ 
              __html: highlightQuery(result.content, query) 
            }} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <PersonIcon className="h-4 w-4" />
                <span>{result.author}</span>
              </div>
              <span>
                {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <BookmarkIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ShareIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
