// src/services/authApi.ts
import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';
import type { LoginResponse, RegisterResponse, UserData } from '../types';

export const login = async (username: string, password: string, userType: string): Promise<LoginResponse> => {
  const data = await apiClient.post<LoginResponse>('auth/token/', {
    username_or_email: username.toLowerCase().trim(),
    password,
    user_type: userType,
  }, { skipAuth: true });

  await SecureStore.setItemAsync('userToken', data.access);
  await SecureStore.setItemAsync('refreshToken', data.refresh);

  return data;
};

export const logout = async (): Promise<void> => {
  // Try server logout, then clear local
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      await apiClient.post('auth/logout/', { refresh_token: refreshToken }, { skipAuth: true });
    }
  } catch (e) {
    console.warn('Server logout failed:', e);
  }

  await Promise.all([
    SecureStore.deleteItemAsync('userToken'),
    SecureStore.deleteItemAsync('refreshToken'),
  ]);
};

export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  userType: string;
  phone?: string;
}): Promise<RegisterResponse> => {
  return apiClient.post<RegisterResponse>('auth/register/', {
    ...userData,
    email: userData.email.toLowerCase().trim(),
    username: userData.username.toLowerCase().trim(),
  }, { skipAuth: true });
};

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync('userToken');
};

export const refreshAccessToken = async (): Promise<string> => {
  const refresh = await SecureStore.getItemAsync('refreshToken');
  if (!refresh) throw new Error('No refresh token');

  const data = await apiClient.post<{ access: string }>('auth/token/refresh/', { refresh }, { skipAuth: true });
  await SecureStore.setItemAsync('userToken', data.access);
  return data.access;
};

export const getProfile = async (): Promise<UserData> => {
  return apiClient.get<UserData>('auth/profile/');
};

export const updateProfile = async (profileData: Partial<UserData>): Promise<UserData> => {
  return apiClient.patch<UserData>('auth/profile/', profileData);
};

export const verifyToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  try {
    await apiClient.post('auth/token/verify/', { token }, { skipAuth: true });
    return true;
  } catch {
    return false;
  }
};
