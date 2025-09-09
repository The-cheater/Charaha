import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Analytics } from '@/components/landing/Analytics'
import { CTA } from '@/components/landing/CTA'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Analytics />
      <CTA />
    </>
  )
}
