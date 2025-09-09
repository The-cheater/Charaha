"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SearchIcon from '@mui/icons-material/Search'
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import GroupIcon from '@mui/icons-material/Group'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import { motion } from 'framer-motion'

const features = [
  {
    icon: SearchIcon,
    title: 'Semantic Search',
    description: 'Find information using natural language queries. Our AI understands context and meaning, not just keywords.',
  },
  {
    icon: IntegrationInstructionsIcon,
    title: 'Universal Integration',
    description: 'Connect Slack, Google Docs, Notion, and more. One search interface for all your team\'s knowledge.',
  },
  {
    icon: SpeedIcon,
    title: 'Lightning Fast',
    description: 'Get instant results with our optimized vector search. Average response time under 150ms.',
  },
  {
    icon: SecurityIcon,
    title: 'Enterprise Security',
    description: 'Your data stays secure with end-to-end encryption and compliance with SOC 2 and GDPR.',
  },
  {
    icon: GroupIcon,
    title: 'Team Collaboration',
    description: 'Share knowledge, bookmark important findings, and collaborate on search results.',
  },
  {
    icon: AnalyticsIcon,
    title: 'Smart Analytics',
    description: 'Track usage patterns, identify knowledge gaps, and optimize your team\'s information flow.',
  },
]

export function Features() {
  return (
    <section className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-funnel text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{' '}
            <span className="gradient-text">unlock your team's knowledge</span>
          </h2>
          <p className="text-lg text-muted-foreground font-dm-sans max-w-2xl mx-auto">
            Powerful features designed to make your team's collective intelligence accessible, searchable, and actionable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-funnel text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-dm-sans text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
