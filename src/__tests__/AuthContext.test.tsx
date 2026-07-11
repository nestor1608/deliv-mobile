import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';

// Mock authApi module
let mockAuthApi: {
  login: jest.Mock;
  logout: jest.Mock;
  register: jest.Mock;
  getAccessToken: jest.Mock;
  refreshAccessToken: jest.Mock;
  getProfile: jest.Mock;
  updateProfile: jest.Mock;
};

jest.mock('../services/authApi', () => {
  mockAuthApi = {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    getAccessToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };
  return mockAuthApi;
});

function createContextCapture() {
  let captured: React.ContextType<typeof AuthContext> | undefined;
  function Consumer() {
    captured = React.useContext(AuthContext);
    return null;
  }
  return { Consumer, getCaptured: () => captured };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.deleteItemAsync.mockResolvedValue();
  });

  test('AuthProvider renders children when not loading', async () => {
    const { Consumer, getCaptured } = createContextCapture();

    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
    });
  });

  test('context provides correct initial state', async () => {
    const { Consumer, getCaptured } = createContextCapture();

    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
      expect(ctx?.userToken).toBeNull();
      expect(ctx?.isAuthenticated).toBe(false);
    });
  });

  test('login stores tokens in SecureStore', async () => {
    mockAuthApi.login.mockResolvedValueOnce({
      access: 'new-access-token',
      refresh: 'new-refresh-token',
      user: { id: 1, username: 'testuser' },
    });

    const { Consumer, getCaptured } = createContextCapture();
    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
    });

    const ctx = getCaptured();
    await act(async () => {
      await ctx!.login('testuser', 'mypassword', 'customer');
    });

    expect(mockAuthApi.login).toHaveBeenCalledWith('testuser', 'mypassword', 'customer');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'new-access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
  });

  test('logout removes tokens from SecureStore', async () => {
    mockAuthApi.logout.mockResolvedValueOnce(undefined);

    const { Consumer, getCaptured } = createContextCapture();
    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
    });

    const ctx = getCaptured();
    await act(async () => {
      await ctx!.logout();
    });

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  });

  test('register calls authApi.register and stores tokens on success', async () => {
    mockAuthApi.register.mockResolvedValueOnce({
      access: 'reg-access-token',
      refresh: 'reg-refresh-token',
      user: { id: 2, username: 'newuser' },
    });

    const { Consumer, getCaptured } = createContextCapture();
    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
    });

    const ctx = getCaptured();
    await act(async () => {
      await ctx!.register({
        username: 'newuser',
        password: 'secret123',
        email: 'new@test.com',
      });
    });

    expect(mockAuthApi.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'secret123',
      email: 'new@test.com',
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'reg-access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'reg-refresh-token');
  });

  test('refreshAccessToken calls authApi.refreshAccessToken and updates token', async () => {
    mockAuthApi.refreshAccessToken.mockResolvedValueOnce('refreshed-access-token');
    SecureStore.getItemAsync.mockImplementation((key: string) => {
      if (key === 'refreshToken') return Promise.resolve('existing-refresh');
      return Promise.resolve(null);
    });

    const { Consumer, getCaptured } = createContextCapture();
    render(<Consumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx?.isLoading).toBe(false);
    });

    const ctx = getCaptured();
    await act(async () => {
      const newToken = await ctx!.refreshAccessToken();
      expect(newToken).toBe('refreshed-access-token');
    });
  });
});
