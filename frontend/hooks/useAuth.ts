// hooks/useAuth.ts
'client';

import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.login({ email, password });
      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.signup({ name, email, password });
      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setError(null);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await api.ping();
    } catch {
      return false;
    }
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = api.getStoredUser();
        
        if (token && storedUser) {
          const isConnected = await checkConnection();
          if (isConnected) {
            setUser(storedUser);
          } else {
            api.logout();
            setError('Cannot connect to server. Please check if the backend is running.');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        api.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [checkConnection]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    error,
    clearError,
    checkConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  ) as React.ReactElement;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
