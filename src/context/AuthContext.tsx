import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserSegment } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; pass: string; name: string; segment: UserSegment; currency: string; monthlyIncome: number }) => Promise<void>;
  demoLogin: (segment?: UserSegment) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('expense_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Auth token validation failed, logging out');
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login(email, pass);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    pass: string;
    name: string;
    segment: UserSegment;
    currency: string;
    monthlyIncome: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.register({
        email: data.email,
        password: data.pass,
        name: data.name,
        segment: data.segment,
        currency: data.currency,
        monthlyIncome: data.monthlyIncome,
      });
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (segment: UserSegment = 'professional') => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.demoLogin(segment);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const result = await api.updateProfile(updates);
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
