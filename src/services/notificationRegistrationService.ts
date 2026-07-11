// src/services/notificationRegistrationService.ts
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { getProjectId } from '../utils/config';

async function registerForPushNotifications(apiUrl: string, userType: string): Promise<string | null> {
  let finalStatus: Notifications.PermissionStatus;

  const existingStatus = await Notifications.getPermissionsAsync();
  finalStatus = existingStatus.status;

  if (existingStatus.status !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: getProjectId(),
  });

  const pushToken = tokenData.data;

  const token = await SecureStore.getItemAsync('userToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    await fetch(`${apiUrl}/notifications/register-token/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
        user_type: userType,
      }),
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }

  Notifications.addPushTokenListener((newTokenData: Notifications.ExpoPushToken) => {
    const newToken = newTokenData.data;
    fetch(`${apiUrl}/notifications/register-token/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: newToken,
        platform: Platform.OS,
        user_type: userType,
      }),
    }).catch((err) => console.error('Failed to re-register token:', err));
  });

  return pushToken;
}

export { registerForPushNotifications };
