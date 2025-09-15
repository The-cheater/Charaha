"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import XIcon from '@mui/icons-material/X'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <SearchIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-funnel text-2xl font-bold gradient-text">
            TeamMemory
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">
            Search
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
            Profile
          </Link>
          <Link href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
            Settings
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="hidden md:flex space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <div className="container py-4 space-y-4">
              <Link 
                href="/search" 
                className="block text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link 
                href="/profile" 
                className="block text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                href="/settings" 
                className="block text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="ghost" asChild className="flex-1">
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="gradient" asChild className="flex-1">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
