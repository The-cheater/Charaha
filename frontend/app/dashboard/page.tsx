"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GroupIcon from '@mui/icons-material/Group'
import SpeedIcon from '@mui/icons-material/Speed'
import AddIcon from '@mui/icons-material/Add'
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

const recentActivity = [
  { user: 'Alice Johnson', action: 'searched for "API documentation"', time: '2 minutes ago' },
  { user: 'Bob Smith', action: 'found result in Slack #engineering', time: '5 minutes ago' },
  { user: 'Carol Davis', action: 'bookmarked "Meeting notes Q4"', time: '12 minutes ago' },
  { user: 'David Wilson', action: 'searched for "deployment process"', time: '18 minutes ago' },
]

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-funnel text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground font-dm-sans">
          Welcome back! Here's what's happening with your team's knowledge.
        </p>
      </div>

      {/* Quick Search */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search your team's knowledge..."
              className="pl-10 pr-20 h-12 text-lg"
            />
            <Button 
              variant="gradient" 
              className="absolute right-1 top-1 h-10"
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: SearchIcon, title: 'Searches Today', value: '247', change: '+12%' },
          { icon: SpeedIcon, title: 'Avg Response Time', value: '142ms', change: '-8%' },
          { icon: GroupIcon, title: 'Active Users', value: '34', change: '+23%' },
          { icon: TrendingUpIcon, title: 'Success Rate', value: '96.2%', change: '+2.1%' },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold font-funnel">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-funnel">Search Activity</CardTitle>
            <CardDescription className="font-dm-sans">
              Daily search volume for the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={searchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="searches" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-funnel">Recent Activity</CardTitle>
            <CardDescription className="font-dm-sans">
              Latest searches and interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-funnel text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <AddIcon className="h-5 w-5" />
            <span>Add Data Source</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <SearchIcon className="h-5 w-5" />
            <span>Advanced Search</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <TrendingUpIcon className="h-5 w-5" />
            <span>View Analytics</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
