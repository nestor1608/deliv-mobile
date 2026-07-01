// src/screens/mobility/MobilityTripDetailScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

export default function MobilityTripDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTripDetails();
  }, []);

  const loadTripDetails = async () => {
    try {
      const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/`);
      if (response.ok) {
        const tripData = await response.json();
        setTrip(tripData);
      } else {
        Alert.alert('Error', 'No se pudo cargar el viaje');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Error de conexión');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const acceptTrip = async () => {
    try {
      const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/accept-trip/`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('¡Viaje aceptado!', 'Ve a recoger al pasajero', [
          {
            text: 'Navegar',
            onPress: () => navigation.navigate('MobilityMap', { tripId }),
          },
        ]);
        loadTripDetails();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo aceptar el viaje');
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const cancelTrip = async () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro de que quieres cancelar este viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await authenticatedFetch(`/api/mobility/trips/${tripId}/cancel-trip/`, {
                method: 'PATCH',
                body: JSON.stringify({
                  reason: 'Cancelado por conductor',
                }),
              });

              if (response.ok) {
                Alert.alert('Viaje cancelado', 'El viaje ha sido cancelado');
                navigation.goBack();
              } else {
                Alert.alert('Error', 'No se pudo cancelar el viaje');
              }
            } catch (error) {
              console.error('Error canceling trip:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  const callPassenger = () => {
    if (trip?.customer_info?.phone) {
      Linking.openURL(`tel:${trip.customer_info.phone}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return '#FF9800';
      case 'accepted':
        return '#2196F3';
      case 'driver_arrived':
        return '#4CAF50';
      case 'in_progress':
        return '#9C27B0';
      case 'completed':
        return '#4CAF50';
      case 'cancelled_driver':
      case 'cancelled_customer':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'requested':
        return 'Solicitado';
      case 'accepted':
        return 'Aceptado';
      case 'driver_arrived':
        return 'Conductor en origen';
      case 'in_progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled_driver':
        return 'Cancelado por conductor';
      case 'cancelled_customer':
        return 'Cancelado por cliente';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header del viaje */}
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderContent}>
            <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
              <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
            </View>
          </View>
          <Text style={styles.tripDate}>{formatDate(trip.created_at)}</Text>
        </View>

        {/* Información del pasajero */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del pasajero</Text>
          <View style={styles.passengerInfo}>
            <View style={styles.passengerDetails}>
              <Icon name="person" size={24} color="#2196F3" />
              <View style={styles.passengerText}>
                <Text style={styles.passengerName}>{trip.customer_info?.name}</Text>
                <Text style={styles.passengerPhone}>{trip.customer_info?.phone}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
              <Icon name="phone" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ruta del viaje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruta del viaje</Text>
          
          <View style={styles.routeContainer}>
            {/* Origen */}
            <View style={styles.routePoint}>
              <View style={styles.routeIcon}>
                <Icon name="my-location" size={20} color="#4CAF50" />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Origen</Text>
                <Text style={styles.routeAddress}>{trip.pickup_address}</Text>
              </View>
            </View>

            {/* Línea de conexión */}
            <View style={styles.routeLine}>
              <View style={styles.routeDots}>
                {[1, 2, 3, 4, 5].map((dot) => (
                  <View key={dot} style={styles.routeDot} />
                ))}
              </View>
            </View>

            {/* Destino */}
            <View style={styles.routePoint}>
              <View style={styles.routeIcon}>
                <Icon name="place" size={20} color="#f44336" />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeAddress}>{trip.destination_address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detalles del viaje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del viaje</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="directions" size={20} color="#2196F3" />
              <Text style={styles.detailLabel}>Distancia</Text>
              <Text style={styles.detailValue}>
                {trip.actual_distance || trip.estimated_distance} km
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="access-time" size={20} color="#FF9800" />
              <Text style={styles.detailLabel}>Duración</Text>
              <Text style={styles.detailValue}>
                {trip.actual_duration || trip.estimated_duration} min
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="monetization-on" size={20} color="#4CAF50" />
              <Text style={styles.detailLabel}>Tarifa</Text>
              <Text style={styles.detailValue}>${trip.total_fare}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="payment" size={20} color="#9C27B0" />
              <Text style={styles.detailLabel}>Pago</Text>
              <Text style={styles.detailValue}>
                {trip.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
              </Text>
            </View>
          </View>
        </View>

        {/* Desglose de tarifa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose de tarifa</Text>
          
          <View style={styles.fareBreakdown}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Tarifa base</Text>
              <Text style={styles.fareValue}>${trip.base_fare}</Text>
            </View>
            
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Por distancia</Text>
              <Text style={styles.fareValue}>${trip.distance_fare}</Text>
            </View>
            
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Por tiempo</Text>
              <Text style={styles.fareValue}>${trip.time_fare}</Text>
            </View>
            
            {trip.surge_multiplier > 1 && (
              <View style={styles.fareItem}>
                <Text style={styles.fareLabel}>Multiplicador ({trip.surge_multiplier}x)</Text>
                <Text style={styles.fareValue}>
                  +${((trip.total_fare / trip.surge_multiplier) * (trip.surge_multiplier - 1)).toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={[styles.fareItem, styles.totalFare]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${trip.total_fare}</Text>
            </View>
          </View>
        </View>

        {/* Notas del cliente */}
        {trip.customer_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas del cliente</Text>
            <View style={styles.notesContainer}>
              <Icon name="note" size={20} color="#666" />
              <Text style={styles.notesText}>{trip.customer_notes}</Text>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial del viaje</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <Icon name="add-circle" size={16} color="#2196F3" />
              <Text style={styles.timelineText}>
                Viaje solicitado - {formatDate(trip.created_at)}
              </Text>
            </View>
            
            {trip.accepted_at && (
              <View style={styles.timelineItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.timelineText}>
                  Viaje aceptado - {formatDate(trip.accepted_at)}
                </Text>
              </View>
            )}
            
            {trip.started_at && (
              <View style={styles.timelineItem}>
                <Icon name="play-circle-filled" size={16} color="#FF9800" />
                <Text style={styles.timelineText}>
                  Viaje iniciado - {formatDate(trip.started_at)}
                </Text>
              </View>
            )}
            
            {trip.completed_at && (
              <View style={styles.timelineItem}>
                <Icon name="done-all" size={16} color="#9C27B0" />
                <Text style={styles.timelineText}>
                  Viaje completado - {formatDate(trip.completed_at)}
                </Text>
              </View>
            )}
            
            {trip.cancelled_at && (
              <View style={styles.timelineItem}>
                <Icon name="cancel" size={16} color="#f44336" />
                <Text style={styles.timelineText}>
                  Viaje cancelado - {formatDate(trip.cancelled_at)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionContainer}>
        {trip.status === 'requested' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.rejectButton} onPress={() => navigation.goBack()}>
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={acceptTrip}>
              <Text style={styles.acceptButtonText}>Aceptar viaje</Text>
            </TouchableOpacity>
          </View>
        )}

        {['accepted', 'driver_arrived', 'in_progress'].includes(trip.status) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelTrip}>
              <Icon name="cancel" size={20} color="#f44336" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navigateButton} 
              onPress={() => navigation.navigate('MobilityMap', { tripId })}
            >
              <Icon name="navigation" size={20} color="#fff" />
              <Text style={styles.navigateButtonText}>Navegar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tripHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tripHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerText: {
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  passengerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  routeContainer: {
    paddingHorizontal: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routeAddress: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  routeLine: {
    marginLeft: 20,
    paddingVertical: 8,
  },
  routeDots: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginVertical: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  fareBreakdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalFare: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  actionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectButton: {
    flex: 0.45,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 0.45,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 0.45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  navigateButton: {
    flex: 0.45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});