// app/(mobility)/history.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityHistoryScreen() {
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const { data: tripsData, isLoading, refetch } = useQuery({
        queryKey: ['mobility', 'history'],
        queryFn: () => apiClient.get('api/mobility/trips/?status=history'),
    });

    useEffect(() => { filterTrips(); }, [trips, searchQuery, statusFilter]);

    useEffect(() => {
        if (tripsData?.results) {
            setTrips(tripsData.results);
        }
    }, [tripsData]);

    const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

    const filterTrips = () => {
        let filtered = trips;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(trip => {
                if (statusFilter === 'completed') return trip.status === 'completed';
                if (statusFilter === 'cancelled') return trip.status.includes('cancelled');
                return true;
            });
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(trip => trip.trip_number.toLowerCase().includes(query) || trip.customer_info?.name.toLowerCase().includes(query));
        }
        setFilteredTrips(filtered);
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return '#4CAF50';
        if (status.includes('cancelled')) return '#f44336';
        return '#666';
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const renderTripCard = ({ item: trip }) => (
        <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <View>
                    <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
                    <Text style={styles.tripDate}>{formatDate(trip.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                    <Text style={styles.statusText}>{trip.status === 'completed' ? 'Completado' : 'Cancelado'}</Text>
                </View>
            </View>
            <View style={styles.tripRoute}>
                <View style={styles.routePoint}>
                    <Icon name="my-location" size={16} color="#4CAF50" />
                    <Text style={styles.routeAddress} numberOfLines={1}>{trip.pickup_address}</Text>
                </View>
                <View style={styles.routePoint}>
                    <Icon name="place" size={16} color="#f44336" />
                    <Text style={styles.routeAddress} numberOfLines={1}>{trip.destination_address}</Text>
                </View>
            </View>
            {trip.status === 'completed' && (
                <View style={styles.tripDetails}>
                    <View style={styles.tripDetail}><Icon name="directions" size={16} color="#2196F3" /><Text style={styles.tripDetailText}>{trip.actual_distance} km</Text></View>
                    <View style={styles.tripDetail}><Icon name="monetization-on" size={16} color="#4CAF50" /><Text style={styles.tripDetailText}>${trip.total_fare}</Text></View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput style={styles.searchInput} placeholder="Buscar..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#999" />
                </View>
            </View>
            <View style={styles.filtersContainer}>
                <TouchableOpacity style={[styles.filterButton, statusFilter === 'all' && styles.activeFilterButton]} onPress={() => setStatusFilter('all')}><Text style={[styles.filterButtonText, statusFilter === 'all' && styles.activeFilterButtonText]}>Todos ({trips.length})</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, statusFilter === 'completed' && styles.activeFilterButton]} onPress={() => setStatusFilter('completed')}><Text style={[styles.filterButtonText, statusFilter === 'completed' && styles.activeFilterButtonText]}>Completados ({trips.filter(t => t.status === 'completed').length})</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, statusFilter === 'cancelled' && styles.activeFilterButton]} onPress={() => setStatusFilter('cancelled')}><Text style={[styles.filterButtonText, statusFilter === 'cancelled' && styles.activeFilterButtonText]}>Cancelados ({trips.filter(t => t.status.includes('cancelled')).length})</Text></TouchableOpacity>
            </View>
            <FlatList data={filteredTrips} renderItem={renderTripCard} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.listContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />} ListEmptyComponent={<View style={styles.emptyState}><Icon name="history" size={64} color="#ccc" /><Text style={styles.emptyTitle}>No tienes historial</Text></View>} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#333', marginLeft: 8 },
    filtersContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    filterButton: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0' },
    activeFilterButton: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    filterButtonText: { fontSize: 14, color: '#666' },
    activeFilterButtonText: { color: '#fff', fontWeight: 'bold' },
    listContainer: { padding: 16, flexGrow: 1 },
    tripCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    tripNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    tripDate: { fontSize: 12, color: '#666', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    tripRoute: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    routeAddress: { fontSize: 14, color: '#333', marginLeft: 8, flex: 1 },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
    tripDetail: { flexDirection: 'row', alignItems: 'center' },
    tripDetailText: { fontSize: 12, color: '#666', marginLeft: 4, fontWeight: '500' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
});
