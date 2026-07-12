// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../services/authApi';
import type { UserData, LoginCredentials, RegisterData } from '../types';

export interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userData: UserData | null;
  API_BASE_URL: string;
  login: (username: string, password: string, userType: string) => Promise<any>;
  register: (userData: RegisterData) => Promise<any>;
  logout: () => Promise<any>;
  updateProfile: (profileData: Partial<UserData>) => Promise<{ success: boolean; data: UserData }>;
  refreshAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Module-level flag that survives component remounts
let _loggedOut = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api'; // kept for backward compatibility

  // Restore auth state on mount
  useEffect(() => {
    restoreAuthState();
  }, []);

  const restoreAuthState = async () => {
    try {
      setIsLoading(true);

      // Skip if user just logged out (survives component remounts)
      if (_loggedOut) {
        setIsLoading(false);
        return;
      }
      const token = await SecureStore.getItemAsync('userToken');
      const refresh = await SecureStore.getItemAsync('refreshToken');

      if (token && refresh) {
        setUserToken(token);
        // Verify token is valid
        try {
          const profile = await authApi.getProfile();
          setUserData(profile);
        } catch {
          // Token invalid, try refresh
          try {
            const newToken = await authApi.refreshAccessToken();
            setUserToken(newToken);
            const profile = await authApi.getProfile();
            setUserData(profile);
          } catch {
            // Everything failed, logout
            await clearAuthState();
          }
        }
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      await clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthState = async () => {
    _loggedOut = true;  // Module-level flag, survives remounts
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUserToken(null);
    setUserData(null);
    queryClient.clear();
  };

  const loginMutation = useMutation({
    mutationFn: ({ username, password, userType }: LoginCredentials) =>
      authApi.login(username, password, userType),
    onSuccess: async (data) => {
      _loggedOut = false;  // Reset so next auth check works
      await SecureStore.setItemAsync('userToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
      setUserToken(data.access);
      setUserData(data.user);
      // Prefetch profile
      try {
        const profile = await authApi.getProfile();
        setUserData(profile);
        queryClient.setQueryData(['auth', 'profile'], profile);
      } catch {}
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterData) => authApi.register(userData),
    onSuccess: async (data) => {
      _loggedOut = false;  // Reset so next auth check works
      if (data.access && data.refresh) {
        await SecureStore.setItemAsync('userToken', data.access);
        await SecureStore.setItemAsync('refreshToken', data.refresh);
        setUserToken(data.access);
        setUserData(data.user || null);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      await clearAuthState();
    },
  });

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing) return null;
    try {
      setIsRefreshing(true);
      const newToken = await authApi.refreshAccessToken();
      if (newToken) {
        await SecureStore.setItemAsync('userToken', newToken);
        setUserToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      await clearAuthState();
      throw new Error('Session expired');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const contextValue = useMemo<AuthContextType>(() => ({
    isLoading,
    userToken,
    userData,
    API_BASE_URL,
    login: (username: string, password: string, userType: string) =>
      loginMutation.mutateAsync({ username, password, userType }),
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: async (profileData: Partial<UserData>) => {
      const data = await authApi.updateProfile(profileData);
      setUserData(data);
      queryClient.setQueryData(['auth', 'profile'], data);
      return { success: true, data };
    },
    refreshAccessToken,
    isAuthenticated: !!userToken,
    authenticatedFetch: async (url: string, options: RequestInit = {}) => {
      const token = userToken || (await refreshAccessToken());
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    },
  }), [isLoading, userToken, userData, API_BASE_URL, loginMutation, registerMutation, logoutMutation, refreshAccessToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
