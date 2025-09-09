"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import SearchIcon from '@mui/icons-material/Search'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <SearchIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="font-funnel text-2xl font-bold gradient-text">Join TeamMemory</h1>
          <p className="text-muted-foreground font-dm-sans">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-funnel">Create Account</CardTitle>
            <CardDescription className="font-dm-sans">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground font-dm-sans">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
