// src/screens/delivery/DeliveryNotificationsScreen.js
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

export default function DeliveryNotificationsScreen() {
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
      const response = await authenticatedFetch('/api/notifications/');
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
          type: 'new_order',
          title: 'Nuevo pedido disponible',
          message: 'Hay un pedido disponible cerca de tu ubicación',
          timestamp: '2024-01-15T10:30:00Z',
          read: false,
          data: { orderId: 123 }
        },
        {
          id: 2,
          type: 'order_update',
          title: 'Pedido actualizado',
          message: 'El cliente cambió la dirección de entrega',
          timestamp: '2024-01-15T09:15:00Z',
          read: true,
          data: { orderId: 122 }
        },
        {
          id: 3,
          type: 'earnings',
          title: 'Pago procesado',
          message: 'Se han acreditado $45.50 a tu cuenta',
          timestamp: '2024-01-14T18:45:00Z',
          read: false,
          data: { amount: 45.50 }
        },
        {
          id: 4,
          type: 'system',
          title: 'Actualización de la app',
          message: 'Nueva versión disponible con mejoras en la navegación',
          timestamp: '2024-01-14T16:20:00Z',
          read: true,
          data: {}
        },
        {
          id: 5,
          type: 'promotion',
          title: 'Promoción especial',
          message: 'Gana 50% más en entregas este fin de semana',
          timestamp: '2024-01-13T12:00:00Z',
          read: false,
          data: {}
        }
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
      await authenticatedFetch(`/api/notifications/${notificationId}/mark-read/`, {
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
      case 'new_order':
        if (notification.data.orderId) {
          navigation.navigate('DeliveryOrderDetail', { 
            orderId: notification.data.orderId 
          });
        }
        break;
      case 'order_update':
        if (notification.data.orderId) {
          navigation.navigate('DeliveryOrderDetail', { 
            orderId: notification.data.orderId 
          });
        }
        break;
      case 'earnings':
        navigation.navigate('DeliveryEarnings');
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
              await authenticatedFetch('/api/notifications/clear-all/', {
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
      case 'new_order':
        return 'local-shipping';
      case 'order_update':
        return 'update';
      case 'earnings':
        return 'monetization-on';
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
      case 'new_order':
        return '#4CAF50';
      case 'order_update':
        return '#FF9800';
      case 'earnings':
        return '#2196F3';
      case 'system':
        return '#9C27B0';
      case 'promotion':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
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
        Las notificaciones aparecerán aquí cuando recibas actualizaciones
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
    borderLeftColor: '#FF9800',
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
    backgroundColor: '#FF9800',
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