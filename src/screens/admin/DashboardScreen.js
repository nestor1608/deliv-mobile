import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/?days=${days}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  }, [userToken, API_BASE_URL, days]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Text>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Dashboard Administrativo</Text>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.kpiValue}>${(data.total_revenue || 0).toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Ingresos (30d)</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.kpiValue}>{data.total_orders || 0}</Text>
          <Text style={styles.kpiLabel}>Pedidos (30d)</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.kpiValue}>{data.active_vendors || 0}</Text>
          <Text style={styles.kpiLabel}>Comercios Activos</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#9C27B0' }]}>
          <Text style={styles.kpiValue}>{data.active_delivery || 0}</Text>
          <Text style={styles.kpiLabel}>Repartidores</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#E91E63' }]}>
          <Text style={styles.kpiValue}>{data.active_drivers || 0}</Text>
          <Text style={styles.kpiLabel}>Conductores</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#607D8B' }]}>
          <Text style={styles.kpiValue}>${(data.total_commission || 0).toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Comisiones</Text>
        </View>
      </View>

      {/* Daily Stats */}
      <Text style={styles.sectionTitle}>Últimos 7 días</Text>
      {(data.daily_stats || []).map((day) => (
        <View key={day.date} style={styles.dailyRow}>
          <Text style={styles.dailyDate}>{new Date(day.date).toLocaleDateString('es-AR')}</Text>
          <Text style={styles.dailyValue}>${day.revenue.toLocaleString()} / {day.orders} pedidos</Text>
        </View>
      ))}

      {/* Top Vendors */}
      <Text style={styles.sectionTitle}>Top Comercios</Text>
      {(data.top_vendors || []).map((v, i) => (
        <View key={i} style={styles.vendorRow}>
          <Text style={styles.vendorRank}>#{i + 1}</Text>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{v.vendor__business_name}</Text>
            <Text style={styles.vendorStats}>{v.count} pedidos - ${v.total?.toFixed(2)}</Text>
          </View>
        </View>
      ))}

      {/* Platform Totals */}
      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>Totales de Plataforma</Text>
        <Text style={styles.totalValue}>${(data.total_platform_revenue || 0).toLocaleString()}</Text>
        <Text style={styles.totalLabel}>{data.total_platform_orders || 0} pedidos totales</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 20, paddingBottom: 10 },
  kpiRow: { flexDirection: 'row', padding: 10, gap: 10 },
  kpiCard: { flex: 1, padding: 20, borderRadius: 12, elevation: 3 },
  kpiValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  kpiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', padding: 20, paddingBottom: 10 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, marginBottom: 4 },
  dailyDate: { fontSize: 14, color: '#333' },
  dailyValue: { fontSize: 14, color: '#666' },
  vendorRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 8, marginBottom: 4 },
  vendorRank: { fontSize: 16, fontWeight: 'bold', color: '#2196F3', marginRight: 12 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 14, fontWeight: '600' },
  vendorStats: { fontSize: 12, color: '#666' },
  totalCard: { margin: 20, padding: 20, backgroundColor: '#1a237e', borderRadius: 12, alignItems: 'center' },
  totalTitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  totalValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
