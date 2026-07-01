// src/screens/mobility/MobilityNotificationsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

export default function MobilityNotificationsScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/mobility/notifications/');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.results || data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Datos de ejemplo para desarrollo
      setNotifications([
        {
          id: 1,
          type: 'trip_request',
          title: 'Nueva solicitud de viaje',
          message: 'Tienes una nueva solicitud de viaje cerca de tu ubicación',
          timestamp: '2024-01-15T10:30:00Z',
          read: false,
          data: { tripId: 123 }
        },
        {
          id: 2,
          type: 'trip_cancelled',
          title: 'Viaje cancelado',
          message: 'El pasajero ha cancelado el viaje #T240115001',
          timestamp: '2024-01-15T09:45:00Z',
          read: true,
          data: { tripId: 122 }
        },
        {
          id: 3,
          type: 'earnings',
          title: 'Pago procesado',
          message: 'Se han acreditado $125.75 por tus viajes de ayer',
          timestamp: '2024-01-15T08:00:00Z',
          read: false,
          data: { amount: 125.75, date: '2024-01-14' }
        },
        {
          id: 4,
          type: 'rating_received',
          title: 'Nueva calificación',
          message: 'Has recibido una calificación de 5 estrellas',
          timestamp: '2024-01-14T22:15:00Z',
          read: false,
          data: { tripId: 121, rating: 5 }
        },
        {
          id: 5,
          type: 'system',
          title: 'Actualización de la app',
          message: 'Nueva versión disponible con mejoras en el sistema de navegación',
          timestamp: '2024-01-14T16:20:00Z',
          read: true,
          data: {}
        },
        {
          id: 6,
          type: 'promotion',
          title: 'Promoción especial',
          message: 'Gana 20% más en viajes durante el fin de semana',
          timestamp: '2024-01-14T12:00:00Z',
          read: false,
          data: { promotionId: 'weekend_boost' }
        },
        {
          id: 7,
          type: 'trip_completed',
          title: 'Viaje completado',
          message: 'Has completado exitosamente el viaje a Puerto Madero',
          timestamp: '2024-01-13T20:45:00Z',
          read: true,
          data: { tripId: 120, destination: 'Puerto Madero' }
        },
        {
          id: 8,
          type: 'bonus_earned',
          title: 'Bono ganado',
          message: 'Has ganado un bono de $25 por completar 10 viajes esta semana',
          timestamp: '2024-01-13T18:30:00Z',
          read: false,
          data: { bonusAmount: 25, reason: '10_trips_weekly' }
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await authenticatedFetch(`/api/mobility/notifications/${notificationId}/mark-read/`, {
        method: 'PATCH',
      });
      
      // Actualizar el estado local
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    switch (notification.type) {
      case 'trip_request':
        if (notification.data.tripId) {
          navigation.navigate('MobilityTripDetail', { 
            tripId: notification.data.tripId 
          });
        }
        break;
      case 'trip_cancelled':
      case 'trip_completed':
        if (notification.data.tripId) {
          navigation.navigate('MobilityTripDetail', { 
            tripId: notification.data.tripId 
          });
        }
        break;
      case 'earnings':
      case 'bonus_earned':
        navigation.navigate('MobilityEarnings');
        break;
      case 'rating_received':
        if (notification.data.tripId) {
          navigation.navigate('MobilityTripDetail', { 
            tripId: notification.data.tripId 
          });
        }
        break;
      case 'promotion':
        // Navegar a una pantalla de promociones o mostrar detalles
        Alert.alert(
          'Promoción especial',
          notification.message,
          [{ text: 'OK' }]
        );
        break;
      default:
        // Para otros tipos, solo marcar como leído
        break;
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Limpiar notificaciones',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authenticatedFetch('/api/mobility/notifications/clear-all/', {
                method: 'DELETE',
              });
              setNotifications([]);
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trip_request':
        return 'directions-car';
      case 'trip_cancelled':
        return 'cancel';
      case 'trip_completed':
        return 'check-circle';
      case 'earnings':
      case 'bonus_earned':
        return 'monetization-on';
      case 'rating_received':
        return 'star';
      case 'system':
        return 'info';
      case 'promotion':
        return 'local-offer';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'trip_request':
        return '#4CAF50';
      case 'trip_cancelled':
        return '#f44336';
      case 'trip_completed':
        return '#2196F3';
      case 'earnings':
      case 'bonus_earned':
        return '#4CAF50';
      case 'rating_received':
        return '#FFC107';
      case 'system':
        return '#9C27B0';
      case 'promotion':
        return '#FF5722';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotification = ({ item: notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) }]}>
          <Icon 
            name={getNotificationIcon(notification.type)} 
            size={24} 
            color="#fff" 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
        
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-none" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No tienes notificaciones</Text>
      <Text style={styles.emptyStateSubtitle}>
        Las notificaciones de viajes y ganancias aparecerán aquí
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications}>
            <Icon name="delete-sweep" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de notificaciones */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
    marginTop: 4,
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