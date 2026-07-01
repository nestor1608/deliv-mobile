// src/context/NotificationContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { userToken, authenticatedFetch, API_BASE_URL, userData } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pushToken, setPushToken] = useState(null);

    useEffect(() => {
        if (userToken) {
            initializeNotifications();
            loadStoredNotifications();
        }
    }, [userToken]);

    const initializeNotifications = async () => {
        try {
            // Solicitar permisos
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert(
                    'Permisos de notificación',
                    'Para recibir actualizaciones de tus pedidos, habilita las notificaciones en configuración.'
                );
                return;
            }

            // Obtener token de push
            if (Device.isDevice) {
                const token = await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-expo-project-id', // Reemplazar con tu project ID
                });
                setPushToken(token.data);
                
                // Enviar token al backend
                await registerPushToken(token.data);
            }

            // Configurar listeners
            setupNotificationListeners();

        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    };

    const registerPushToken = async (token) => {
        try {
            await authenticatedFetch(`${API_BASE_URL}/notifications/register-token/`, {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    platform: Platform.OS,
                    user_type: userData?.role || 'customer',
                }),
            });
        } catch (error) {
            console.error('Error registering push token:', error);
        }
    };

    const setupNotificationListeners = () => {
        // Listener para notificaciones recibidas mientras la app está activa
        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            const newNotification = {
                id: notification.request.identifier,
                title: notification.request.content.title,
                body: notification.request.content.body,
                data: notification.request.content.data,
                timestamp: new Date().toISOString(),
                read: false,
            };

            addNotification(newNotification);
        });

        // Listener para cuando el usuario toca una notificación
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const notificationData = response.notification.request.content.data;
            handleNotificationTap(notificationData);
        });

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    };

    const handleNotificationTap = (data) => {
        // Manejar la navegación basada en el tipo de notificación
        if (data?.type === 'order_update' && data?.orderId) {
            // Navegar a la pantalla de tracking del pedido
            // navigation.navigate('OrderTracking', { orderId: data.orderId });
        } else if (data?.type === 'ride_update' && data?.rideId) {
            // Navegar a la pantalla de tracking del viaje
            // navigation.navigate('RideTracking', { rideId: data.rideId });
        }
    };

    const addNotification = async (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Guardar en AsyncStorage
        try {
            const stored = await AsyncStorage.getItem('notifications');
            const storedNotifications = stored ? JSON.parse(stored) : [];
            const updated = [notification, ...storedNotifications].slice(0, 100); // Limitar a 100
            await AsyncStorage.setItem('notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Error storing notification:', error);
        }
    };

    const loadStoredNotifications = async () => {
        try {
            const stored = await AsyncStorage.getItem('notifications');
            if (stored) {
                const storedNotifications = JSON.parse(stored);
                setNotifications(storedNotifications);
                
                const unread = storedNotifications.filter(n => !n.read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        setNotifications(prev => 
            prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Actualizar en AsyncStorage
        try {
            const stored = await AsyncStorage.getItem('notifications');
            if (stored) {
                const storedNotifications = JSON.parse(stored);
                const updated = storedNotifications.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                );
                await AsyncStorage.setItem('notifications', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        
        try {
            const stored = await AsyncStorage.getItem('notifications');
            if (stored) {
                const storedNotifications = JSON.parse(stored);
                const updated = storedNotifications.map(n => ({ ...n, read: true }));
                await AsyncStorage.setItem('notifications', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Error updating notifications:', error);
        }
    };

    const clearNotifications = async () => {
        setNotifications([]);
        setUnreadCount(0);
        
        try {
            await AsyncStorage.removeItem('notifications');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const sendLocalNotification = async (title, body, data = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // Inmediata
        });
    };

    const contextValue = {
        notifications,
        unreadCount,
        pushToken,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        sendLocalNotification,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};