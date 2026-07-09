import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

global.fetch = jest.fn();

function createContextCapture() {
  let captured;
  function Consumer() {
    captured = React.useContext(AuthContext);
    return null;
  }
  return { Consumer, getCaptured: () => captured };
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();

    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.deleteItemAsync.mockResolvedValue();

    global.fetch.mockReset();
  });

  test('AuthProvider renders children when not loading', async () => {
    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
    });
  });

  test('context provides correct initial state', async () => {
    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
      expect(ctx.userToken).toBeNull();
      expect(ctx.isAuthenticated).toBe(false);
    });
  });

  test('login stores tokens in SecureStore and user data in AsyncStorage', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: 'new-access-token',
        refresh: 'new-refresh-token',
        user: { id: 1, username: 'testuser' },
      }),
    });

    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
    });

    const ctxBefore = getCaptured();

    await act(async () => {
      await ctxBefore.login('testuser', 'mypassword', 'customer');
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'new-access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify({ id: 1, username: 'testuser' }));
  });

  test('logout removes all items from SecureStore and AsyncStorage', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: 'tok',
        refresh: 'ref',
        user: { id: 1, username: 'u' },
      }),
    });

    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
    });

    const ctxBefore = getCaptured();

    await act(async () => {
      await ctxBefore.login('testuser', 'mypassword', 'customer');
    });

    jest.clearAllMocks();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await act(async () => {
      const ctx = getCaptured();
      await ctx.logout();
    });

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
  });

  test('register calls POST /auth/register/ and stores tokens on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: 'reg-access-token',
        refresh: 'reg-refresh-token',
        user: { id: 2, username: 'newuser' },
      }),
    });

    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
    });

    const ctx = getCaptured();

    await act(async () => {
      await ctx.register({
        username: 'newuser',
        password: 'secret123',
        email: 'new@test.com',
      });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register/'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"username":"newuser"'),
      })
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'reg-access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'reg-refresh-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify({ id: 2, username: 'newuser' }));
  });

  test('refreshAccessToken calls POST /auth/token/refresh/ and updates userToken', async () => {
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userToken') return Promise.resolve('existing-token');
      if (key === 'refreshToken') return Promise.resolve('existing-refresh');
      return Promise.resolve(null);
    });
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ id: 1, username: 'test' }));

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access: 'refreshed-access-token',
        }),
      });

    const { Consumer, getCaptured } = createContextCapture();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      const ctx = getCaptured();
      expect(ctx).toBeDefined();
      expect(ctx.isLoading).toBe(false);
    });

    const ctx = getCaptured();

    await act(async () => {
      await ctx.refreshAccessToken();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/token/refresh/'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"refresh":"existing-refresh"'),
      })
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'refreshed-access-token');
  });
});
