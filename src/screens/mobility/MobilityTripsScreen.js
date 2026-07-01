// src/screens/mobility/MobilityTripsScreen.js
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

export default function MobilityTripsScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [availableTrips, setAvailableTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'active'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadTrips();
    }, [])
  );

  const loadTrips = async () => {
    setLoading(true);
    try {
      // Cargar viajes disponibles
      const availableResponse = await authenticatedFetch('/api/mobility/trips/?status=requested');
      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableTrips(availableData.results || []);
      }

      // Cargar mis viajes activos
      const myTripsResponse = await authenticatedFetch('/api/mobility/trips/?status=active');
      if (myTripsResponse.ok) {
        const myTripsData = await myTripsResponse.json();
        setMyTrips(myTripsData.results || []);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'No se pudieron cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const acceptTrip = async (tripId) => {
    try {
      const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/accept-trip/`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('¡Viaje aceptado!', 'Ve a recoger al pasajero', [
          {
            text: 'Ver detalles',
            onPress: () => navigation.navigate('MobilityTripDetail', { tripId }),
          },
        ]);
        loadTrips(); // Recargar la lista
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo aceptar el viaje');
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const calculateDistance = (trip) => {
    // Implementar cálculo real de distancia
    return trip.estimated_distance || (Math.random() * 10 + 1).toFixed(1);
  };

  const calculateDuration = (trip) => {
    // Tiempo estimado
    return trip.estimated_duration || Math.round(parseFloat(calculateDistance(trip)) * 2 + 5);
  };

  const renderTripCard = ({ item: trip }) => {
    const distance = calculateDistance(trip);
    const duration = calculateDuration(trip);
    
    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => navigation.navigate('MobilityTripDetail', { tripId: trip.id })}
      >
        <View style={styles.tripHeader}>
          <View>
            <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
            <Text style={styles.customerName}>{trip.customer_info?.name}</Text>
          </View>
          <View style={styles.tripValue}>
            <Text style={styles.tripFare}>${trip.total_fare}</Text>
            <Text style={styles.tripFareLabel}>Ganancia</Text>
          </View>
        </View>

        <View style={styles.tripRoute}>
          <View style={styles.routePoint}>
            <Icon name="my-location" size={16} color="#4CAF50" />
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.pickup_address}
            </Text>
          </View>
          
          <View style={styles.routeLine}>
            <View style={styles.routeDots}>
              <View style={styles.routeDot} />
              <View style={styles.routeDot} />
              <View style={styles.routeDot} />
            </View>
          </View>
          
          <View style={styles.routePoint}>
            <Icon name="place" size={16} color="#f44336" />
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.destination_address}
            </Text>
          </View>
        </View>

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Icon name="directions" size={16} color="#2196F3" />
            <Text style={styles.statText}>{distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="access-time" size={16} color="#FF9800" />
            <Text style={styles.statText}>{duration} min</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="payment" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{trip.payment_method || 'Efectivo'}</Text>
          </View>
        </View>

        {activeTab === 'available' ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptTrip(trip.id)}
          >
            <Icon name="directions-car" size={20} color="#fff" />
            <Text style={styles.acceptButtonText}>Aceptar Viaje</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, getStatusStyle(trip.status)]}>
              <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => navigation.navigate('MobilityMap', { tripId: trip.id })}
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
      case 'accepted':
        return { backgroundColor: '#FF9800' };
      case 'driver_arrived':
        return { backgroundColor: '#2196F3' };
      case 'in_progress':
        return { backgroundColor: '#9C27B0' };
      default:
        return { backgroundColor: '#666' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return 'Aceptado';
      case 'driver_arrived':
        return 'En origen';
      case 'in_progress':
        return 'En viaje';
      default:
        return status;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon 
        name={activeTab === 'available' ? 'directions-car' : 'event-busy'} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'available' ? 'No hay viajes disponibles' : 'No tienes viajes activos'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {activeTab === 'available' 
          ? 'Los viajes aparecerán aquí cuando estén disponibles'
          : 'Acepta viajes para verlos aquí'
        }
      </Text>
    </View>
  );

  const currentData = activeTab === 'available' ? availableTrips : myTrips;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Icon 
            name="directions-car" 
            size={20} 
            color={activeTab === 'available' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableTrips.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Icon 
            name="event" 
            size={20} 
            color={activeTab === 'active' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Mis Viajes ({myTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de viajes */}
      <FlatList
        data={currentData}
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
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
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
    marginBottom: 16,
  },
  tripNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tripValue: {
    alignItems: 'flex-end',
  },
  tripFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tripFareLabel: {
    fontSize: 12,
    color: '#666',
  },
  tripRoute: {
    marginBottom: 16,
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
  routeLine: {
    marginLeft: 8,
    marginBottom: 8,
  },
  routeDots: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginVertical: 1,
  },
  tripStats: {
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