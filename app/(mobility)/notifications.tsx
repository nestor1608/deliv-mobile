// app/(mobility)/notifications.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityNotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['mobility', 'notifications'],
        queryFn: () => apiClient.get('api/mobility/notifications/'),
    });

    useEffect(() => {
        if (data) {
            setNotifications(data.results || data);
        }
    }, [data]);

    const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

    const getIcon = (type) => {
        switch (type) {
            case 'trip_request': return 'directions-car';
            case 'earnings': return 'monetization-on';
            case 'rating_received': return 'star';
            case 'trip_completed': return 'check-circle';
            default: return 'notifications';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'trip_request': return '#4CAF50';
            case 'earnings': return '#4CAF50';
            case 'rating_received': return '#FFC107';
            default: return '#2196F3';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.abs(now - date) / (1000 * 60);
        if (diffMinutes < 60) return `Hace ${Math.round(diffMinutes)} min`;
        if (diffMinutes < 1440) return `Hace ${Math.round(diffMinutes / 60)} h`;
        return date.toLocaleDateString();
    };

    const renderNotification = ({ item }) => (
        <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
            <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) }]}>
                <Icon name={getIcon(item.type)} size={24} color="#fff" />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}
                ListEmptyComponent={<View style={styles.emptyState}><Icon name="notifications-none" size={64} color="#ccc" /><Text style={styles.emptyTitle}>No tienes notificaciones</Text></View>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    listContainer: { padding: 16, flexGrow: 1 },
    notificationCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: '#2196F3' },
    iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    textContainer: { flex: 1 },
    notificationTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    unreadTitle: { fontWeight: 'bold' },
    notificationMessage: { fontSize: 14, color: '#666', marginBottom: 8 },
    notificationTime: { fontSize: 12, color: '#999' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3', marginLeft: 8, marginTop: 4 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
});
