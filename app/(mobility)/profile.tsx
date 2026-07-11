// app/(mobility)/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Image } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityProfileScreen() {
    const { data: driverProfile, isLoading } = useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: () => apiClient.get('api/mobility/drivers/me/'),
    });

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (isLoading || !driverProfile) {
        return <View style={styles.loadingContainer}><Text>Cargando perfil...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.profileImagePlaceholder}>
                        <Icon name="person" size={40} color="#999" />
                    </View>
                    <Text style={styles.profileName}>{driverProfile.user_info.first_name} {driverProfile.user_info.last_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.statusText}>Aprobado</Text>
                    </View>
                    <View style={styles.ratingContainer}>
                        <Icon name="star" size={20} color="#FFC107" />
                        <Text style={styles.ratingText}>{driverProfile.rating}</Text>
                        <Text style={styles.ratingSubtext}>({driverProfile.total_trips} viajes)</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statsCard, { borderLeftColor: '#2196F3' }]}>
                            <Text style={styles.statsValue}>{driverProfile.total_trips}</Text>
                            <Text style={styles.statsTitle}>Viajes totales</Text>
                        </View>
                        <View style={[styles.statsCard, { borderLeftColor: '#4CAF50' }]}>
                            <Text style={styles.statsValue}>${driverProfile.total_earnings}</Text>
                            <Text style={styles.statsTitle}>Ganancias totales</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información personal</Text>
                    <View style={styles.profileItem}>
                        <Icon name="person" size={20} color="#2196F3" />
                        <Text style={styles.profileItemText}>{driverProfile.user_info.first_name} {driverProfile.user_info.last_name}</Text>
                    </View>
                    <View style={styles.profileItem}>
                        <Icon name="email" size={20} color="#2196F3" />
                        <Text style={styles.profileItemText}>{driverProfile.user_info.email}</Text>
                    </View>
                    <View style={styles.profileItem}>
                        <Icon name="phone" size={20} color="#2196F3" />
                        <Text style={styles.profileItemText}>{driverProfile.user_info.phone_number}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vehículo</Text>
                    <View style={styles.profileItem}>
                        <Icon name="directions-car" size={20} color="#2196F3" />
                        <Text style={styles.profileItemText}>{driverProfile.vehicle_brand} {driverProfile.vehicle_model}</Text>
                    </View>
                    <View style={styles.profileItem}>
                        <Icon name="confirmation-number" size={20} color="#2196F3" />
                        <Text style={styles.profileItemText}>{driverProfile.vehicle_plate}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    profileHeader: { backgroundColor: '#2196F3', alignItems: 'center', paddingVertical: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 16 },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    ratingText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 4 },
    ratingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 8 },
    section: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statsCard: { width: '48%', backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, borderLeftWidth: 4 },
    statsValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statsTitle: { fontSize: 11, color: '#666', marginTop: 4 },
    profileItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    profileItemText: { fontSize: 16, color: '#333', marginLeft: 12 },
});
