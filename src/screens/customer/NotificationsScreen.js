// src/screens/customer/NotificationsScreen.js
import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    RefreshControl,
} from 'react-native';
import { NotificationContext } from '../../context/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        clearNotifications 
    } = useContext(NotificationContext);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_update':
                return 'shopping-bag';
            case 'ride_update':
                return 'directions-car';
            case 'payment':
                return 'payment';
            case 'promotion':
                return 'local-offer';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'order_update':
                return '#4CAF50';
            case 'ride_update':
                return '#2196F3';
            case 'payment':
                return '#FF9800';
            case 'promotion':
                return '#9C27B0';
            default:
                return '#666';
        }
    };

    const handleNotificationPress = (notification) => {
        markAsRead(notification.id);
        
        // Navegar según el tipo de notificación
        if (notification.data?.type === 'order_update' && notification.data?.orderId) {
            navigation.navigate('OrderTracking', { orderId: notification.data.orderId });
        } else if (notification.data?.type === 'ride_update' && notification.data?.rideId) {
            navigation.navigate('RideTracking', { rideId: notification.data.rideId });
        }
    };

    const handleMarkAllAsRead = () => {
        if (unreadCount > 0) {
            markAllAsRead();
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            'Limpiar notificaciones',
            '¿Estás seguro de que quieres eliminar todas las notificaciones?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: clearNotifications 
                }
            ]
        );
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.read && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.notificationIcon}>
                <Icon 
                    name={getNotificationIcon(item.data?.type)} 
                    size={24} 
                    color={getNotificationColor(item.data?.type)}
                />
            </View>
            
            <View style={styles.notificationContent}>
                <Text style={[
                    styles.notificationTitle,
                    !item.read && styles.unreadText
                ]}>
                    {item.title}
                </Text>
                <Text style={styles.notificationBody} numberOfLines={2}>
                    {item.body}
                </Text>
                <Text style={styles.notificationTime}>
                    {formatTimestamp(item.timestamp)}
                </Text>
            </View>
            
            {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtitle}>
                Aquí aparecerán las actualizaciones de tus pedidos y viajes
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>
                    Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </Text>
                
                <View style={styles.headerActions}>
                    {unreadCount > 0 && (
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={handleMarkAllAsRead}
                        >
                            <Icon name="done-all" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                    
                    {notifications.length > 0 && (
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={handleClearAll}
                        >
                            <Icon name="clear-all" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Lista de notificaciones */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : null}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl 
                        refreshing={false} 
                        onRefresh={() => {/* Recargar notificaciones si es necesario */}} 
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    list: {
        flex: 1,
    },
    emptyList: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'flex-start',
    },
    unreadNotification: {
        backgroundColor: '#F8F9FF',
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: 'bold',
    },
    notificationBody: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
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
        marginTop: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default NotificationsScreen;