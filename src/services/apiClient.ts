import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../utils/config';

interface ApiError {
  status: number;
  data: any;
  message: string;
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refresh = await SecureStore.getItemAsync('refreshToken');
    if (!refresh) return null;

    const response = await fetch(`${getApiBaseUrl()}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    await SecureStore.setItemAsync('userToken', data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = {
    ...options.headers,
  };

  // Let the runtime set the correct Content-Type/boundary for FormData.
  if (!(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.skipAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    signal: options.signal,
  };

  let response = await fetch(url, fetchOptions);

  // Auto-refresh on 401
  if (response.status === 401 && !options.skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...fetchOptions, headers });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      status: response.status,
      data: errorData,
      message: errorData.detail || errorData.message || `Request failed with status ${response.status}`,
    };
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  patch: <T>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  put: <T>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),

  // For multipart/form-data (file uploads) — no Content-Type header
  upload: <T>(method: string, path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(method, path, formData, options),
};

export default apiClient;
export type { ApiError, RequestOptions };
