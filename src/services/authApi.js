import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../utils/config';

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const login = async (username, password, userType) => {
    const formData = new FormData();
    formData.append('username_or_email', username);
    formData.append('password', password);
    formData.append('user_type', userType);

    const response = await api.post('auth/token/', formData, {
        headers: {
            'Accept': 'application/json',
        }
    });

    await SecureStore.setItemAsync('userToken', response.data.access);
    await SecureStore.setItemAsync('refreshToken', response.data.refresh);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    return response.data;
};

export const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('userData');
};

export const register = async (userData) => {
    const response = await api.post('auth/register/', userData);
    return response.data;
};

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync('userToken');
};

export const refreshAccessToken = async () => {
    const refresh = await SecureStore.getItemAsync('refreshToken');
    if (!refresh) throw new Error('No refresh token');
    const response = await api.post('auth/token/refresh/', { refresh });
    await SecureStore.setItemAsync('userToken', response.data.access);
    return response.data.access;
};

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
