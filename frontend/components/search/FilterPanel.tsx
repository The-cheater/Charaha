"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'

interface FilterPanelProps {
  onFiltersChange?: (filters: any) => void
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    source: 'all',
    dateRange: 'all',
    author: '',
    fileType: 'all'
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      source: 'all',
      dateRange: 'all',
      author: '',
      fileType: 'all'
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="font-funnel flex items-center">
          <FilterListIcon className="mr-2 h-5 w-5" />
          Filters
        </CardTitle>
        <CardDescription className="font-dm-sans">
          Narrow down your search results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source Filter */}
        <div className="space-y-2">
          <Label className="font-dm-sans">Source</Label>
          <Select 
            value={filters.source} 
            onValueChange={(value) => handleFilterChange('source', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="google-docs">Google Docs</SelectItem>
              <SelectItem value="notion">Notion</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="font-dm-sans">Date Range</Label>
          <Select 
            value={filters.dateRange} 
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past 3 Months</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Author Filter */}
        <div className="space-y-2">
          <Label htmlFor="author" className="font-dm-sans">Author</Label>
          <Input
            id="author"
            placeholder="Enter author name or email"
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
          />
        </div>

        {/* File Type Filter */}
        <div className="space-y-2">
          <Label className="font-dm-sans">Content Type</Label>
          <Select 
            value={filters.fileType} 
            onValueChange={(value) => handleFilterChange('fileType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="image">Images</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full"
        >
          <ClearIcon className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  )
}
