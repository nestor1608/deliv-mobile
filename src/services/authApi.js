import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://9b1d-181-91-166-174.ngrok-free.app/api';

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
    
    await AsyncStorage.setItem('accessToken', response.data.access);
    await AsyncStorage.setItem('refreshToken', response.data.refresh);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    return response.data;
};

export const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userData');
};



export const register = async (userData) => {
    // userData: { username, password, ... }
    const response = await api.post('auth/register/', userData);
    return response.data;
};

export const getAccessToken = async () => {
    return await AsyncStorage.getItem('accessToken');
};

export const refreshAccessToken = async () => {
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!refresh) throw new Error('No refresh token');
    const response = await api.post('auth/token/refresh/', { refresh });
    await AsyncStorage.setItem('accessToken', response.data.access);
    return response.data.access;
};

// Interceptor para agregar el token a cada request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
