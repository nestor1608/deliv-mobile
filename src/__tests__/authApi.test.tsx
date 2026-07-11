// src/__tests__/authApi.test.tsx
let mockApiClient: {
  post: jest.Mock;
  get: jest.Mock;
  patch: jest.Mock;
};

jest.mock('../services/apiClient', () => {
  mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  };
  return mockApiClient;
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../utils/config', () => ({
  getApiBaseUrl: jest.fn(() => 'http://localhost:8000/api'),
  getProjectId: jest.fn(() => 'test-project-id'),
}));

import SecureStore from 'expo-secure-store';
import {
  login,
  logout,
  register,
  getAccessToken,
  refreshAccessToken,
  getProfile,
  updateProfile,
} from '../services/authApi';

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockResolvedValue(null);
  SecureStore.setItemAsync.mockResolvedValue();
  SecureStore.deleteItemAsync.mockResolvedValue();
});

test('login calls POST /auth/token/ and stores tokens in SecureStore', async () => {
  const responseData = {
    access: 'access-token-123',
    refresh: 'refresh-token-456',
    user: { id: 1, username: 'testuser', email: 'test@test.com' },
  };
  mockApiClient.post.mockResolvedValueOnce(responseData);

  const result = await login('testuser', 'password123', 'customer');

  expect(mockApiClient.post).toHaveBeenCalledWith(
    'auth/token/',
    {
      username_or_email: 'testuser',
      password: 'password123',
      user_type: 'customer',
    },
    { skipAuth: true }
  );
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'access-token-123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
  expect(result).toEqual(responseData);
});

test('logout removes tokens from SecureStore', async () => {
  SecureStore.getItemAsync.mockResolvedValue('some-refresh-token');
  mockApiClient.post.mockResolvedValueOnce({});

  await logout();

  expect(mockApiClient.post).toHaveBeenCalledWith('auth/logout/', {
    refresh_token: 'some-refresh-token',
  }, { skipAuth: true });
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
});

test('getAccessToken returns the stored access token', async () => {
  SecureStore.getItemAsync.mockResolvedValue('stored-access-token');

  const token = await getAccessToken();

  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
  expect(token).toBe('stored-access-token');
});

test('refreshAccessToken calls POST /auth/token/refresh/ and stores new token', async () => {
  SecureStore.getItemAsync.mockResolvedValueOnce('old-refresh-token');
  mockApiClient.post.mockResolvedValueOnce({ access: 'new-access-token' });

  const newToken = await refreshAccessToken();

  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
  expect(mockApiClient.post).toHaveBeenCalledWith(
    'auth/token/refresh/',
    { refresh: 'old-refresh-token' },
    { skipAuth: true }
  );
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'new-access-token');
  expect(newToken).toBe('new-access-token');
});

test('refreshAccessToken throws when no refresh token', async () => {
  SecureStore.getItemAsync.mockResolvedValue(null);

  await expect(refreshAccessToken()).rejects.toThrow('No refresh token');
});

test('register calls POST /auth/register/ with user data', async () => {
  const userData = {
    username: 'newuser',
    password: 'secret123',
    email: 'new@test.com',
  };
  const responseData = { id: 2, username: 'newuser', email: 'new@test.com' };
  mockApiClient.post.mockResolvedValueOnce(responseData);

  const result = await register(userData);

  expect(mockApiClient.post).toHaveBeenCalledWith(
    'auth/register/',
    {
      ...userData,
      email: 'new@test.com',
      username: 'newuser',
    },
    { skipAuth: true }
  );
  expect(result).toEqual(responseData);
});

test('getProfile calls GET /auth/profile/', async () => {
  const profileData = { id: 1, username: 'testuser', email: 'test@test.com' };
  mockApiClient.get.mockResolvedValueOnce(profileData);

  const result = await getProfile();

  expect(mockApiClient.get).toHaveBeenCalledWith('auth/profile/');
  expect(result).toEqual(profileData);
});

test('updateProfile calls PATCH /auth/profile/ with data', async () => {
  const profileData = { first_name: 'Updated' };
  const responseData = { id: 1, first_name: 'Updated' };
  mockApiClient.patch.mockResolvedValueOnce(responseData);

  const result = await updateProfile(profileData);

  expect(mockApiClient.patch).toHaveBeenCalledWith('auth/profile/', profileData);
  expect(result).toEqual(responseData);
});
