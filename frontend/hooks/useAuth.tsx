// hooks/useAuth.ts
'client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

// Create the context with a default value that matches AuthContextType
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  error: null,
  clearError: () => {},
  checkConnection: async () => false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
{{ ... }}
    clearError,
    checkConnection
  };

  // Create a valid JSX element with proper typing
  const AuthProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );

  return <AuthProviderComponent>{children}</AuthProviderComponent>;
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
