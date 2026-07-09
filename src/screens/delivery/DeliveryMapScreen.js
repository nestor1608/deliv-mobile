// src/screens/delivery/DeliveryMapScreen.js
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

export default function DeliveryMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { authenticatedFetch, userToken, API_BASE_URL } = useContext(AuthContext);
  const mapRef = useRef(null);
  const wsConnected = useRef(false);
  
  const { orderId } = route.params;
  
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [deliveryStep, setDeliveryStep] = useState('pickup'); // 'pickup' | 'delivery'

  useEffect(() => {
    loadOrderDetails();
    startLocationTracking();

    if (orderId) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      const wsUrl = `ws://${baseUrl.replace('https://', '').replace('http://', '')}/ws/orders/${orderId}/`;
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

  const loadOrderDetails = async () => {
    try {
      const response = await authenticatedFetch(`/api/orders/${orderId}/`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
        setDeliveryStep(orderData.status === 'assigned' ? 'pickup' : 'delivery');
      } else {
        Alert.alert('Error', 'No se pudo cargar el pedido');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
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
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // O cada 10 metros
        },
        (location) => {
          setCurrentLocation(location.coords);
          updateLocationOnServer(location.coords);
          wsService.send({
            type: 'location_update',
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
      await authenticatedFetch(`/api/orders/${orderId}/update-location/`, {
        method: 'PATCH',
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const getDestination = () => {
    if (!order) return null;
    
    if (deliveryStep === 'pickup') {
      return {
        latitude: order.store_latitude,
        longitude: order.store_longitude,
        address: order.store_address,
        title: 'Recoger en tienda',
        description: order.store_name,
      };
    } else {
      return {
        latitude: order.delivery_latitude,
        longitude: order.delivery_longitude,
        address: order.delivery_address,
        title: 'Entregar al cliente',
        description: order.customer_name,
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
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
        Linking.openURL(googleMapsUrl);
      }
    });
  };

  const markAsPickedUp = async () => {
    try {
      const response = await authenticatedFetch(`/api/orders/${orderId}/mark-picked-up/`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setDeliveryStep('delivery');
        Alert.alert('¡Perfecto!', 'Pedido marcado como recogido. Ahora dirígete al cliente.');
        loadOrderDetails(); // Recargar datos
      } else {
        Alert.alert('Error', 'No se pudo marcar como recogido');
      }
    } catch (error) {
      console.error('Error marking as picked up:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const markAsDelivered = async () => {
    Alert.alert(
      'Confirmar entrega',
      '¿Confirmas que has entregado el pedido al cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const response = await authenticatedFetch(`/api/orders/${orderId}/mark-delivered/`, {
                method: 'PATCH',
              });

              if (response.ok) {
                Alert.alert('¡Entrega completada!', 'El pedido ha sido entregado exitosamente', [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('DeliveryDashboard'),
                  },
                ]);
              } else {
                Alert.alert('Error', 'No se pudo marcar como entregado');
              }
            } catch (error) {
              console.error('Error marking as delivered:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  const callCustomer = () => {
    if (order?.customer_phone) {
      Linking.openURL(`tel:${order.customer_phone}`);
    }
  };

  const callStore = () => {
    if (order?.store_phone) {
      Linking.openURL(`tel:${order.store_phone}`);
    }
  };

  const fitMapToCoordinates = () => {
    if (!currentLocation || !order) return;

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
    if (currentLocation && order) {
      fitMapToCoordinates();
    }
  }, [currentLocation, order, deliveryStep]);

  if (loading || !order) {
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
            pinColor={deliveryStep === 'pickup' ? '#FF9800' : '#4CAF50'}
          />
        )}

        {/* Ruta (si está disponible) */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Panel de información superior */}
      <View style={styles.topPanel}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.order_number}</Text>
          <Text style={styles.stepIndicator}>
            {deliveryStep === 'pickup' ? 'Paso 1: Recoger pedido' : 'Paso 2: Entregar pedido'}
          </Text>
        </View>
        
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationTitle}>{destination?.title}</Text>
          <Text style={styles.destinationAddress} numberOfLines={2}>
            {destination?.address}
          </Text>
        </View>
      </View>

      {/* Panel de acciones inferior */}
      <View style={styles.bottomPanel}>
        <View style={styles.actionButtons}>
          {/* Botón de navegación externa */}
          <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
            <Icon name="navigation" size={24} color="#fff" />
            <Text style={styles.navButtonText}>Navegar</Text>
          </TouchableOpacity>

          {/* Botón de llamada */}
          <TouchableOpacity 
            style={styles.callButton} 
            onPress={deliveryStep === 'pickup' ? callStore : callCustomer}
          >
            <Icon name="phone" size={24} color="#fff" />
            <Text style={styles.callButtonText}>Llamar</Text>
          </TouchableOpacity>

          {/* Botón de centrar mapa */}
          <TouchableOpacity style={styles.centerButton} onPress={fitMapToCoordinates}>
            <Icon name="my-location" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Botón de acción principal */}
        <TouchableOpacity
          style={[
            styles.mainActionButton,
            { backgroundColor: deliveryStep === 'pickup' ? '#FF9800' : '#4CAF50' }
          ]}
          onPress={deliveryStep === 'pickup' ? markAsPickedUp : markAsDelivered}
        >
          <Icon 
            name={deliveryStep === 'pickup' ? 'check-circle' : 'done-all'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.mainActionText}>
            {deliveryStep === 'pickup' ? 'Marcar como recogido' : 'Marcar como entregado'}
          </Text>
        </TouchableOpacity>

        {/* Información del pedido */}
        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Cliente:</Text>
            <Text style={styles.orderDetailValue}>{order.customer_name}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Total:</Text>
            <Text style={styles.orderDetailValue}>${order.total_amount}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Tu ganancia:</Text>
            <Text style={[styles.orderDetailValue, styles.earnings]}>${order.delivery_fee}</Text>
          </View>
        </View>
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
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  destinationInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
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
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mainActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orderDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  earnings: {
    color: '#4CAF50',
  },
});