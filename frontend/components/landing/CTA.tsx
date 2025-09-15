"use client"

import { Button } from '@/components/ui/button'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <h2 className="font-funnel text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your team's knowledge?
          </h2>
          <p className="text-xl md:text-2xl opacity-90 font-inter max-w-2xl mx-auto mb-8">
            Join thousands of teams who have already revolutionized how they find and share information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href="/signup">
                Start Free Trial
                <ArrowForwardIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
