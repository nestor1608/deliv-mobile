// app/(delivery)/map.tsx — DeliveryMapScreen
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface OrderData {
  id: number;
  order_number: string;
  status: string;
  store_latitude: number;
  store_longitude: number;
  store_address: string;
  store_name: string;
  store_phone?: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_address: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  delivery_fee: number;
}

export default function DeliveryMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params?.orderId;

  const { userToken } = useContext(AuthContext);
  const mapRef = useRef(null);
  const queryClient = useQueryClient();

  const { state: wsState, connect, disconnect, send, isConnected } = useWebSocket();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [deliveryStep, setDeliveryStep] = useState<'pickup' | 'delivery'>('pickup');

  const { data: order, isLoading } = useQuery<OrderData>({
    queryKey: ['delivery', 'order', orderId],
    queryFn: () => apiClient.get<OrderData>(`orders/${orderId}/`),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (order) {
      setDeliveryStep(order.status === 'assigned' ? 'pickup' : 'delivery');
    }
  }, [order]);

  useEffect(() => {
    startLocationTracking();

    if (orderId && userToken) {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
      const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const host = baseUrl.replace('https://', '').replace('http://', '').replace('/api', '');
      const wsUrl = `${wsProtocol}://${host.replace(':8000', ':8001')}/ws/orders/${orderId}/`;
      connect(wsUrl, userToken);
    }

    return () => {
      setTrackingEnabled(false);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación');
        return;
      }

      setTrackingEnabled(true);

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location.coords);
          updateLocationOnServer(location.coords);
          if (isConnected) {
            send({
              type: 'location_update',
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
            });
          }
        }
      );

      return () => subscription?.remove();
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const updateLocationOnServer = async (coords: { latitude: number; longitude: number }) => {
    try {
      await apiClient.patch(`orders/${orderId}/update-location/`, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const markPickedUpMutation = useMutation({
    mutationFn: () => apiClient.patch(`orders/${orderId}/mark-picked-up/`, {}),
    onSuccess: () => {
      setDeliveryStep('delivery');
      Alert.alert('¡Perfecto!', 'Pedido marcado como recogido. Ahora dirígete al cliente.');
      queryClient.invalidateQueries({ queryKey: ['delivery', 'order', orderId] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo marcar como recogido');
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: () => apiClient.patch(`orders/${orderId}/mark-delivered/`, {}),
    onSuccess: () => {
      Alert.alert('¡Entrega completada!', 'El pedido ha sido entregado exitosamente', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo marcar como entregado');
    },
  });

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

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
          Linking.openURL(googleMapsUrl);
        }
      });
    }
  };

  const markAsPickedUp = () => markPickedUpMutation.mutate();

  const markAsDelivered = () => {
    Alert.alert(
      'Confirmar entrega',
      '¿Confirmas que has entregado el pedido al cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => markDeliveredMutation.mutate() },
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

    (mapRef.current as any)?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  if (isLoading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const destination = getDestination();

  return (
    <SafeAreaView style={styles.container}>
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

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
      </MapView>

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

      <View style={styles.bottomPanel}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
            <Icon name="navigation" size={24} color="#fff" />
            <Text style={styles.navButtonText}>Navegar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callButton}
            onPress={deliveryStep === 'pickup' ? callStore : callCustomer}
          >
            <Icon name="phone" size={24} color="#fff" />
            <Text style={styles.callButtonText}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.centerButton} onPress={fitMapToCoordinates}>
            <Icon name="my-location" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.mainActionButton,
            { backgroundColor: deliveryStep === 'pickup' ? '#FF9800' : '#4CAF50' },
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: -2 },
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
