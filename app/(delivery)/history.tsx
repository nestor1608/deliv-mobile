// app/(delivery)/history.tsx — DeliveryHistoryScreen
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

interface HistoryOrder {
  id: number;
  order_number: string;
  status: string;
  store_name: string;
  customer_name: string;
  total_amount: number;
  delivery_fee: number;
  created_at: string;
}

export default function DeliveryHistoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');

  const { data: orders = [], refetch, isFetching } = useQuery<HistoryOrder[]>({
    queryKey: ['delivery', 'order-history'],
    queryFn: () => apiClient.get<HistoryOrder[] | { results: HistoryOrder[] }>('delivery/order-history/').then(d => Array.isArray(d) ? d : (d.results || [])),
    placeholderData: [
      {
        id: 1,
        order_number: 'D240115001',
        status: 'delivered',
        store_name: 'Restaurante Mexicano',
        customer_name: 'Juan Pérez',
        total_amount: 85.50,
        delivery_fee: 12.50,
        created_at: '2024-01-15T19:30:00Z',
      },
    ],
  });

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.store_name?.toLowerCase().includes(query) ||
          order.customer_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderOrderCard = ({ item }: { item: HistoryOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.storeName}>{item.store_name}</Text>
        <Text style={styles.customerName}>{item.customer_name}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.deliveryFee}>+${item.delivery_fee} ganancia</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No tienes historial</Text>
      <Text style={styles.emptySubtitle}>Los pedidos completados aparecerán aquí</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {(['all', 'delivered', 'cancelled'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, statusFilter === filter && styles.activeFilterButton]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text style={[styles.filterButtonText, statusFilter === filter && styles.activeFilterButtonText]}>
              {filter === 'all' ? 'Todos' : filter === 'delivered' ? 'Entregados' : 'Cancelados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#333', marginLeft: 8 },
  filtersContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#f8f9fa' },
  activeFilterButton: { backgroundColor: '#FF9800' },
  filterButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeFilterButtonText: { color: '#fff' },
  listContainer: { padding: 16, flexGrow: 1 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderDate: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  orderInfo: { marginBottom: 12 },
  storeName: { fontSize: 14, fontWeight: '600', color: '#333' },
  customerName: { fontSize: 14, color: '#666', marginTop: 2 },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  deliveryFee: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#ccc', marginTop: 8 },
});
