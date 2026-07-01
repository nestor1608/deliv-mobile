// src/screens/delivery/DeliveryDashboardScreen.js
import React, { useState, useEffect, useContext } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function DeliveryDashboardScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch, userData } = useContext(AuthContext);
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [todayStats, setTodayStats] = useState({
    deliveries: 0,
    earnings: 0,
    distance: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
      getCurrentLocation();
    }, [])
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para funcionar');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      // Actualizar ubicación en el servidor si está disponible
      if (isAvailable) {
        updateLocationOnServer(location.coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const updateLocationOnServer = async (coords) => {
    try {
      await authenticatedFetch('/api/delivery/update-location/', {
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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar órdenes activas
      const ordersResponse = await authenticatedFetch('/api/delivery/active-orders/');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setActiveOrders(ordersData);
      }

      // Cargar estadísticas del día
      const statsResponse = await authenticatedFetch('/api/delivery/today-stats/');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTodayStats(statsData);
      }

      // Cargar estado de disponibilidad
      const profileResponse = await authenticatedFetch('/api/delivery/profile/');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setIsAvailable(profileData.is_available);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleAvailability = async (value) => {
    try {
      if (value && !location) {
        Alert.alert('Ubicación', 'Obteniendo ubicación...');
        await getCurrentLocation();
        return;
      }

      const response = await authenticatedFetch('/api/delivery/toggle-availability/', {
        method: 'PATCH',
        body: JSON.stringify({
          is_available: value,
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
        }),
      });

      if (response.ok) {
        setIsAvailable(value);
        if (value) {
          Alert.alert('¡Perfecto!', 'Ahora estás disponible para recibir pedidos');
        } else {
          Alert.alert('Desconectado', 'Ya no recibirás nuevos pedidos');
        }
      } else {
        throw new Error('Error al cambiar disponibilidad');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad');
    }
  };

  const renderStatsCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity style={[styles.statsCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statsContent}>
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={24} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderActiveOrder = (order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <View style={[styles.statusBadge, getStatusColor(order.status)]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.storeName}>{order.store_name}</Text>
      <Text style={styles.customerName}>{order.customer_name}</Text>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderDetail}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.orderDetailText}>{order.delivery_address}</Text>
        </View>
        <View style={styles.orderDetail}>
          <Icon name="monetization-on" size={16} color="#4CAF50" />
          <Text style={styles.orderDetailText}>${order.delivery_fee}</Text>
        </View>
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DeliveryMap', { orderId: order.id })}
        >
          <Icon name="navigation" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Navegar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return { backgroundColor: '#FF9800' };
      case 'picked_up':
        return { backgroundColor: '#2196F3' };
      case 'in_transit':
        return { backgroundColor: '#9C27B0' };
      default:
        return { backgroundColor: '#666' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned':
        return 'Asignado';
      case 'picked_up':
        return 'Recogido';
      case 'in_transit':
        return 'En camino';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header con disponibilidad */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>¡Hola, {userData?.first_name}!</Text>
              <Text style={styles.subtitleText}>
                {isAvailable ? 'Estás disponible para pedidos' : 'Estás desconectado'}
              </Text>
            </View>
            <View style={styles.availabilityContainer}>
              <Text style={styles.availabilityLabel}>Disponible</Text>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isAvailable ? '#FF9800' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>

        {/* Estadísticas del día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Entregas',
              todayStats.deliveries,
              'local-shipping',
              '#4CAF50',
              () => navigation.navigate('DeliveryHistory')
            )}
            {renderStatsCard(
              'Ganancias',
              `$${todayStats.earnings}`,
              'monetization-on',
              '#FF9800',
              () => navigation.navigate('DeliveryEarnings')
            )}
            {renderStatsCard(
              'Distancia',
              `${todayStats.distance} km`,
              'directions',
              '#2196F3'
            )}
            {renderStatsCard(
              'Calificación',
              `${todayStats.rating} ★`,
              'star',
              '#FFC107'
            )}
          </View>
        </View>

        {/* Órdenes activas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Activos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {activeOrders.length > 0 ? (
            activeOrders.map(renderActiveOrder)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="local-shipping" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {isAvailable ? 'No tienes pedidos activos' : 'Actívate para recibir pedidos'}
              </Text>
            </View>
          )}
        </View>

        {/* Accesos rápidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('DeliveryHistory')}
            >
              <Icon name="history" size={32} color="#FF9800" />
              <Text style={styles.quickActionText}>Historial</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('DeliveryEarnings')}
            >
              <Icon name="account-balance-wallet" size={32} color="#4CAF50" />
              <Text style={styles.quickActionText}>Ganancias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Icon name="person" size={32} color="#2196F3" />
              <Text style={styles.quickActionText}>Perfil</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  availabilityContainer: {
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '600',
  },
});