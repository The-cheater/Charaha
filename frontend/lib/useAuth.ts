'use client';

import { useAuthStore } from './authStore';
import { api } from './api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useAuth = () => {
  const router = useRouter();
  const { user, token, isAuthenticated, login: setLogin, logout: setLogout } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      const response: any = await api.auth.login({ email, password });
      setLogin(response.user, response.token);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response: any = await api.auth.register({ name, email, password });
      setLogin(response.user, response.token);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      setLogout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      setLogout();
      router.push('/login');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await api.auth.resetPassword(email);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
      throw error;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
  };
};
