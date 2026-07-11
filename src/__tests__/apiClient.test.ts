import apiClient from '../services/apiClient';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock config
jest.mock('../utils/config', () => ({
  getApiBaseUrl: () => 'http://localhost:8000/api',
}));

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('get() calls fetch with GET method', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: 'test' }) });
    const result = await apiClient.get('test/');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/test/',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ data: 'test' });
  });

  test('post() sends JSON body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    const result = await apiClient.post('test/', { name: 'test' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/test/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  test('throws ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not found' }),
    });
    await expect(apiClient.get('nonexistent/')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    });
  });

  test('handles 401 with token refresh', async () => {
    const mockGetItem = jest.fn()
      .mockResolvedValueOnce('old-token') // for auth header
      .mockResolvedValueOnce('refresh-token'); // for refresh
    const mockSetItem = jest.fn();
    const secureStore = require('expo-secure-store');
    secureStore.getItemAsync.mockImplementation(mockGetItem);
    secureStore.setItemAsync.mockImplementation(mockSetItem);

    // First call returns 401, refresh succeeds
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) }) // original request fails
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access: 'new-token' }) }) // refresh succeeds
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: 'retried' }) }); // retry succeeds

    const result = await apiClient.get('test/');
    expect(result).toEqual({ data: 'retried' });
    expect(mockSetItem).toHaveBeenCalledWith('userToken', 'new-token');
  });
});
