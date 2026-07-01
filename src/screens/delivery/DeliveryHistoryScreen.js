// src/screens/delivery/DeliveryHistoryScreen.js
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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

export default function DeliveryHistoryScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'delivered', 'cancelled'

  useEffect(() => {
    loadOrderHistory();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/delivery/order-history/');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.results || []);
      } else {
        // Datos de ejemplo para desarrollo
        const mockOrders = [
          {
            id: 1,
            order_number: 'D240115001',
            status: 'delivered',
            store_name: 'Restaurante Mexicano',
            customer_name: 'Juan Pérez',
            customer_phone: '+54911234567',
            pickup_address: 'Av. Corrientes 1234, CABA',
            delivery_address: 'Av. Santa Fe 5678, CABA',
            total_amount: 85.50,
            delivery_fee: 12.50,
            distance: 4.2,
            items_count: 3,
            created_at: '2024-01-15T19:30:00Z',
            delivered_at: '2024-01-15T20:15:00Z',
            rating: 5,
            customer_comment: 'Excelente servicio, muy rápido',
          },
          {
            id: 2,
            order_number: 'D240115002',
            status: 'delivered',
            store_name: 'Pizzería Italiana',
            customer_name: 'María García',
            customer_phone: '+54911234568',
            pickup_address: 'Palermo Soho, CABA',
            delivery_address: 'Belgrano, CABA',
            total_amount: 120.00,
            delivery_fee: 15.00,
            distance: 6.8,
            items_count: 2,
            created_at: '2024-01-15T13:45:00Z',
            delivered_at: '2024-01-15T14:30:00Z',
            rating: 4,
            customer_comment: 'Todo perfecto',
          },
          {
            id: 3,
            order_number: 'D240114003',
            status: 'cancelled',
            store_name: 'Sushi Express',
            customer_name: 'Carlos López',
            customer_phone: '+54911234569',
            pickup_address: 'Microcentro, CABA',
            delivery_address: 'San Telmo, CABA',
            total_amount: 95.00,
            delivery_fee: 0,
            distance: 0,
            items_count: 4,
            created_at: '2024-01-14T20:15:00Z',
            cancelled_at: '2024-01-14T20:25:00Z',
            cancellation_reason: 'Cliente no disponible',
          },
          {
            id: 4,
            order_number: 'D240114004',
            status: 'delivered',
            store_name: 'Cafetería Central',
            customer_name: 'Ana Rodríguez',
            customer_phone: '+54911234570',
            pickup_address: 'Recoleta, CABA',
            delivery_address: 'Puerto Madero, CABA',
            total_amount: 45.75,
            delivery_fee: 8.50,
            distance: 3.5,
            items_count: 2,
            created_at: '2024-01-14T16:20:00Z',
            delivered_at: '2024-01-14T16:50:00Z',
            rating: 5,
            customer_comment: 'Perfecto como siempre',
          },
          {
            id: 5,
            order_number: 'D240113005',
            status: 'delivered',
            store_name: 'Parrilla Don Juan',
            customer_name: 'Roberto Silva',
            customer_phone: '+54911234571',
            pickup_address: 'La Boca, CABA',
            delivery_address: 'Barracas, CABA',
            total_amount: 156.25,
            delivery_fee: 18.75,
            distance: 8.9,
            items_count: 5,
            created_at: '2024-01-13T21:10:00Z',
            delivered_at: '2024-01-13T22:05:00Z',
            rating: 4,
            customer_comment: 'Muy buena comida, gracias',
          },
        ];
        setOrders(mockOrders);
      }
    } catch (error) {
      console.error('Error loading order history:', error);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderHistory();
    setRefreshing(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (statusFilter === 'delivered') return order.status === 'delivered';
        if (statusFilter === 'cancelled') return order.status === 'cancelled';
        return true;
      });
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.store_name.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.pickup_address.toLowerCase().includes(query) ||
        order.delivery_address.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  const renderRating = (rating) => {
    if (!rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            size={14}
            color={star <= rating ? '#FFC107' : '#e0e0e0'}
          />
        ))}
      </View>
    );
  };

  const renderOrderCard = ({ item: order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{order.order_number}</Text>
          <Text style={styles.orderDate}>
            {formatDate(order.created_at)} • {formatTime(order.created_at)}
          </Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          {order.rating && renderRating(order.rating)}
        </View>
      </View>

      <View style={styles.storeInfo}>
        <Icon name="store" size={16} color="#666" />
        <Text style={styles.storeName}>{order.store_name}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Icon name="person" size={16} color="#666" />
        <Text style={styles.customerName}>{order.customer_name}</Text>
      </View>

      <View style={styles.orderRoute}>
        <View style={styles.routePoint}>
          <Icon name="store" size={16} color="#FF9800" />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {order.pickup_address}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Icon name="place" size={16} color="#4CAF50" />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {order.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        {order.status === 'delivered' ? (
          <>
            <View style={styles.orderDetail}>
              <Icon name="shopping-bag" size={16} color="#2196F3" />
              <Text style={styles.orderDetailText}>{order.items_count} productos</Text>
            </View>
            <View style={styles.orderDetail}>
              <Icon name="directions" size={16} color="#FF9800" />
              <Text style={styles.orderDetailText}>{order.distance} km</Text>
            </View>
            <View style={styles.orderDetail}>
              <Icon name="access-time" size={16} color="#9C27B0" />
              <Text style={styles.orderDetailText}>
                {calculateDuration(order.created_at, order.delivered_at)}
              </Text>
            </View>
            <View style={styles.orderDetail}>
              <Icon name="monetization-on" size={16} color="#4CAF50" />
              <Text style={styles.orderDetailText}>${order.delivery_fee}</Text>
            </View>
          </>
        ) : (
          <View style={styles.cancelledInfo}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.cancelledText}>
              {order.cancellation_reason || 'Pedido cancelado'}
            </Text>
          </View>
        )}
      </View>

      {order.customer_comment && (
        <View style={styles.commentContainer}>
          <Icon name="comment" size={16} color="#666" />
          <Text style={styles.commentText}>{order.customer_comment}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (filter, label, count) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => setStatusFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        statusFilter === filter && styles.activeFilterButtonText
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="local-shipping" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No se encontraron pedidos' : 'No tienes historial de entregas'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? 'Intenta con otros términos de búsqueda'
          : 'Los pedidos entregados aparecerán aquí'
        }
      </Text>
    </View>
  );

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por número, tienda o cliente..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Todos', orders.length)}
        {renderFilterButton('delivered', 'Entregados', deliveredCount)}
        {renderFilterButton('cancelled', 'Cancelados', cancelledCount)}
      </View>

      {/* Lista de pedidos */}
      <FlatList
        data={filteredOrders}
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

      {/* Resumen inferior */}
      {filteredOrders.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {filteredOrders.filter(o => o.status === 'delivered').length}
            </Text>
            <Text style={styles.summaryLabel}>Entregados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ${filteredOrders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + o.delivery_fee, 0)
                .toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total ganado</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(filteredOrders
                .filter(o => o.status === 'delivered' && o.rating)
                .reduce((sum, o) => sum + o.rating, 0) / 
                filteredOrders.filter(o => o.status === 'delivered' && o.rating).length || 0
              ).toFixed(1)} ★
            </Text>
            <Text style={styles.summaryLabel}>Rating promedio</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterButton: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
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
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderRoute: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeAddress: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 8,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cancelledText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  commentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});