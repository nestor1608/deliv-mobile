// src/services/locationBackgroundService.ts
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../utils/config';
import type { LocationCoords } from '../types';

const API_BASE_URL = getApiBaseUrl();
const THROTTLE_MS = 3000;
const MAX_QUEUE_SIZE = 50;

let watchSubscription: Location.LocationSubscription | null = null;
let isTracking = false;
let locationQueue: LocationCoords[] = [];
let lastApiCall = 0;
let appStateSubscription: { remove: () => void } | null = null;
let appInBackground = false;
let onLocationCallback: ((location: Location.LocationObject) => void) | null = null;

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
  timestamp?: number;
}

async function requestPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    console.warn('Foreground location permission denied');
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    console.warn('Background location permission denied');
    return false;
  }

  return true;
}

async function sendLocationToApi(location: Location.LocationObject): Promise<void> {
  try {
    const now = Date.now();
    if (now - lastApiCall < THROTTLE_MS) {
      return;
    }
    lastApiCall = now;

    const token = await SecureStore.getItemAsync('userToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    await fetch(`${API_BASE_URL}/delivery/location/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp || new Date().toISOString(),
      }),
    });

    while (locationQueue.length > 0) {
      const queued = locationQueue.shift() as LocationData;
      await fetch(`${API_BASE_URL}/delivery/location/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: queued.coords.latitude,
          longitude: queued.coords.longitude,
          timestamp: queued.timestamp || new Date().toISOString(),
        }),
      });
    }
  } catch (error: any) {
    console.warn('Failed to send location, queuing:', error.message);
    if (locationQueue.length < MAX_QUEUE_SIZE) {
      locationQueue.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  }
}

function handleLocation(location: Location.LocationObject): void {
  if (onLocationCallback) {
    onLocationCallback(location);
  }
  sendLocationToApi(location);
}

async function startTracking(onLocation?: (location: Location.LocationObject) => void): Promise<void> {
  if (isTracking) return;
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  onLocationCallback = onLocation || null;
  isTracking = true;

  try {
    watchSubscription = await Location.watchPositionAsync(
      { timeInterval: 3000, distanceInterval: 1 },
      handleLocation
    );
  } catch (error) {
    console.error('Location tracking error:', error);
    isTracking = false;
    setTimeout(() => startTracking(onLocationCallback!), 3000);
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState.match(/inactive|background/)) {
      appInBackground = true;
      stopTracking();
    } else if (nextAppState === 'active' && appInBackground) {
      appInBackground = false;
      startTracking(onLocationCallback!);
    }
  });
}

function stopTracking(): void {
  isTracking = false;
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

export { startTracking, stopTracking };
