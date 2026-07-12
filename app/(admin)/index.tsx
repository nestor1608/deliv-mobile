// app/(admin)/index.tsx
import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';
import { AuthContext } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

const FALLBACK_DATA = {
    total_revenue: 0, total_commission: 0, total_orders: 0,
    active_vendors: 0, active_delivery: 0, active_drivers: 0,
    total_customers: 0, total_users: 0,
    pending_orders: 0, orders_today: 0, revenue_today: 0,
    total_vendors: 0, total_trips: 0, growth_percentage: 0,
    orders_by_status: [] as { status: string; count: number }[],
    daily_stats: [] as { date: string; revenue: number; orders: number }[],
};

export default function AdminDashboardScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [days] = useState(30);
    const { logout } = useContext(AuthContext);

    const { data, refetch, isLoading, error } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: () => apiClient.get(`admin/dashboard/?days=${days}`),
        retry: 1,
        // Use fallback when API fails
        placeholderData: FALLBACK_DATA,
    });

    const dashboardData = (data as any) || FALLBACK_DATA;

    const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

    // If error, also show retry + logout but WITH data (placeholder)
    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <Text style={styles.title}>Dashboard Administrativo</Text>

            {error && (
                <View style={{ backgroundColor: '#FFF3CD', padding: 12, margin: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FFEAA7' }}>
                    <Text style={{ color: '#856404', marginBottom: 8 }}>No se pudieron cargar datos actualizados</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => refetch()} style={{ padding: 8, backgroundColor: '#2196F3', borderRadius: 6 }}>
                            <Text style={{ color: '#FFF', fontSize: 12 }}>Reintentar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => logout()} style={{ padding: 8, backgroundColor: '#F44336', borderRadius: 6 }}>
                            <Text style={{ color: '#FFF', fontSize: 12 }}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* KPI Cards */}
            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.kpiValue}>${Number(dashboardData.total_revenue || 0).toLocaleString()}</Text>
                    <Text style={styles.kpiLabel}>Ingresos (30d)</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: '#2196F3' }]}>
                    <Text style={styles.kpiValue}>{dashboardData.total_orders || 0}</Text>
                    <Text style={styles.kpiLabel}>Pedidos (30d)</Text>
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.kpiValue}>{dashboardData.active_vendors || 0}</Text>
                    <Text style={styles.kpiLabel}>Comercios Activos</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: '#9C27B0' }]}>
                    <Text style={styles.kpiValue}>{dashboardData.active_delivery || 0}</Text>
                    <Text style={styles.kpiLabel}>Repartidores</Text>
                </View>
            </View>

            {/* Orders by status */}
            {dashboardData.orders_by_status?.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pedidos por Estado</Text>
                    {dashboardData.orders_by_status.map((item: any) => (
                        <View key={item.status} style={styles.statusRow}>
                            <Text style={styles.statusLabel}>{item.status}</Text>
                            <View style={[styles.statusBar, { width: `${Math.min(100, (item.count / Math.max(...dashboardData.orders_by_status.map((s: any) => s.count), 1)) * 100)}%` }]} />
                            <Text style={styles.statusCount}>{item.count}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', padding: 20, paddingBottom: 10 },
    kpiRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    kpiCard: { flex: 1, padding: 16, borderRadius: 12, marginHorizontal: 4 },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    kpiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
    section: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statusLabel: { width: 100, fontSize: 14, color: '#666' },
    statusBar: { height: 20, backgroundColor: '#4CAF50', borderRadius: 4, opacity: 0.7 },
    statusCount: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 8 },
});
