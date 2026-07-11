// src/screens/store/VendorNotificationsScreen.js
import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Switch,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '../../src/context/NotificationContext';

const NOTIFICATION_TYPES = {
    new_order: {
        icon: 'receipt-outline',
        color: '#FF6B6B',
        title: 'Nuevo pedido',
    },
    order_cancelled: {
        icon: 'close-circle-outline',
        color: '#F44336',
        title: 'Pedido cancelado',
    },
    payment_received: {
        icon: 'cash-outline',
        color: '#4CAF50',
        title: 'Pago recibido',
    },
    system_update: {
        icon: 'information-circle-outline',
        color: '#2196F3',
        title: 'Actualización del sistema',
    },
    promotion: {
        icon: 'megaphone-outline',
        color: '#FF9800',
        title: 'Promoción',
    },
    review_received: {
        icon: 'star-outline',
        color: '#FFD700',
        title: 'Nueva reseña',
    },
};

export default function VendorNotificationsScreen() {
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
    } = useContext(NotificationContext);

    const [refreshing, setRefreshing] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        new_orders: true,
        order_updates: true,
        payments: true,
        reviews: true,
        promotions: false,
        system_updates: true,
    });

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleNotificationPress = (notification) => {
        markAsRead(notification.id);

        if (notification.data?.type === 'new_order' && notification.data?.orderId) {
            router.push({ pathname: '/order-detail', params: { orderId: notification.data.orderId } });
        } else if (notification.data?.type === 'order_update' && notification.data?.orderId) {
            router.push({ pathname: '/order-detail', params: { orderId: notification.data.orderId } });
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            'Limpiar notificaciones',
            '¿Estás seguro que quieres eliminar todas las notificaciones?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: clearNotifications,
                },
            ]
        );
    };

    const updateNotificationSetting = (setting, value) => {
        setNotificationSettings(prev => ({ ...prev, [setting]: value }));
    };

    const renderNotificationItem = ({ item }) => {
        const notificationTypeInfo = NOTIFICATION_TYPES[item.data?.type] || {
            icon: 'notifications-outline',
            color: '#666',
            title: 'Notificación',
        };

        const timeAgo = getTimeAgo(item.timestamp);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.read && styles.unreadNotification
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.notificationContent}>
                    <View style={[
                        styles.notificationIcon,
                        { backgroundColor: notificationTypeInfo.color + '20' }
                    ]}>
                        <Ionicons
                            name={notificationTypeInfo.icon}
                            size={24}
                            color={notificationTypeInfo.color}
                        />
                    </View>

                    <View style={styles.notificationText}>
                        <Text style={[
                            styles.notificationTitle,
                            !item.read && styles.unreadText
                        ]}>
                            {item.title || notificationTypeInfo.title}
                        </Text>
                        <Text style={styles.notificationBody} numberOfLines={2}>
                            {item.body}
                        </Text>
                        <Text style={styles.notificationTime}>
                            {timeAgo}
                        </Text>
                    </View>

                    {!item.read && <View style={styles.unreadDot} />}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtitle}>
                Aquí aparecerán las notificaciones de tu negocio
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>
                    Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </Text>
                {notifications.length > 0 && (
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={markAllAsRead}
                            >
                                <Text style={styles.headerButtonText}>
                                    Marcar todas como leídas
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.headerButton, styles.dangerButton]}
                            onPress={handleClearAll}
                        >
                            <Text style={[styles.headerButtonText, styles.dangerButtonText]}>
                                Limpiar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Configuración de notificaciones */}
            <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Configuración de notificaciones</Text>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Nuevos pedidos</Text>
                    <Switch
                        value={notificationSettings.new_orders}
                        onValueChange={(value) => updateNotificationSetting('new_orders', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.new_orders ? '#ffffff' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Actualizaciones de pedidos</Text>
                    <Switch
                        value={notificationSettings.order_updates}
                        onValueChange={(value) => updateNotificationSetting('order_updates', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.order_updates ? '#ffffff' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Pagos recibidos</Text>
                    <Switch
                        value={notificationSettings.payments}
                        onValueChange={(value) => updateNotificationSetting('payments', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.payments ? '#ffffff' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Nuevas reseñas</Text>
                    <Switch
                        value={notificationSettings.reviews}
                        onValueChange={(value) => updateNotificationSetting('reviews', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.reviews ? '#ffffff' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Promociones</Text>
                    <Switch
                        value={notificationSettings.promotions}
                        onValueChange={(value) => updateNotificationSetting('promotions', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.promotions ? '#ffffff' : '#f4f3f4'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Actualizaciones del sistema</Text>
                    <Switch
                        value={notificationSettings.system_updates}
                        onValueChange={(value) => updateNotificationSetting('system_updates', value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={notificationSettings.system_updates ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
            </View>
        </View>
    );

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Ahora mismo';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Hace ${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Hace ${diffInDays}d`;

        return notificationTime.toLocaleDateString('es-AR');
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    dangerButton: {
        backgroundColor: '#FFE5E5',
    },
    headerButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    dangerButtonText: {
        color: '#F44336',
    },
    settingsSection: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 16,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingLabel: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    notificationItem: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        position: 'relative',
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationText: {
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
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    unreadDot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});
