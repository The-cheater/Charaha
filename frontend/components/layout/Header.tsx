"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import XIcon from '@mui/icons-material/X'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()

  const handleQuickSearch = () => {
    router.push('/search')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <XIcon /> : <MenuIcon />}
          </Button>
          
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TM</span>
            </div>
            <span className="hidden font-bold sm:inline-block">TeamMemory</span>
          </Link>
        </div>

        {/* Center - Quick Search */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <Button
            variant="outline"
            onClick={handleQuickSearch}
            className="w-full justify-start text-muted-foreground"
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            Quick search...
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleQuickSearch}
          >
            <SearchIcon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <NotificationsIcon className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <AccountCircleIcon className="h-5 w-5" />
            </Button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md"
                >
                  <Link
                    href="/profile"
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t md:hidden"
          >
            <div className="container py-4 space-y-2">
              <Link
                href="/dashboard"
                className="block px-2 py-1 text-sm hover:bg-accent rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/search"
                className="block px-2 py-1 text-sm hover:bg-accent rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/sources"
                className="block px-2 py-1 text-sm hover:bg-accent rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Data Sources
              </Link>
              <Link
                href="/analytics"
                className="block px-2 py-1 text-sm hover:bg-accent rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
