"use client"

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SvgIconTypeMap } from '@mui/material'
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import StorageIcon from '@mui/icons-material/Storage'
import HistoryIcon from '@mui/icons-material/History'
import TuneIcon from '@mui/icons-material/Tune'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRight from '@mui/icons-material/ChevronRight'
import ChevronDown from '@mui/icons-material/ExpandMore'
import AddCircleIcon from '@mui/icons-material/AddCircle'

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: DashboardIcon 
  },
  { 
    name: 'Search', 
    href: '/search', 
    icon: SearchIcon,
    children: [
      { name: 'Basic Search', href: '/search' },
      { name: 'Advanced Search', href: '/search/advanced' },
      { name: 'Search History', href: '/search/history' }
    ]
  },
  { 
    name: 'Data Sources', 
    href: '/sources', 
    icon: StorageIcon,
    children: [
      { name: 'All Sources', href: '/sources' },
      { name: 'Add Slack', href: '/sources/add/slack' },
      { name: 'Add Google Drive', href: '/sources/add/google' }
    ]
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: AnalyticsIcon,
    children: [
      { name: 'Overview', href: '/analytics' },
      { name: 'Search Stats', href: '/analytics/search' },
      { name: 'Source Stats', href: '/analytics/sources' }
    ]
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: PersonIcon 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: SettingsIcon 
  }
]

// Add test page in development
if (process.env.NODE_ENV === 'development') {
  const TestIcon: React.ComponentType<{ className?: string }> = ({ className }) => (
    <span className={className}>🧪</span>
  )
  
  navigation.push({
    name: 'Test Backend',
    href: '/test-auth',
    icon: TestIcon
  })
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemActive = (href: string, children?: any[]) => {
    if (pathname === href) return true
    if (children) {
      return children.some(child => pathname === child.href)
    }
    return false
  }

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    const isActive = isItemActive(item.href, item.children)

    return (
      <div>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              "flex items-center flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={() => setIsOpen(false)}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Link>
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(item.name)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-4">
            {item.children.map((child: any) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-1.5 text-xs rounded-md transition-colors",
                  pathname === child.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setIsOpen(false)}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 transform bg-background border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">TM</span>
              </div>
              <span className="font-bold">TeamMemory</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="border-t p-4">
            <div className="space-y-2">
              <Link href="/sources/add/slack">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <AddCircleIcon className="mr-2 h-4 w-4" />
                  Add Data Source
                </Button>
              </Link>
              
              <Link href="/search/advanced">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <TuneIcon className="mr-2 h-4 w-4" />
                  Advanced Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
