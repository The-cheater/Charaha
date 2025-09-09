"use client"

import { Button } from '@/components/ui/button'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      
      <div className="container relative py-20 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8 md:justify-center md:items-center">
              <img
                src="/avatar.png"
                alt="Avatar"
                className="w-20 h-20 object-cover"
              />
              <h1 className="font-funnel text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight flex flex-col md:flex-row md:items-center gap-2">
                Your Team's{' '}
                <span className="gradient-text">
                  Collective Memory
                </span>
              </h1>
            </div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground font-dm-sans max-w-3xl mx-auto"
          >
            Stop searching through endless Slack messages and Google Docs. 
            TeamMemory creates a unified, searchable knowledge base from all your team's conversations and documents.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" variant="gradient" asChild className="group">
              <Link href="/signup">
                Get Started Free
                <ArrowForwardIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="group">
              <PlayArrowIcon className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-4">
                <div className="h-full w-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 blur-2xl"></div>
              </div>
              <div className="relative rounded-xl border bg-background/80 backdrop-blur-sm p-4">
                <img
                  src="/api/placeholder/800/500"
                  alt="TeamMemory Dashboard"
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
