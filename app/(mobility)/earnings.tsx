// app/(mobility)/earnings.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

export default function MobilityEarningsScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [refreshing, setRefreshing] = useState(false);

    const { data: earningsData, isLoading } = useQuery({
        queryKey: ['mobility', 'earnings', selectedPeriod],
        queryFn: () => apiClient.get(`mobility/earnings/?period=${selectedPeriod}`),
    });

    const earnings = earningsData?.summary || { total: 0, trips: 0, averagePerTrip: 0, distance: 0 };

    const onRefresh = async () => { setRefreshing(true); setRefreshing(false); };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}>
                <View style={styles.header}>
                    <Text style={styles.title}>Ganancias</Text>
                    <View style={styles.periodSelector}>
                        <TouchableOpacity style={[styles.periodButton, selectedPeriod === 'today' && styles.activePeriod]} onPress={() => setSelectedPeriod('today')}><Text style={[styles.periodText, selectedPeriod === 'today' && styles.activePeriodText]}>Hoy</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriod]} onPress={() => setSelectedPeriod('week')}><Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>Semana</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriod]} onPress={() => setSelectedPeriod('month')}><Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>Mes</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.mainCard}>
                    <Text style={styles.mainLabel}>Total ganado</Text>
                    <Text style={styles.mainValue}>${earnings.total.toFixed(2)}</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Icon name="directions-car" size={24} color="#2196F3" />
                        <Text style={styles.statValue}>{earnings.trips}</Text>
                        <Text style={styles.statLabel}>Viajes</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="trending-up" size={24} color="#4CAF50" />
                        <Text style={styles.statValue}>${earnings.averagePerTrip.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Promedio</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="map" size={24} color="#FF9800" />
                        <Text style={styles.statValue}>{earnings.distance.toFixed(1)} km</Text>
                        <Text style={styles.statLabel}>Distancia</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#2196F3', padding: 20, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    periodSelector: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 },
    periodButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    activePeriod: { backgroundColor: '#fff' },
    periodText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    activePeriodText: { color: '#2196F3' },
    mainCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, padding: 24, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    mainLabel: { fontSize: 14, color: '#666' },
    mainValue: { fontSize: 36, fontWeight: 'bold', color: '#4CAF50', marginTop: 8 },
    statsGrid: { flexDirection: 'row', padding: 16, marginTop: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});
