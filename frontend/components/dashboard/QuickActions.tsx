"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import SettingsIcon from '@mui/icons-material/Settings'
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'
import HelpIcon from '@mui/icons-material/Help'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      icon: SearchIcon,
      title: 'Advanced Search',
      description: 'Use filters and operators',
      href: '/search',
      color: 'from-blue-600 to-blue-700'
    },
    {
      icon: AddIcon,
      title: 'Add Data Source',
      description: 'Connect new integrations',
      href: '/settings?tab=integrations',
      color: 'from-green-600 to-green-700'
    },
    {
      icon: AnalyticsIcon,
      title: 'View Analytics',
      description: 'See usage insights',
      href: '/analytics',
      color: 'from-purple-600 to-purple-700'
    },
    {
      icon: IntegrationInstructionsIcon,
      title: 'Manage Integrations',
      description: 'Configure connections',
      href: '/settings',
      color: 'from-orange-600 to-orange-700'
    },
    {
      icon: SettingsIcon,
      title: 'Settings',
      description: 'Account preferences',
      href: '/settings',
      color: 'from-red-600 to-red-700'
    },
    {
      icon: HelpIcon,
      title: 'Help & Support',
      description: 'Get assistance',
      href: '/help',
      color: 'from-indigo-600 to-indigo-700'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-funnel">Quick Actions</CardTitle>
        <CardDescription className="font-dm-sans">
          Frequently used features and tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              asChild
              className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all group"
            >
              <Link href={action.href}>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium font-dm-sans">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
