// app/(delivery)/index.tsx — DeliveryDashboardScreen
import React, { useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Switch,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface DashboardData {
  active_orders?: any[];
  today_stats?: {
    deliveries: number;
    earnings: number;
    distance: number;
    rating: number;
  };
}

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { data: dashboardData, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ['delivery', 'dashboard'],
    queryFn: () => apiClient.get<DashboardData>('delivery/dashboard/'),
    placeholderData: {
      active_orders: [],
      today_stats: { deliveries: 0, earnings: 0, distance: 0, rating: 0 },
    },
  });

  const { data: availabilityData } = useQuery<{ is_available: boolean }>({
    queryKey: ['delivery', 'availability'],
    queryFn: () => apiClient.get<{ is_available: boolean }>('delivery/availability/'),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: () => apiClient.post('delivery/toggle-availability/', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'availability'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    },
  });

  const isAvailable = availabilityData?.is_available ?? false;
  const activeOrders = dashboardData?.active_orders ?? [];
  const todayStats = dashboardData?.today_stats ?? {
    deliveries: 0,
    earnings: 0,
    distance: 0,
    rating: 0,
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
      getCurrentLocation();
    }, [refetch])
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para funcionar');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      if (isAvailable) {
        updateLocationOnServer(location.coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const updateLocationOnServer = async (coords: { latitude: number; longitude: number }) => {
    try {
      await apiClient.patch('delivery/update-location/', {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const toggleAvailability = () => {
    toggleAvailabilityMutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert(
          isAvailable ? 'Desconectado' : 'Conectado',
          isAvailable ? 'Ya no recibirás pedidos' : 'Recibirás pedidos disponibles'
        );
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userData?.first_name || 'Repartidor'}</Text>
            <Text style={styles.statusText}>
              {isAvailable ? 'Disponible para entregas' : 'No disponible'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isAvailable ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
              <Icon name="local-shipping" size={24} color="#FFF" />
              <Text style={styles.statValue}>{todayStats.deliveries}</Text>
              <Text style={styles.statLabel}>Entregas hoy</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
              <Icon name="account-balance-wallet" size={24} color="#FFF" />
              <Text style={styles.statValue}>${todayStats.earnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Ganancias hoy</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
              <Icon name="place" size={24} color="#FFF" />
              <Text style={styles.statValue}>{todayStats.distance.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distancia hoy</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
              <Icon name="star" size={24} color="#FFF" />
              <Text style={styles.statValue}>{todayStats.rating}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>
        </View>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Activos</Text>
            {activeOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.activeOrderCard}
                onPress={() => router.push({ pathname: '/order-detail', params: { orderId: order.id } })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/orders')}
            >
              <Icon name="assignment" size={24} color="#4CAF50" />
              <Text style={styles.quickActionText}>Ver Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/history')}
            >
              <Icon name="history" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/earnings')}
            >
              <Icon name="attach-money" size={24} color="#FF9800" />
              <Text style={styles.quickActionText}>Ganancias</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  activeOrderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
