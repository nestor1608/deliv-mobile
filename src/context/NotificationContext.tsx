// src/context/NotificationContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { getItem, setItem, removeItem } from '../utils/storage';
import Constants from 'expo-constants';
import { AuthContext } from './AuthContext';
import apiClient from '../services/apiClient';
import type { Notification as AppNotification } from '../types';

// expo-notifications is NOT available in Expo Go (SDK 53+). Dynamic import prevents crash.
let NotificationsModule: any = null;
try {
  NotificationsModule = require('expo-notifications');
} catch {
  console.warn('expo-notifications not available (expected in Expo Go)');
}

// Configure notification handler (only if module available)
if (NotificationsModule) {
  try {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('Failed to configure notification handler:', e);
  }
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  pushToken: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  sendLocalNotification: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userToken, userData } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (userToken) {
      initializeNotifications();
      loadStoredNotifications();
    }
  }, [userToken]);

  const initializeNotifications = async () => {
    // Skip notification setup in Expo Go (notifications not supported)
    if (!NotificationsModule) {
      console.warn('expo-notifications not available - skipping notification setup');
      return;
    }

    try {
      // Request permissions
      let existingStatus: string = 'denied';
      try {
        const result = await NotificationsModule?.getPermissionsAsync();
        existingStatus = result?.status || 'denied';
      } catch (e) {
        console.warn('Failed to get permissions:', e);
      }

      let finalStatus: string = existingStatus;

      if (existingStatus !== 'granted') {
        try {
          const result = await NotificationsModule?.requestPermissionsAsync();
          finalStatus = result?.status || 'denied';
        } catch (e) {
          console.warn('Failed to request permissions:', e);
        }
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permisos de notificación',
          'Para recibir actualizaciones de tus pedidos, habilita las notificaciones en configuración.'
        );
        return;
      }

      // Get push token
      if (Device.isDevice) {
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'e6568834-4db0-4483-9d6b-37d1279ef112';
          const token = await NotificationsModule?.getExpoPushTokenAsync({ projectId });
          if (token?.data) {
            setPushToken(token.data);
            // Send token to backend
            await registerPushToken(token.data);
          }
        } catch (e) {
          console.warn('Failed to get expo push token:', e);
        }
      }

      // Setup listeners
      setupNotificationListeners();

    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const registerPushToken = async (token: string) => {
    try {
      await apiClient.post('notifications/register-token/', {
        token,
        platform: Platform.OS,
        user_type: userData?.role || 'customer',
      });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  const setupNotificationListeners = () => {
    if (!NotificationsModule) return;

    // Listener for notifications received while app is active
    try {
      const receivedSubscription = NotificationsModule?.addNotificationReceivedListener((notification: any) => {
        const newNotification: AppNotification = {
          id: notification.request.identifier,
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          read: false,
          created_at: new Date().toISOString(),
          type: notification.request.content.data?.type || 'general',
        };

        addNotification(newNotification);
      });

      // Listener for when user taps a notification
      const responseSubscription = NotificationsModule?.addNotificationResponseReceivedListener((response: any) => {
        const notificationData = response.notification.request.content.data;
        handleNotificationTap(notificationData as Record<string, any>);
      });

      return () => {
        receivedSubscription?.remove();
        responseSubscription?.remove();
      };
    } catch (e) {
      console.warn('Failed to setup notification listeners:', e);
    }
  };

  const handleNotificationTap = (data: Record<string, any> | undefined) => {
    // Handle navigation based on notification type
    if (data?.type === 'order_update' && data?.orderId) {
      // Navigate to order tracking screen
      // navigation.navigate('OrderTracking', { orderId: data.orderId });
    } else if (data?.type === 'ride_update' && data?.rideId) {
      // Navigate to ride tracking screen
      // navigation.navigate('RideTracking', { rideId: data.rideId });
    }
  };

  const addNotification = async (notification: AppNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Store locally
    try {
      const storedNotifications = (await getItem('notifications')) as AppNotification[] || [];
      const updated = [notification, ...storedNotifications].slice(0, 100); // Limit to 100
      await setItem('notifications', updated);
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  };

  const loadStoredNotifications = async () => {
    try {
      const storedNotifications = await getItem('notifications') as AppNotification[] | null;
      if (storedNotifications) {
        setNotifications(storedNotifications);

        const unread = storedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in local storage
    try {
      const storedNotifications = await getItem('notifications') as AppNotification[] | null;
      if (storedNotifications) {
        const updated = storedNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        await setItem('notifications', updated);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const storedNotifications = await getItem('notifications') as AppNotification[] | null;
      if (storedNotifications) {
        const updated = storedNotifications.map(n => ({ ...n, read: true }));
        await setItem('notifications', updated);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await removeItem('notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string, data: Record<string, any> = {}) => {
    try {
      await NotificationsModule?.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Immediate
      });
    } catch (e) {
      console.warn('Failed to schedule local notification:', e);
    }
  };

  const contextValue: NotificationContextType = {
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
