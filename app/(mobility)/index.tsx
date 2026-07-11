// app/(mobility)/index.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Switch, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

export default function MobilityDashboardScreen() {
    const router = useRouter();
    const { userData } = useContext(AuthContext);
    const [isOnline, setIsOnline] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();

    const { data: dashboardData } = useQuery({
        queryKey: ['mobility', 'dashboard'],
        queryFn: () => apiClient.get<{ today_stats?: { trips: number; earnings: number; distance: number; rating: number; onlineTime: number } }>('api/mobility/drivers/dashboard/'),
    });

    const toggleMutation = useMutation({
        mutationFn: () => apiClient.post('mobility/drivers/toggle-online/'),
        onSuccess: () => {
            setIsOnline(!isOnline);
            queryClient.invalidateQueries({ queryKey: ['mobility', 'dashboard'] });
        },
    });

    const todayStats = dashboardData?.today_stats || { trips: 0, earnings: 0, distance: 0, rating: 0, onlineTime: 0 };

    const onRefresh = async () => { setRefreshing(true); setRefreshing(false); };

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}>
            <View style={styles.header}>
                <Text style={styles.title}>Panel de Conductor</Text>
                <View style={styles.onlineToggle}>
                    <Text style={styles.onlineText}>{isOnline ? 'En línea' : 'Fuera de línea'}</Text>
                    <Switch value={isOnline} onValueChange={() => toggleMutation.mutate()} trackColor={{ false: '#767577', true: '#81b0ff' }} thumbColor={isOnline ? '#2196F3' : '#f4f3f4'} />
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Icon name="directions-car" size={24} color="#2196F3" />
                    <Text style={styles.statValue}>{todayStats.trips}</Text>
                    <Text style={styles.statLabel}>Viajes hoy</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="monetization-on" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>${todayStats.earnings.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Ganado hoy</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="star" size={24} color="#FFC107" />
                    <Text style={styles.statValue}>{todayStats.rating || '4.8'}</Text>
                    <Text style={styles.statLabel}>Calificación</Text>
                </View>
            </View>

            <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/history')}>
                        <Icon name="history" size={24} color="#2196F3" />
                        <Text style={styles.actionText}>Historial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/earnings')}>
                        <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
                        <Text style={styles.actionText}>Ganancias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/notifications')}>
                        <Icon name="notifications" size={24} color="#FF9800" />
                        <Text style={styles.actionText}>Notificaciones</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#2196F3', padding: 20, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 8 },
    onlineText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    statsContainer: { flexDirection: 'row', padding: 16, marginTop: -20 },
    statCard: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
    quickActions: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionButton: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center' },
    actionText: { fontSize: 12, color: '#333', marginTop: 8, textAlign: 'center' },
});
