"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SearchIcon from '@mui/icons-material/Search'
import MicIcon from '@mui/icons-material/Mic'
import CameraIcon from '@mui/icons-material/Camera'

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({ 
  onSearch, 
  placeholder = "Search your team's knowledge...",
  disabled = false 
}: SearchInputProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="pl-12 pr-24 h-14 text-lg border-2 focus:border-primary/50 rounded-xl"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <MicIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <CameraIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit"
            variant="gradient" 
            size="lg"
            disabled={!query.trim() || disabled}
            className="ml-3 h-14 px-8"
          >
            Search
          </Button>
        </div>
      </form>
      
      {/* Search suggestions could go here */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['API documentation', 'Meeting notes', 'Project updates', 'Team guidelines'].map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(suggestion)
              onSearch(suggestion)
            }}
            disabled={disabled}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
