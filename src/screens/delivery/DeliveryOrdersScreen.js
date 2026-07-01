// src/screens/delivery/DeliveryOrdersScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DeliveryOrdersScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'assigned'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Cargar pedidos disponibles
      const availableResponse = await authenticatedFetch('/api/orders/available/');
      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableOrders(availableData);
      }

      // Cargar mis pedidos asignados
      const assignedResponse = await authenticatedFetch('/api/delivery/assigned-orders/');
      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        setMyOrders(assignedData);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const acceptOrder = async (orderId) => {
    try {
      const response = await authenticatedFetch(`/api/orders/${orderId}/accept/`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('¡Perfecto!', 'Pedido aceptado exitosamente', [
          {
            text: 'Ver detalles',
            onPress: () => navigation.navigate('DeliveryOrderDetail', { orderId }),
          },
        ]);
        loadOrders(); // Recargar la lista
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo aceptar el pedido');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const calculateDistance = (order) => {
    // Aquí implementarías el cálculo real de distancia
    // Por ahora retornamos un valor simulado
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  const calculateDeliveryTime = (order) => {
    // Tiempo estimado basado en distancia
    const distance = parseFloat(calculateDistance(order));
    return Math.round(distance * 3 + 5); // 3 min por km + 5 min base
  };

  const renderOrderCard = ({ item: order }) => {
    const distance = calculateDistance(order);
    const estimatedTime = calculateDeliveryTime(order);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order.id })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{order.order_number}</Text>
            <Text style={styles.storeName}>{order.store_name}</Text>
          </View>
          <View style={styles.orderValue}>
            <Text style={styles.deliveryFee}>${order.delivery_fee}</Text>
            <Text style={styles.deliveryFeeLabel}>Ganancia</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {order.pickup_address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="place" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {order.delivery_address}
            </Text>
          </View>
        </View>

        <View style={styles.orderStats}>
          <View style={styles.statItem}>
            <Icon name="directions" size={16} color="#FF9800" />
            <Text style={styles.statText}>{distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="access-time" size={16} color="#2196F3" />
            <Text style={styles.statText}>{estimatedTime} min</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="shopping-bag" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{order.items_count} productos</Text>
          </View>
        </View>

        {activeTab === 'available' ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptOrder(order.id)}
          >
            <Icon name="done" size={20} color="#fff" />
            <Text style={styles.acceptButtonText}>Aceptar Pedido</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => navigation.navigate('DeliveryMap', { orderId: order.id })}
            >
              <Icon name="navigation" size={16} color="#2196F3" />
              <Text style={styles.navigateButtonText}>Navegar</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusStyle = (status) => {
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon 
        name={activeTab === 'available' ? 'local-shipping' : 'assignment'} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'available' ? 'No hay pedidos disponibles' : 'No tienes pedidos asignados'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {activeTab === 'available' 
          ? 'Los pedidos aparecerán aquí cuando estén disponibles'
          : 'Acepta pedidos para verlos aquí'
        }
      </Text>
    </View>
  );

  const currentData = activeTab === 'available' ? availableOrders : myOrders;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Icon 
            name="local-shipping" 
            size={20} 
            color={activeTab === 'available' ? '#FF9800' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableOrders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
          onPress={() => setActiveTab('assigned')}
        >
          <Icon 
            name="assignment" 
            size={20} 
            color={activeTab === 'assigned' ? '#FF9800' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            Mis Pedidos ({myOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de pedidos */}
      <FlatList
        data={currentData}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF9800',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storeName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  deliveryFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  deliveryFeeLabel: {
    fontSize: 12,
    color: '#666',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  navigateButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});