// app/(delivery)/orders.tsx — DeliveryOrdersScreen
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

interface DeliveryOrder {
  id: number;
  order_number: string;
  estimated_distance?: number;
  pickup_address: string;
  delivery_address: string;
  delivery_fee: number;
  status: string;
}

export default function DeliveryOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<'available' | 'active'>('available');

  const { data: availableOrders = [], refetch: refetchAvailable, isFetching: fetchingAvailable } = useQuery<DeliveryOrder[]>({
    queryKey: ['delivery', 'orders', 'available'],
    queryFn: () => apiClient.get<DeliveryOrder[] | { results: DeliveryOrder[] }>('orders/available/').then(d => Array.isArray(d) ? d : (d.results || [])),
  });

  const { data: myOrders = [], refetch: refetchMy, isFetching: fetchingMy } = useQuery<DeliveryOrder[]>({
    queryKey: ['delivery', 'orders', 'assigned'],
    queryFn: () => apiClient.get<DeliveryOrder[] | { results: DeliveryOrder[] }>('delivery/assigned-orders/').then(d => Array.isArray(d) ? d : (d.results || [])),
  });

  useFocusEffect(
    useCallback(() => {
      refetchAvailable();
      refetchMy();
    }, [refetchAvailable, refetchMy])
  );

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId: number) => apiClient.post(`orders/${orderId}/accept/`, {}),
    onSuccess: () => {
      refetchAvailable();
      refetchMy();
    },
    onError: () => {
      // Alert handled in the screen via onError
    },
  });

  const acceptOrder = (orderId: number) => {
    acceptOrderMutation.mutate(orderId, {
      onSuccess: () => {
        // notification-style feedback could be wired here
      },
      onError: () => {
        // surface minimal error feedback via console
        console.error('Error accepting order');
      },
    });
  };

  const renderOrderCard = ({ item }: { item: DeliveryOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.order_number}</Text>
        <Text style={styles.orderDistance}>{item.estimated_distance || 2.5} km</Text>
      </View>

      <View style={styles.orderRoute}>
        <View style={styles.routePoint}>
          <Icon name="store" size={16} color="#FF9800" />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Icon name="place" size={16} color="#4CAF50" />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsLabel}>Ganancia</Text>
          <Text style={styles.earningsValue}>${item.delivery_fee}</Text>
        </View>

        {activeTab === 'available' ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptOrder(item.id)}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
          >
            <Text style={styles.viewButtonText}>Ver</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name={activeTab === 'available' ? 'local-shipping' : 'inbox'} size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'available' ? 'No hay pedidos disponibles' : 'No tienes pedidos activos'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'available'
          ? 'Los pedidos aparecerán aquí cuando estén disponibles'
          : 'Acepta pedidos para verlos aquí'}
      </Text>
    </View>
  );

  const currentData = activeTab === 'available' ? availableOrders : myOrders;
  const isFetching = fetchingAvailable || fetchingMy;

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
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Icon
            name="assignment"
            size={20}
            color={activeTab === 'active' ? '#FF9800' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
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
          <RefreshControl refreshing={isFetching} onRefresh={() => { refetchAvailable(); refetchMy(); }} />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
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
  orderDistance: {
    fontSize: 14,
    color: '#666',
  },
  orderRoute: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  orderEarnings: {
    alignItems: 'flex-start',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
