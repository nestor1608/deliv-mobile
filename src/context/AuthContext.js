// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { getApiBaseUrl } from '../utils/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Configuración segura de API desde config centralizado
    const API_BASE_URL = getApiBaseUrl();

    // Timeout para requests
    const REQUEST_TIMEOUT = 15000;

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            setIsLoading(true);
            const token = await SecureStore.getItemAsync('userToken');
            const user = await AsyncStorage.getItem('userData');
            const refresh = await SecureStore.getItemAsync('refreshToken');
            
            if (token && user && refresh) {
                setUserToken(token);
                setUserData(JSON.parse(user));
                setRefreshToken(refresh);
                
                // Verificar validez del token
                const isValid = await validateToken(token);
                if (!isValid) {
                    console.log('Token inválido, cerrando sesión...');
                    await logout();
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            await logout(); // Limpiar estado en caso de error
        } finally {
            setIsLoading(false);
        }
    };

    const validateToken = async (token) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/auth/token/verify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Token validation timeout');
            } else {
                console.error('Token validation error:', error);
            }
            return false;
        }
    };

    const login = async (username, password, userType = 'customer') => {
        try {
            setIsLoading(true);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/auth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username_or_email: username.toLowerCase().trim(),
                    password,
                    user_type: userType,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                // Validar estructura de respuesta
                if (!data.access || !data.refresh || !data.user) {
                    throw new Error('Respuesta del servidor incompleta');
                }

                // Guardar tokens de forma segura
                await Promise.all([
                    SecureStore.setItemAsync('userToken', data.access),
                    SecureStore.setItemAsync('refreshToken', data.refresh),
                    AsyncStorage.setItem('userData', JSON.stringify(data.user)),
                ]);

                setUserToken(data.access);
                setRefreshToken(data.refresh);
                setUserData(data.user);

                return { success: true };
            } else {
                // Manejar diferentes tipos de errores
                let errorMessage = 'Error en el login';
                
                if (data.detail) {
                    errorMessage = data.detail;
                } else if (data.non_field_errors) {
                    errorMessage = Array.isArray(data.non_field_errors) 
                        ? data.non_field_errors[0] 
                        : data.non_field_errors;
                } else if (response.status === 401) {
                    errorMessage = 'Credenciales inválidas';
                } else if (response.status >= 500) {
                    errorMessage = 'Error del servidor. Intente más tarde.';
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifique su conexión.');
            }
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setIsLoading(true);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...userData,
                    email: userData.email.toLowerCase().trim(),
                    username: userData.username.toLowerCase().trim(),
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                // Auto-login después del registro exitoso
                if (data.access && data.refresh && data.user) {
                    await Promise.all([
                        SecureStore.setItemAsync('userToken', data.access),
                        SecureStore.setItemAsync('refreshToken', data.refresh),
                        AsyncStorage.setItem('userData', JSON.stringify(data.user)),
                    ]);

                    setUserToken(data.access);
                    setRefreshToken(data.refresh);
                    setUserData(data.user);
                }

                return { success: true, data };
            } else {
                // Manejar errores de validación específicos
                let errorMessage = 'Error en el registro';
                
                if (data.username) {
                    errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
                } else if (data.email) {
                    errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
                } else if (data.password) {
                    errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
                } else if (data.non_field_errors) {
                    errorMessage = Array.isArray(data.non_field_errors) 
                        ? data.non_field_errors[0] 
                        : data.non_field_errors;
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifique su conexión.');
            }
            console.error('Register error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Intentar logout en el servidor si tenemos tokens
            if (userToken && refreshToken) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout más corto para logout

                try {
                    await fetch(`${API_BASE_URL}/auth/logout/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${userToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            refresh_token: refreshToken,
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                } catch (logoutError) {
                    console.warn('Server logout failed:', logoutError);
                    // Continuar con logout local aunque falle el servidor
                }
            }
        } catch (error) {
            console.warn('Logout server error:', error);
        } finally {
            // Limpiar datos locales siempre
            try {
                await Promise.all([
                    SecureStore.deleteItemAsync('userToken').catch(e => console.warn('Error deleting userToken:', e)),
                    SecureStore.deleteItemAsync('refreshToken').catch(e => console.warn('Error deleting refreshToken:', e)),
                    AsyncStorage.removeItem('userData').catch(e => console.warn('Error removing userData:', e)),
                ]);
            } catch (error) {
                console.error('Error clearing local data:', error);
            }
            
            setUserToken(null);
            setUserData(null);
            setRefreshToken(null);
        }
    };

    const refreshAccessToken = useCallback(async () => {
        if (isRefreshing) {
            return null; // Evitar múltiples refreshes simultáneos
        }

        try {
            setIsRefreshing(true);
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                await SecureStore.setItemAsync('userToken', data.access);
                setUserToken(data.access);
                return data.access;
            } else {
                // Refresh token inválido, hacer logout
                console.log('Refresh token inválido, cerrando sesión...');
                await logout();
                throw new Error('Session expired');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Token refresh timeout');
            } else {
                console.error('Token refresh error:', error);
            }
            await logout();
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshToken, isRefreshing]);

    const updateProfile = async (profileData) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/auth/profile/`, {
                method: 'PATCH',
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userData', JSON.stringify(data));
                setUserData(data);
                return { success: true, data };
            } else {
                throw new Error(data.detail || 'Error updating profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    };

    // Función mejorada para hacer requests autenticados
    const authenticatedFetch = useCallback(async (url, options = {}) => {
        try {
            let token = userToken;
            
            if (!token) {
                throw new Error('No authentication token available');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Si el token expiró, intentar refrescar
            if (response.status === 401 && !isRefreshing) {
                try {
                    token = await refreshAccessToken();
                    
                    if (token) {
                        // Reintentar la request con el nuevo token
                        const retryController = new AbortController();
                        const retryTimeoutId = setTimeout(() => retryController.abort(), REQUEST_TIMEOUT);
                        
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                ...options.headers,
                            },
                            signal: retryController.signal,
                        });
                        
                        clearTimeout(retryTimeoutId);
                        return retryResponse;
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    throw new Error('Authentication failed');
                }
            }

            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            console.error('Authenticated fetch error:', error);
            throw error;
        }
    }, [userToken, refreshAccessToken, isRefreshing]);

    const contextValue = {
        isLoading,
        userToken,
        userData,
        API_BASE_URL,
        login,
        register,
        logout,
        updateProfile,
        authenticatedFetch,
        refreshAccessToken,
        isAuthenticated: !!userToken,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};