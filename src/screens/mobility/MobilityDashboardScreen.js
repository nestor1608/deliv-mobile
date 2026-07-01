// src/screens/mobility/MobilityDashboardScreen.js
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

export default function MobilityDashboardScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch, userData } = useContext(AuthContext);
  
  const [isOnline, setIsOnline] = useState(false);
  const [activeTrips, setActiveTrips] = useState([]);
  const [todayStats, setTodayStats] = useState({
    trips: 0,
    earnings: 0,
    distance: 0,
    rating: 0,
    onlineTime: 0,
  });
  const [pendingTrips, setPendingTrips] = useState([]);
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
      
      // Actualizar ubicación en el servidor si está online
      if (isOnline) {
        updateLocationOnServer(location.coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const updateLocationOnServer = async (coords) => {
    try {
      await authenticatedFetch('/api/mobility/drivers/update-location/', {
        method: 'PATCH',
        body: JSON.stringify({
          current_latitude: coords.latitude,
          current_longitude: coords.longitude,
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar viajes activos
      const activeTripsResponse = await authenticatedFetch('/api/mobility/trips/?status=active');
      if (activeTripsResponse.ok) {
        const activeTripsData = await activeTripsResponse.json();
        setActiveTrips(activeTripsData.results || []);
      }

      // Cargar estadísticas del día
      const statsResponse = await authenticatedFetch('/api/mobility/drivers/earnings/?period=today');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTodayStats(statsData);
      }

      // Cargar estado del conductor
      const profileResponse = await authenticatedFetch('/api/mobility/drivers/me/');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setIsOnline(profileData.availability === 'available');
      }

      // Cargar viajes pendientes de aceptar
      const pendingResponse = await authenticatedFetch('/api/mobility/trips/?status=requested');
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingTrips(pendingData.results || []);
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

  const toggleOnlineStatus = async (value) => {
    try {
      if (value && !location) {
        Alert.alert('Ubicación', 'Obteniendo ubicación...');
        await getCurrentLocation();
        return;
      }

      const response = await authenticatedFetch('/api/mobility/drivers/update-availability/', {
        method: 'PATCH',
        body: JSON.stringify({
          availability: value ? 'available' : 'offline',
          current_latitude: location?.coords.latitude,
          current_longitude: location?.coords.longitude,
        }),
      });

      if (response.ok) {
        setIsOnline(value);
        if (value) {
          Alert.alert('¡Conectado!', 'Ahora estás disponible para recibir viajes');
        } else {
          Alert.alert('Desconectado', 'Ya no recibirás nuevos viajes');
        }
      } else {
        throw new Error('Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
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
        loadDashboardData();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo aceptar el viaje');
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      Alert.alert('Error', 'Error de conexión');
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

  const renderTripRequest = (trip) => (
    <View key={trip.id} style={styles.tripRequestCard}>
      <View style={styles.tripRequestHeader}>
        <Text style={styles.tripRequestTitle}>Nueva solicitud de viaje</Text>
        <Text style={styles.tripRequestFare}>${trip.total_fare}</Text>
      </View>
      
      <View style={styles.tripRequestInfo}>
        <View style={styles.tripRequestLocation}>
          <Icon name="my-location" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.pickup_address}
          </Text>
        </View>
        <View style={styles.tripRequestLocation}>
          <Icon name="place" size={16} color="#f44336" />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.destination_address}
          </Text>
        </View>
      </View>

      <View style={styles.tripRequestStats}>
        <View style={styles.tripStat}>
          <Icon name="directions" size={16} color="#666" />
          <Text style={styles.tripStatText}>{trip.estimated_distance} km</Text>
        </View>
        <View style={styles.tripStat}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.tripStatText}>{trip.estimated_duration} min</Text>
        </View>
      </View>

      <View style={styles.tripRequestActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => {/* Implementar rechazo */}}
        >
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptTripButton}
          onPress={() => acceptTrip(trip.id)}
        >
          <Text style={styles.acceptTripButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveTrip = (trip) => (
    <TouchableOpacity
      key={trip.id}
      style={styles.activeTripCard}
      onPress={() => navigation.navigate('MobilityTripDetail', { tripId: trip.id })}
    >
      <View style={styles.activeTripHeader}>
        <Text style={styles.activeTripTitle}>#{trip.trip_number}</Text>
        <View style={[styles.statusBadge, getStatusColor(trip.status)]}>
          <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>{trip.customer_info?.name}</Text>
      
      <View style={styles.activeTripInfo}>
        <View style={styles.activeTripLocation}>
          <Icon name="my-location" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.pickup_address}
          </Text>
        </View>
        <View style={styles.activeTripLocation}>
          <Icon name="place" size={16} color="#f44336" />
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.destination_address}
          </Text>
        </View>
      </View>

      <View style={styles.activeTripActions}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => navigation.navigate('MobilityMap', { tripId: trip.id })}
        >
          <Icon name="navigation" size={20} color="#2196F3" />
          <Text style={styles.navigateButtonText}>Navegar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header con estado online */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>¡Hola, {userData?.first_name}!</Text>
              <Text style={styles.subtitleText}>
                {isOnline ? 'Estás conectado' : 'Estás desconectado'}
              </Text>
            </View>
            <View style={styles.onlineContainer}>
              <Text style={styles.onlineLabel}>En línea</Text>
              <Switch
                value={isOnline}
                onValueChange={toggleOnlineStatus}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isOnline ? '#2196F3' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>

        {/* Solicitudes de viaje pendientes */}
        {pendingTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitudes de Viaje</Text>
            {pendingTrips.map(renderTripRequest)}
          </View>
        )}

        {/* Estadísticas del día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Viajes',
              todayStats.trips,
              'directions-car',
              '#4CAF50',
              () => navigation.navigate('MobilityHistory')
            )}
            {renderStatsCard(
              'Ganancias',
              `${todayStats.earnings}`,
              'monetization-on',
              '#FF9800',
              () => navigation.navigate('MobilityEarnings')
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

        {/* Viajes activos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viajes Activos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripsTab')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {activeTrips.length > 0 ? (
            activeTrips.map(renderActiveTrip)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="directions-car" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {isOnline ? 'No tienes viajes activos' : 'Conéctate para recibir viajes'}
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
              onPress={() => navigation.navigate('MobilityHistory')}
            >
              <Icon name="history" size={32} color="#2196F3" />
              <Text style={styles.quickActionText}>Historial</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('MobilityEarnings')}
            >
              <Icon name="account-balance-wallet" size={32} color="#4CAF50" />
              <Text style={styles.quickActionText}>Ganancias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Icon name="person" size={32} color="#FF9800" />
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
    backgroundColor: '#2196F3',
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
  onlineContainer: {
    alignItems: 'center',
  },
  onlineLabel: {
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
    color: '#2196F3',
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
  tripRequestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRequestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tripRequestFare: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tripRequestInfo: {
    marginBottom: 12,
  },
  tripRequestLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  tripRequestStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  tripRequestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectButton: {
    flex: 0.45,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptTripButton: {
    flex: 0.45,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptTripButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTripCard: {
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
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTripTitle: {
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
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  activeTripInfo: {
    marginBottom: 12,
  },
  activeTripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTripActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  navigateButtonText: {
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