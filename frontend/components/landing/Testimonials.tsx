"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StarIcon from '@mui/icons-material/Star'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Engineering Manager',
    company: 'TechCorp',
    avatar: '/api/placeholder/50/50',
    content: 'TeamMemory has revolutionized how our engineering team shares knowledge. We can find any discussion or document in seconds.',
    rating: 5
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Product Director',
    company: 'StartupXYZ',
    avatar: '/api/placeholder/50/50',
    content: 'The semantic search is incredibly accurate. It understands context and finds exactly what we need, even with vague queries.',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'Operations Lead',
    company: 'GrowthCo',
    avatar: '/api/placeholder/50/50',
    content: 'Integration was seamless. Within hours, our entire knowledge base was searchable. The time savings are immense.',
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-funnel text-3xl md:text-4xl font-bold mb-4">
            Trusted by teams worldwide
          </h2>
          <p className="text-lg text-muted-foreground font-dm-sans max-w-2xl mx-auto">
            See what our customers have to say about transforming their team's knowledge management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground font-dm-sans mb-6">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium font-dm-sans">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
