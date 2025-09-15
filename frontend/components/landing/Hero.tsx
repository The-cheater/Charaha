"use client"

import { Button } from '@/components/ui/button'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'
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
              <h1 className="font-funnel text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight flex flex-col md:flex-row md:items-center gap-2">
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
            className="mt-6 text-xl md:text-2xl text-muted-foreground font-inter max-w-4xl mx-auto"
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
          
          <div className="mt-16 relative">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
            <div className="relative rounded-xl border bg-black/[0.96] p-0 overflow-hidden h-[420px]">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
