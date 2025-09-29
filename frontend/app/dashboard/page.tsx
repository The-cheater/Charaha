"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GroupIcon from '@mui/icons-material/Group'
import SpeedIcon from '@mui/icons-material/Speed'
import AddIcon from '@mui/icons-material/Add'
import StorageIcon from '@mui/icons-material/Storage'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import HistoryIcon from '@mui/icons-material/History'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const searchData = [
  { day: 'Mon', searches: 45 },
  { day: 'Tue', searches: 52 },
  { day: 'Wed', searches: 48 },
  { day: 'Thu', searches: 61 },
  { day: 'Fri', searches: 55 },
  { day: 'Sat', searches: 32 },
  { day: 'Sun', searches: 28 },
]

const quickActions = [
  {
    title: 'Quick Search',
    description: 'Search across all your data sources',
    icon: SearchIcon,
    href: '/search',
    color: 'bg-blue-500'
  },
  {
    title: 'Add Data Source',
    description: 'Connect Slack, Google Drive, or other sources',
    icon: AddIcon,
    href: '/sources/add/slack',
    color: 'bg-green-500'
  },
  {
    title: 'View Analytics',
    description: 'See search patterns and usage stats',
    icon: AnalyticsIcon,
    href: '/analytics',
    color: 'bg-purple-500'
  },
  {
    title: 'Browse Sources',
    description: 'Manage your connected data sources',
    icon: StorageIcon,
    href: '/sources',
    color: 'bg-orange-500'
  }
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSearches: 1247,
    avgResponseTime: 320,
    activeSources: 8,
    totalDocuments: 5649
  })
  const [recentActivity, setRecentActivity] = useState([
    { user: 'Alice Johnson', action: 'searched for "API documentation"', time: '2 minutes ago' },
    { user: 'Bob Smith', action: 'found result in Slack #engineering', time: '5 minutes ago' },
    { user: 'Carol Davis', action: 'bookmarked "Meeting notes Q4"', time: '12 minutes ago' },
    { user: 'David Wilson', action: 'searched for "deployment process"', time: '18 minutes ago' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [analyticsData, sourcesData] = await Promise.allSettled([
        api.getAnalytics('7d'),
        api.getSources(1, 5)
      ])

      // Update stats if API calls succeeded
      if (analyticsData.status === 'fulfilled') {
        setStats(prev => ({
          ...prev,
          ...analyticsData.value
        }))
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Searches',
      value: stats.totalSearches.toLocaleString(),
      change: '+12% from last week',
      icon: SearchIcon,
      color: 'text-blue-600'
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}ms`,
      change: '-8% from last week',
      icon: SpeedIcon,
      color: 'text-green-600'
    },
    {
      title: 'Active Sources',
      value: stats.activeSources.toString(),
      change: '+2 new sources',
      icon: StorageIcon,
      color: 'text-purple-600'
    },
    {
      title: 'Total Documents',
      value: stats.totalDocuments.toLocaleString(),
      change: '+156 this week',
      icon: GroupIcon,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your team's knowledge.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/search/advanced">
            <Button variant="outline">
              <TrendingUpIcon className="mr-2 h-4 w-4" />
              Advanced Search
            </Button>
          </Link>
          <Link href="/sources/add/slack">
            <Button>
              <AddIcon className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used features and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className={`p-2 rounded-full ${action.color} text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HistoryIcon className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest searches and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/search/history">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search Trends Chart */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Search Activity (Last 7 Days)</CardTitle>
            <CardDescription>
              Daily search volume and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={searchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="searches" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
