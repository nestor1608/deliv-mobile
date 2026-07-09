let mockAxiosInstance;
let interceptorHandler;

jest.mock('axios', () => {
  mockAxiosInstance = {
    post: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn((handler) => {
          interceptorHandler = handler;
        }),
      },
    },
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../utils/config', () => ({
  getApiBaseUrl: jest.fn(() => 'http://localhost:8000/api'),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStore from 'expo-secure-store';
import {
  login,
  logout,
  register,
  getAccessToken,
  refreshAccessToken,
} from '../services/authApi';

let mockInstance;

beforeAll(() => {
  mockInstance = mockAxiosInstance;
});

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue(null);
  AsyncStorage.setItem.mockResolvedValue();
  AsyncStorage.removeItem.mockResolvedValue();
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
  mockInstance.post.mockResolvedValueOnce({ data: responseData });

  const result = await login('testuser', 'password123', 'customer');

  expect(mockInstance.post).toHaveBeenCalledWith(
    'auth/token/',
    expect.any(FormData),
    expect.objectContaining({ headers: { Accept: 'application/json' } })
  );
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'access-token-123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'userData',
    JSON.stringify(responseData.user)
  );
  expect(result).toEqual(responseData);
});

test('logout removes tokens from SecureStore and userData from AsyncStorage', async () => {
  await logout();

  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
});

test('getAccessToken returns the stored access token', async () => {
  SecureStore.getItemAsync.mockResolvedValue('stored-access-token');

  const token = await getAccessToken();

  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
  expect(token).toBe('stored-access-token');
});

test('refreshAccessToken calls POST /auth/token/refresh/ and stores new token', async () => {
  SecureStore.getItemAsync.mockResolvedValueOnce('old-refresh-token');
  mockInstance.post.mockResolvedValueOnce({
    data: { access: 'new-access-token' },
  });

  const newToken = await refreshAccessToken();

  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
  expect(mockInstance.post).toHaveBeenCalledWith('auth/token/refresh/', {
    refresh: 'old-refresh-token',
  });
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'new-access-token');
  expect(newToken).toBe('new-access-token');
});

test('refreshAccessToken throws when no refresh token', async () => {
  SecureStore.getItemAsync.mockResolvedValue(null);

  await expect(refreshAccessToken()).rejects.toThrow('No refresh token');
});

test('request interceptor adds Authorization Bearer header', async () => {
  SecureStore.getItemAsync.mockResolvedValue('my-bearer-token');

  const config = { headers: {} };
  const result = await interceptorHandler(config);

  expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
  expect(result.headers.Authorization).toBe('Bearer my-bearer-token');
});

test('register calls POST /auth/register/ with user data', async () => {
  const userData = {
    username: 'newuser',
    password: 'secret123',
    email: 'new@test.com',
  };
  const responseData = { id: 2, username: 'newuser', email: 'new@test.com' };
  mockInstance.post.mockResolvedValueOnce({ data: responseData });

  const result = await register(userData);

  expect(mockInstance.post).toHaveBeenCalledWith('auth/register/', userData);
  expect(result).toEqual(responseData);
});
