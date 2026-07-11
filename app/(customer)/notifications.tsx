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
import { useRouter } from 'expo-router';
import { NotificationContext } from '../../src/context/NotificationContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
    } = useContext(NotificationContext);

    const formatTimestamp = (timestamp: string | number) => {
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

    const handleMarkAsRead = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    const handleNotificationPress = (notification) => {
        handleMarkAsRead(notification);

        switch (notification.type) {
            case 'order_update':
                if (notification.orderId) {
                    router.push({ pathname: '/order-tracking', params: { orderId: notification.orderId } });
                }
                break;
            case 'ride_update':
                if (notification.rideId) {
                    router.push({ pathname: '/ride-tracking', params: { rideId: notification.rideId } });
                }
                break;
            case 'payment':
                router.push('/payment-methods');
                break;
            case 'promotion':
                break;
            default:
                break;
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
                    onPress: () => clearNotifications()
                }
            ]
        );
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
                <Icon name={getNotificationIcon(item.type)} size={24} color={getNotificationColor(item.type)} />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationBody}>{item.body}</Text>
                <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={80} color="#CCC" />
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
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
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAll}
                >
                    <Icon name="delete-sweep" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Mark all as read */}
            {unreadCount > 0 && (
                <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markAllAsRead}
                >
                    <Icon name="done-all" size={20} color="#007BFF" />
                    <Text style={styles.markAllText}>Marcar todas como leídas</Text>
                </TouchableOpacity>
            )}

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => {}} />
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
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    clearButton: {
        padding: 8,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    markAllText: {
        fontSize: 14,
        color: '#007BFF',
        marginLeft: 8,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 8,
    },
    emptyList: {
        flex: 1,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
    },
    unreadCard: {
        backgroundColor: '#F0F8FF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    notificationBody: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007BFF',
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
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default NotificationsScreen;
