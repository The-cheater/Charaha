"use client"

import { Card, CardContent } from '@/components/ui/card'
import SearchIcon from '@mui/icons-material/Search'
import SpeedIcon from '@mui/icons-material/Speed'
import GroupIcon from '@mui/icons-material/Group'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

interface StatsCardsProps {
  stats: {
    searches: number
    responseTime: number
    activeUsers: number
    successRate: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: SearchIcon,
      title: 'Searches Today',
      value: stats.searches.toLocaleString(),
      change: '+12%',
      color: 'from-blue-600 to-blue-700'
    },
    {
      icon: SpeedIcon,
      title: 'Avg Response Time',
      value: `${stats.responseTime}ms`,
      change: '-8%',
      color: 'from-green-600 to-green-700'
    },
    {
      icon: GroupIcon,
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      change: '+23%',
      color: 'from-purple-600 to-purple-700'
    },
    {
      icon: TrendingUpIcon,
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      change: '+2.1%',
      color: 'from-orange-600 to-orange-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold font-funnel">{card.value}</p>
                <p className="text-sm text-green-600 mt-1">{card.change}</p>
              </div>
              <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
