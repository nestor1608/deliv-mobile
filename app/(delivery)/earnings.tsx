// app/(delivery)/earnings.tsx — DeliveryEarningsScreen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

interface EarningsSummary {
  total: number;
  deliveries: number;
  averagePerDelivery: number;
  distance: number;
  hours: number;
  tips: number;
}

interface DailyEarning {
  date: string;
  total: number;
  deliveries: number;
}

interface EarningsData {
  summary: EarningsSummary;
  daily: DailyEarning[];
}

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

export default function DeliveryEarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodKey>('today');

  const { data, refetch, isFetching } = useQuery<EarningsData>({
    queryKey: ['delivery', 'earnings', selectedPeriod],
    queryFn: () => apiClient.get<EarningsData>(`delivery/earnings/?period=${selectedPeriod}`),
    placeholderData: {
      summary: {
        total: 85.50,
        deliveries: 6,
        averagePerDelivery: 14.25,
        distance: 45.2,
        hours: 4.5,
        tips: 12.50,
      },
      daily: [{ date: '2024-01-15', total: 85.50, deliveries: 6 }],
    },
  });

  const earnings = data?.summary ?? {
    total: 0,
    deliveries: 0,
    averagePerDelivery: 0,
    distance: 0,
    hours: 0,
    tips: 0,
  };
  const dailyEarnings = data?.daily ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[styles.periodButton, selectedPeriod === period.key && styles.selectedPeriodButton]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === period.key && styles.selectedPeriodButtonText]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>Ganancias totales</Text>
          <Text style={styles.mainValue}>${earnings.total.toFixed(2)}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="local-shipping" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{earnings.deliveries}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>${earnings.averagePerDelivery.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="place" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{earnings.distance.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="access-time" size={24} color="#9C27B0" />
            <Text style={styles.statValue}>{earnings.hours.toFixed(1)} h</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="card-giftcard" size={24} color="#4CAF50" />
            <Text style={styles.tipsTitle}>Propinas</Text>
          </View>
          <Text style={styles.tipsValue}>+${earnings.tips.toFixed(2)}</Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial diario</Text>
          {dailyEarnings.map((day, index) => (
            <View key={index} style={styles.dayRow}>
              <Text style={styles.dayDate}>{new Date(day.date).toLocaleDateString('es-ES')}</Text>
              <Text style={styles.dayDeliveries}>{day.deliveries} entregas</Text>
              <Text style={styles.dayTotal}>${day.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  periodSelector: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  periodButton: { paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#f5f5f5' },
  selectedPeriodButton: { backgroundColor: '#FF9800' },
  periodButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  selectedPeriodButtonText: { color: '#fff' },
  mainCard: { backgroundColor: '#4CAF50', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  mainLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  mainValue: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { width: '50%', padding: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tipsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center' },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  tipsValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  historySection: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dayDate: { fontSize: 14, color: '#333' },
  dayDeliveries: { fontSize: 14, color: '#666' },
  dayTotal: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
});
