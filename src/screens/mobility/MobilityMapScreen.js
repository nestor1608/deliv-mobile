// src/screens/mobility/MobilityMapScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';
import wsService from '../../services/ws';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function MobilityMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { authenticatedFetch, userToken, API_BASE_URL } = useContext(AuthContext);
  const mapRef = useRef(null);
  const wsConnected = useRef(false);
  
  const { tripId } = route.params;
  
  const [trip, setTrip] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [tripPhase, setTripPhase] = useState('going_to_pickup'); // 'going_to_pickup' | 'going_to_destination'

  useEffect(() => {
    loadTripDetails();
    startLocationTracking();

    if (tripId) {
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const host = API_BASE_URL.replace('https://', '').replace('http://', '').replace('/api', '');
      const wsUrl = `${wsProtocol}://${host.replace(':8000', ':8001')}/ws/trips/${tripId}/`;
      wsService.setCallbacks({
        onOpen: () => { wsConnected.current = true; },
        onError: (err) => console.error('WS error:', err),
      });
      wsService.connect(wsUrl, userToken);
    }

    return () => {
      setTrackingEnabled(false);
      wsService.disconnect();
    };
  }, []);

  const loadTripDetails = async () => {
    try {
      const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/`);
      if (response.ok) {
        const tripData = await response.json();
        setTrip(tripData);
        setTripPhase(tripData.status === 'accepted' ? 'going_to_pickup' : 'going_to_destination');
      } else {
        Alert.alert('Error', 'No se pudo cargar el viaje');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Error de conexión');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación');
        return;
      }

      setTrackingEnabled(true);
      
      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);

      // Iniciar seguimiento
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location.coords);
          updateLocationOnServer(location.coords);
          wsService.send({
            type: 'driver_location',
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          });
        }
      );

      return () => subscription?.remove();
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const updateLocationOnServer = async (coords) => {
    try {
      await authenticatedFetch('/api/mobility/drivers/update-location/', {
        method: 'PATCH',
        body: JSON.stringify({
          current_latitude: coords.latitude,
          current_longitude: coords.longitude,
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const getDestination = () => {
    if (!trip) return null;
    
    if (tripPhase === 'going_to_pickup') {
      return {
        latitude: trip.pickup_latitude,
        longitude: trip.pickup_longitude,
        address: trip.pickup_address,
        title: 'Recoger pasajero',
        description: trip.customer_info?.name,
      };
    } else {
      return {
        latitude: trip.destination_latitude,
        longitude: trip.destination_longitude,
        address: trip.destination_address,
        title: 'Destino',
        description: 'Llevar al pasajero aquí',
      };
    }
  };

  const openExternalNavigation = () => {
    const destination = getDestination();
    if (!destination) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${destination.latitude},${destination.longitude}`,
      android: `geo:0,0?q=${destination.latitude},${destination.longitude}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
        Linking.openURL(googleMapsUrl);
      }
    });
  };

  const markAsArrived = async () => {
    try {
      const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/mark-arrived/`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('¡Perfecto!', 'Has llegado al punto de recogida. El pasajero ha sido notificado.');
        loadTripDetails();
      } else {
        Alert.alert('Error', 'No se pudo marcar la llegada');
      }
    } catch (error) {
      console.error('Error marking as arrived:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const startTrip = async () => {
    Alert.alert(
      'Iniciar viaje',
      '¿El pasajero ya está en el vehículo?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, iniciar',
          onPress: async () => {
            try {
              const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/start-trip/`, {
                method: 'PATCH',
              });

              if (response.ok) {
                setTripPhase('going_to_destination');
                Alert.alert('Viaje iniciado', 'Dirígete al destino');
                loadTripDetails();
              } else {
                Alert.alert('Error', 'No se pudo iniciar el viaje');
              }
            } catch (error) {
              console.error('Error starting trip:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  const completeTrip = async () => {
    Alert.alert(
      'Completar viaje',
      '¿Confirmas que has llegado al destino y el pasajero ha bajado?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/complete-trip/`, {
                method: 'PATCH',
                body: JSON.stringify({
                  actual_distance: trip.estimated_distance, // En producción, calcular distancia real
                  actual_duration: trip.estimated_duration, // En producción, calcular tiempo real
                }),
              });

              if (response.ok) {
                Alert.alert('¡Viaje completado!', 'El viaje ha sido completado exitosamente', [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('MobilityDashboard'),
                  },
                ]);
              } else {
                Alert.alert('Error', 'No se pudo completar el viaje');
              }
            } catch (error) {
              console.error('Error completing trip:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  const callPassenger = () => {
    if (trip?.customer_info?.phone) {
      Linking.openURL(`tel:${trip.customer_info.phone}`);
    }
  };

  const fitMapToCoordinates = () => {
    if (!currentLocation || !trip) return;

    const destination = getDestination();
    if (!destination) return;

    const coordinates = [
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ];

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  useEffect(() => {
    if (currentLocation && trip) {
      fitMapToCoordinates();
    }
  }, [currentLocation, trip, tripPhase]);

  if (loading || !trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const destination = getDestination();

  return (
    <SafeAreaView style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        initialRegion={{
          latitude: currentLocation?.latitude || -34.6037,
          longitude: currentLocation?.longitude || -58.3816,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Marcador de destino */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.title}
            description={destination.description}
            pinColor={tripPhase === 'going_to_pickup' ? '#4CAF50' : '#f44336'}
          />
        )}

        {/* Ruta */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Panel superior */}
      <View style={styles.topPanel}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
          <Text style={styles.phaseIndicator}>
            {tripPhase === 'going_to_pickup' ? 'Ir a recoger' : 'Llevar al destino'}
          </Text>
        </View>
        
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{trip.customer_info?.name}</Text>
          <Text style={styles.destinationAddress} numberOfLines={2}>
            {destination?.address}
          </Text>
        </View>
        
        <View style={styles.tripDetails}>
          <View style={styles.tripDetail}>
            <Icon name="directions" size={16} color="#666" />
            <Text style={styles.tripDetailText}>{trip.estimated_distance} km</Text>
          </View>
          <View style={styles.tripDetail}>
            <Icon name="access-time" size={16} color="#666" />
            <Text style={styles.tripDetailText}>{trip.estimated_duration} min</Text>
          </View>
          <View style={styles.tripDetail}>
            <Icon name="monetization-on" size={16} color="#4CAF50" />
            <Text style={styles.tripDetailText}>${trip.total_fare}</Text>
          </View>
        </View>
      </View>

      {/* Panel inferior */}
      <View style={styles.bottomPanel}>
        <View style={styles.actionButtons}>
          {/* Botón de navegación */}
          <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
            <Icon name="navigation" size={24} color="#fff" />
            <Text style={styles.navButtonText}>Navegar</Text>
          </TouchableOpacity>

          {/* Botón de llamada */}
          <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
            <Icon name="phone" size={24} color="#fff" />
            <Text style={styles.callButtonText}>Llamar</Text>
          </TouchableOpacity>

          {/* Botón centrar mapa */}
          <TouchableOpacity style={styles.centerButton} onPress={fitMapToCoordinates}>
            <Icon name="my-location" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Botón de acción principal */}
        {tripPhase === 'going_to_pickup' ? (
          trip.status === 'accepted' ? (
            <TouchableOpacity style={styles.arrivedButton} onPress={markAsArrived}>
              <Icon name="place" size={24} color="#fff" />
              <Text style={styles.arrivedButtonText}>He llegado</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startButton} onPress={startTrip}>
              <Icon name="play-arrow" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Iniciar viaje</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={styles.completeButton} onPress={completeTrip}>
            <Icon name="done-all" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>Completar viaje</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  topPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  phaseIndicator: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passengerInfo: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.4,
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.4,
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  centerButton: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 12,
  },
  arrivedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});