"use client"

import { useState, useEffect, createContext, useContext } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (userData: any) => Promise<void>
  isLoading: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token')
    if (token) {
      // Validate token and set user
      setUser({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      })
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // API call simulation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        id: '1',
        name: 'John Doe',
        email: email
      }
      
      setUser(userData)
      localStorage.setItem('token', 'fake-jwt-token')
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (userData: any) => {
    setIsLoading(true)
    try {
      // API call simulation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = {
        id: '1',
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email
      }
      
      setUser(user)
      localStorage.setItem('token', 'fake-jwt-token')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  return {
    user,
    login,
    logout,
    signup,
    isLoading
  }
}
