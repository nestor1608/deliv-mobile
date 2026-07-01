// utils/locationUtils.js
import * as Location from 'expo-location';

// Ubicación base del negocio (ajusta según tu ubicación)
export const BUSINESS_LOCATION = {
    latitude: -29.3833,
    longitude: -56.85,
    name: 'Nuestro Local',
    address: 'Santo Tomé, Corrientes'
};

// Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Función para calcular el tiempo estimado de entrega
export const calculateDeliveryTime = (distance, baseTime = 15) => {
    const deliverySpeed = 25; // km/h velocidad promedio
    const timeInHours = distance / deliverySpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    return timeInMinutes + baseTime; // Tiempo base de preparación
};

// Función para calcular el costo de envío
export const calculateDeliveryFee = (distance, subtotal, freeDeliveryThreshold = 50) => {
    // Envío gratis para pedidos mayores al umbral y distancia menor a 5km
    if (subtotal >= freeDeliveryThreshold && distance < 5) {
        return 0;
    }
    
    // Tarifa base + tarifa por distancia
    const baseFee = 5;
    const distanceFee = distance * 2; // $2 por km
    
    return Math.max(baseFee, Math.min(distanceFee, 20)); // Máximo $20
};

// Función para obtener la dirección de coordenadas
export const getAddressFromCoordinates = async (latitude, longitude) => {
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

// Función para validar si la ubicación está dentro del área de cobertura
export const isLocationInCoverage = (latitude, longitude, maxDistance = 25) => {
    const distance = calculateDistance(
        BUSINESS_LOCATION.latitude,
        BUSINESS_LOCATION.longitude,
        latitude,
        longitude
    );
    return distance <= maxDistance;
};

// Función para formatear la dirección completa
export const formatFullAddress = (address, reference = '') => {
    if (!address) return '';
    
    let fullAddress = typeof address === 'string' ? address : address.formattedAddress;
    
    if (reference && reference.trim()) {
        fullAddress += ` - ${reference.trim()}`;
    }
    
    return fullAddress;
};

// Función para obtener las coordenadas de una dirección (geocoding)
export const getCoordinatesFromAddress = async (address) => {
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

// Función para generar slots de tiempo dinámicos
export const generateTimeSlots = (baseDeliveryTime) => {
    const now = new Date();
    const slots = [
        {
            id: 'now',
            label: 'Lo antes posible',
            time: `${baseDeliveryTime} min`,
            estimatedTime: baseDeliveryTime
        }
    ];
    
    // Generar slots cada hora por las próximas 6 horas
    for (let i = 1; i <= 6; i++) {
        const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        slots.push({
            id: `${i}h`,
            label: `En ${i} hora${i > 1 ? 's' : ''}`,
            time: futureTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            estimatedTime: null // Tiempo programado
        });
    }
    
    return slots;
};

// Función para verificar permisos de ubicación
export const checkLocationPermissions = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking location permissions:', error);
        return false;
    }
};

// Función para obtener la ubicación actual
export const getCurrentLocation = async () => {
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

// Función para validar datos de ubicación
export const validateLocationData = (locationData) => {
    if (!locationData) return false;
    
    const { coordinates, address } = locationData;
    
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        return false;
    }
    
    if (!address || !address.trim()) {
        return false;
    }
    
    // Validar que las coordenadas estén en un rango válido
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