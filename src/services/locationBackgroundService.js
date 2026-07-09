import * as Location from 'expo-location';
import { AppState } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../utils/config';

const API_BASE_URL = getApiBaseUrl();
const THROTTLE_MS = 3000;
const MAX_QUEUE_SIZE = 50;

let watchSubscription = null;
let isTracking = false;
let locationQueue = [];
let lastApiCall = 0;
let appStateSubscription = null;
let appInBackground = false;
let onLocationCallback = null;

async function requestPermissions() {
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

async function sendLocationToApi(location) {
  try {
    const now = Date.now();
    if (now - lastApiCall < THROTTLE_MS) {
      return;
    }
    lastApiCall = now;

    const token = await SecureStore.getItemAsync('userToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    await axios.post(`${API_BASE_URL}/delivery/location/`, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp || new Date().toISOString(),
    }, { headers });

    while (locationQueue.length > 0) {
      const queued = locationQueue.shift();
      await axios.post(`${API_BASE_URL}/delivery/location/`, {
        latitude: queued.coords.latitude,
        longitude: queued.coords.longitude,
        timestamp: queued.timestamp || new Date().toISOString(),
      }, { headers });
    }
  } catch (error) {
    console.warn('Failed to send location, queuing:', error.message);
    if (locationQueue.length < MAX_QUEUE_SIZE) {
      locationQueue.push(location);
    }
  }
}

function handleLocation(location) {
  if (onLocationCallback) {
    onLocationCallback(location);
  }

  sendLocationToApi(location);
}

async function startTracking(onLocation) {
  if (isTracking) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  onLocationCallback = onLocation;
  isTracking = true;

  try {
    watchSubscription = await Location.watchPositionAsync(
      {
        timeInterval: 3000,
        distanceInterval: 1,
      },
      handleLocation
    );
  } catch (error) {
    console.error('Location tracking error:', error);
    isTracking = false;
    setTimeout(() => startTracking(onLocation), 3000);
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState.match(/inactive|background/)) {
      appInBackground = true;
      stopTracking();
    } else if (nextAppState === 'active' && appInBackground) {
      appInBackground = false;
      startTracking(onLocationCallback);
    }
  });
}

function stopTracking() {
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
