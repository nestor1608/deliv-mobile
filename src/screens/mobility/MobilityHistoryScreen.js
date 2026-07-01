// src/screens/mobility/MobilityHistoryScreen.js
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

export default function MobilityHistoryScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'cancelled'

  useEffect(() => {
    loadTripHistory();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchQuery, statusFilter]);

  const loadTripHistory = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/mobility/trips/?status=history');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.results || []);
      } else {
        // Datos de ejemplo para desarrollo
        const mockTrips = [
          {
            id: 1,
            trip_number: 'T240115001',
            status: 'completed',
            customer_info: { name: 'Juan Pérez', phone: '+54911234567' },
            pickup_address: 'Av. Corrientes 1234, CABA',
            destination_address: 'Av. Santa Fe 5678, CABA',
            pickup_latitude: -34.6037,
            pickup_longitude: -58.3816,
            destination_latitude: -34.5936,
            destination_longitude: -58.3731,
            total_fare: 15.50,
            actual_distance: 8.5,
            actual_duration: 22,
            created_at: '2024-01-15T14:30:00Z',
            completed_at: '2024-01-15T14:52:00Z',
            rating: 5,
          },
          {
            id: 2,
            trip_number: 'T240115002',
            status: 'completed',
            customer_info: { name: 'María García', phone: '+54911234568' },
            pickup_address: 'Terminal Retiro, CABA',
            destination_address: 'Aeropuerto Jorge Newbery, CABA',
            pickup_latitude: -34.5908,
            pickup_longitude: -58.3741,
            destination_latitude: -34.5592,
            destination_longitude: -58.4156,
            total_fare: 25.75,
            actual_distance: 12.3,
            actual_duration: 35,
            created_at: '2024-01-15T12:15:00Z',
            completed_at: '2024-01-15T12:50:00Z',
            rating: 4,
          },
          {
            id: 3,
            trip_number: 'T240114003',
            status: 'cancelled_customer',
            customer_info: { name: 'Carlos López', phone: '+54911234569' },
            pickup_address: 'Plaza San Martín, CABA',
            destination_address: 'Palermo Hollywood, CABA',
            pickup_latitude: -34.5975,
            pickup_longitude: -58.3772,
            destination_latitude: -34.5739,
            destination_longitude: -58.4245,
            total_fare: 0,
            created_at: '2024-01-14T18:20:00Z',
            cancelled_at: '2024-01-14T18:25:00Z',
            cancellation_reason: 'Cliente canceló',
          },
          {
            id: 4,
            trip_number: 'T240114004',
            status: 'completed',
            customer_info: { name: 'Ana Rodríguez', phone: '+54911234570' },
            pickup_address: 'Caminito, La Boca',
            destination_address: 'Puerto Madero, CABA',
            pickup_latitude: -34.6345,
            pickup_longitude: -58.3634,
            destination_latitude: -34.6118,
            destination_longitude: -58.3652,
            total_fare: 18.25,
            actual_distance: 6.8,
            actual_duration: 18,
            created_at: '2024-01-14T16:45:00Z',
            completed_at: '2024-01-14T17:03:00Z',
            rating: 5,
          },
          {
            id: 5,
            trip_number: 'T240113005',
            status: 'completed',
            customer_info: { name: 'Roberto Silva', phone: '+54911234571' },
            pickup_address: 'Recoleta Cemetery, CABA',
            destination_address: 'Microcentro, CABA',
            pickup_latitude: -34.5875,
            pickup_longitude: -58.3932,
            destination_latitude: -34.6082,
            destination_longitude: -58.3742,
            total_fare: 12.50,
            actual_distance: 4.2,
            actual_duration: 15,
            created_at: '2024-01-13T11:30:00Z',
            completed_at: '2024-01-13T11:45:00Z',
            rating: 4,
          },
        ];
        setTrips(mockTrips);
      }
    } catch (error) {
      console.error('Error loading trip history:', error);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripHistory();
    setRefreshing(false);
  };

  const filterTrips = () => {
    let filtered = trips;

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => {
        if (statusFilter === 'completed') return trip.status === 'completed';
        if (statusFilter === 'cancelled') return trip.status.includes('cancelled');
        return true;
      });
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.trip_number.toLowerCase().includes(query) ||
        trip.customer_info?.name.toLowerCase().includes(query) ||
        trip.pickup_address.toLowerCase().includes(query) ||
        trip.destination_address.toLowerCase().includes(query)
      );
    }

    setFilteredTrips(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled_customer':
      case 'cancelled_driver':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'cancelled_customer':
        return 'Cancelado por cliente';
      case 'cancelled_driver':
        return 'Cancelado por conductor';
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

  const renderTripCard = ({ item: trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('MobilityTripDetail', { tripId: trip.id })}
    >
      <View style={styles.tripHeader}>
        <View>
          <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
          <Text style={styles.tripDate}>
            {formatDate(trip.created_at)} • {formatTime(trip.created_at)}
          </Text>
        </View>
        <View style={styles.tripStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
            <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
          </View>
          {trip.rating && renderRating(trip.rating)}
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Icon name="person" size={16} color="#666" />
        <Text style={styles.customerName}>{trip.customer_info?.name}</Text>
      </View>

      <View style={styles.tripRoute}>
        <View style={styles.routePoint}>
          <Icon name="my-location" size={16} color="#4CAF50" />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {trip.pickup_address}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Icon name="place" size={16} color="#f44336" />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {trip.destination_address}
          </Text>
        </View>
      </View>

      <View style={styles.tripDetails}>
        {trip.status === 'completed' ? (
          <>
            <View style={styles.tripDetail}>
              <Icon name="directions" size={16} color="#2196F3" />
              <Text style={styles.tripDetailText}>{trip.actual_distance} km</Text>
            </View>
            <View style={styles.tripDetail}>
              <Icon name="access-time" size={16} color="#FF9800" />
              <Text style={styles.tripDetailText}>{trip.actual_duration} min</Text>
            </View>
            <View style={styles.tripDetail}>
              <Icon name="monetization-on" size={16} color="#4CAF50" />
              <Text style={styles.tripDetailText}>${trip.total_fare}</Text>
            </View>
          </>
        ) : (
          <View style={styles.cancelledInfo}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.cancelledText}>
              {trip.cancellation_reason || 'Viaje cancelado'}
            </Text>
          </View>
        )}
      </View>
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
      <Icon name="history" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No se encontraron viajes' : 'No tienes historial de viajes'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? 'Intenta con otros términos de búsqueda'
          : 'Los viajes completados aparecerán aquí'
        }
      </Text>
    </View>
  );

  const completedCount = trips.filter(t => t.status === 'completed').length;
  const cancelledCount = trips.filter(t => t.status.includes('cancelled')).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por número, cliente o dirección..."
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
        {renderFilterButton('all', 'Todos', trips.length)}
        {renderFilterButton('completed', 'Completados', completedCount)}
        {renderFilterButton('cancelled', 'Cancelados', cancelledCount)}
      </View>

      {/* Lista de viajes */}
      <FlatList
        data={filteredTrips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Resumen inferior */}
      {filteredTrips.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {filteredTrips.filter(t => t.status === 'completed').length}
            </Text>
            <Text style={styles.summaryLabel}>Completados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ${filteredTrips
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + t.total_fare, 0)
                .toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total ganado</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(filteredTrips
                .filter(t => t.status === 'completed' && t.rating)
                .reduce((sum, t) => sum + t.rating, 0) / 
                filteredTrips.filter(t => t.status === 'completed' && t.rating).length || 0
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
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
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
  tripCard: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tripDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tripStatus: {
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
  tripRoute: {
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
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
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