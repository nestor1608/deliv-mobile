// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
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

// SQLite helper — survives full JS reloads (writes to disk file)
let _db: any = null;
async function getDb() {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('auth.db');
    await _db.execAsync('CREATE TABLE IF NOT EXISTS flags (key TEXT PRIMARY KEY, value TEXT)');
  }
  return _db;
}

async function getFlag(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync('SELECT value FROM flags WHERE key = ?', key);
    return row?.value ?? null;
  } catch { return null; }
}

async function setFlag(key: string, value: string) {
  try {
    const db = await getDb();
    await db.runAsync('INSERT OR REPLACE INTO flags (key, value) VALUES (?, ?)', key, value);
  } catch (e) { console.warn('Failed to set flag:', e); }
}

const LOGGED_OUT_FLAG = 'loggedOut';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    restoreAuthState();
  }, []);

  const restoreAuthState = async () => {
    try {
      setIsLoading(true);

      // Check SQLite flag FIRST — survives full JS reloads
      const loggedOut = await getFlag(LOGGED_OUT_FLAG);
      if (loggedOut === 'true') {
        console.log('Logout flag found — skipping auto-login');
        setIsLoading(false);
        return;
      }

      const token = await SecureStore.getItemAsync('userToken');
      const refresh = await SecureStore.getItemAsync('refreshToken');

      if (token && refresh) {
        setUserToken(token);
        try {
          const profile = await authApi.getProfile();
          setUserData(profile);
        } catch {
          try {
            const newToken = await authApi.refreshAccessToken();
            if (newToken) {
              setUserToken(newToken);
              const profile = await authApi.getProfile();
              setUserData(profile);
            }
          } catch {
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
    // Store flag in SQLite — SURVIVES full JS reloads (unlike SecureStore on Android 10)
    await setFlag(LOGGED_OUT_FLAG, 'true');
    // Also try to clear SecureStore (best effort)
    try { await SecureStore.deleteItemAsync('userToken'); } catch {}
    try { await SecureStore.deleteItemAsync('refreshToken'); } catch {}
    setUserToken(null);
    setUserData(null);
    queryClient.clear();
  };

  const loginMutation = useMutation({
    mutationFn: ({ username, password, userType }: LoginCredentials) =>
      authApi.login(username, password, userType),
    onSuccess: async (data) => {
      await setFlag(LOGGED_OUT_FLAG, 'false');
      await SecureStore.setItemAsync('userToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
      setUserToken(data.access);
      setUserData(data.user);
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
      if (data.access && data.refresh) {
        await setFlag(LOGGED_OUT_FLAG, 'false');
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

  const contextValue = useMemo(() => ({
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
    authenticatedFetch: async (url: string, options: RequestInit = {}) => {
      let token = userToken || await SecureStore.getItemAsync('userToken');
      if (!token) throw new Error('No authentication token available');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };
      let response = await fetch(url, { ...options, headers });
      if (response.status === 401 && !isRefreshing) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
          }
        } catch {
          await clearAuthState();
          throw new Error('Authentication failed');
        }
      }
      return response;
    },
    refreshAccessToken,
    isAuthenticated: !!userToken,
  }), [isLoading, userToken, userData, isRefreshing, loginMutation.mutateAsync, registerMutation.mutateAsync, logoutMutation.mutateAsync, queryClient, refreshAccessToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
