import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function DeliveryProfileScreen() {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: () => apiClient.get('api/delivery/profile/me/'),
    });

    if (isLoading || !profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Mi Perfil</Text>

                <View style={styles.profileInfo}>
                    <Text style={styles.label}>Nombre:</Text>
                    <Text style={styles.value}>{profile.name || 'Juan Pérez'}</Text>

                    <Text style={styles.label}>Vehículo:</Text>
                    <Text style={styles.value}>{profile.vehicle || 'Moto - ABC123'}</Text>

                    <Text style={styles.label}>Teléfono:</Text>
                    <Text style={styles.value}>{profile.phone || '+1 234 567 890'}</Text>

                    <Text style={styles.label}>Calificación:</Text>
                    <Text style={styles.value}>{profile.rating || '4.8'} ★ ({profile.total_rides || 120} reseñas)</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    profileInfo: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
    label: { fontWeight: 'bold', marginTop: 10 },
    value: { marginBottom: 10 }
});
