// src/utils/locationUtils.ts
import * as Location from 'expo-location';

// Base business location (adjust according to your location)
export const BUSINESS_LOCATION = {
  latitude: -29.3833,
  longitude: -56.85,
  name: 'Nuestro Local',
  address: 'Santo Tomé, Corrientes'
};

// Function to calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Function to calculate estimated delivery time
export const calculateDeliveryTime = (distance: number, baseTime = 15): number => {
  const deliverySpeed = 25; // km/h average speed
  const timeInHours = distance / deliverySpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes + baseTime; // Base preparation time
};

// Function to calculate delivery fee
export const calculateDeliveryFee = (distance: number, subtotal: number, freeDeliveryThreshold = 50): number => {
  // Free delivery for orders above threshold and distance less than 5km
  if (subtotal >= freeDeliveryThreshold && distance < 5) {
    return 0;
  }

  // Base fee + distance fee
  const baseFee = 5;
  const distanceFee = distance * 2; // $2 per km

  return Math.max(baseFee, Math.min(distanceFee, 20)); // Maximum $20
};

// Function to get address from coordinates
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<{
  street: string;
  streetNumber: string;
  district: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
} | null> => {
  try {
    const [result] = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    if (result) {
      return {
        street: result.street || '',
        streetNumber: result.streetNumber || '',
        district: result.district || '',
        city: result.city || '',
        region: result.region || '',
        postalCode: result.postalCode || '',
        country: result.country || '',
        formattedAddress: [
          result.street,
          result.streetNumber,
          result.district,
          result.city,
          result.region
        ].filter(Boolean).join(' ')
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
};

// Function to validate if location is within coverage area
export const isLocationInCoverage = (latitude: number, longitude: number, maxDistance = 25): boolean => {
  const distance = calculateDistance(
    BUSINESS_LOCATION.latitude,
    BUSINESS_LOCATION.longitude,
    latitude,
    longitude
  );
  return distance <= maxDistance;
};

// Function to format full address
export const formatFullAddress = (address: string | { formattedAddress?: string }, reference = ''): string => {
  if (!address) return '';

  let fullAddress = typeof address === 'string' ? address : address.formattedAddress || '';

  if (reference && reference.trim()) {
    fullAddress += ` - ${reference.trim()}`;
  }

  return fullAddress;
};

// Function to get coordinates from address (geocoding)
export const getCoordinatesFromAddress = async (address: string): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const results = await Location.geocodeAsync(address);
    if (results && results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Function to generate dynamic time slots
export interface TimeSlot {
  id: string;
  label: string;
  time: string;
  estimatedTime: number | null;
}

export const generateTimeSlots = (baseDeliveryTime: number): TimeSlot[] => {
  const now = new Date();
  const slots: TimeSlot[] = [
    {
      id: 'now',
      label: 'Lo antes posible',
      time: `${baseDeliveryTime} min`,
      estimatedTime: baseDeliveryTime
    }
  ];

  // Generate slots every hour for the next 6 hours
  for (let i = 1; i <= 6; i++) {
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    slots.push({
      id: `${i}h`,
      label: `En ${i} hora${i > 1 ? 's' : ''}`,
      time: futureTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      estimatedTime: null // Scheduled time
    });
  }

  return slots;
};

// Function to check location permissions
export const checkLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permissions:', error);
    return false;
  }
};

// Function to get current location
export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export const getCurrentLocation = async (): Promise<CurrentLocation> => {
  try {
    const hasPermission = await checkLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 10000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

// Function to validate location data
export interface LocationData {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

export const validateLocationData = (locationData: LocationData | null): boolean => {
  if (!locationData) return false;

  const { coordinates, address } = locationData;

  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return false;
  }

  if (!address || !address.trim()) {
    return false;
  }

  // Validate coordinates are in valid range
  const { latitude, longitude } = coordinates;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }

  return true;
};

export default {
  BUSINESS_LOCATION,
  calculateDistance,
  calculateDeliveryTime,
  calculateDeliveryFee,
  getAddressFromCoordinates,
  isLocationInCoverage,
  formatFullAddress,
  getCoordinatesFromAddress,
  generateTimeSlots,
  checkLocationPermissions,
  getCurrentLocation,
  validateLocationData
};
