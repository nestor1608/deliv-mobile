// app/(mobility)/settings.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';

export default function MobilitySettingsScreen() {
    const { logout } = useContext(AuthContext);
    const [settings, setSettings] = useState({
        notifications: { newTripRequests: true, tripUpdates: true, earnings: true, sound: true, vibration: true },
        privacy: { shareLocationWithPassengers: true, showProfileToPassengers: true },
        preferences: { autoAcceptTrips: false },
    });

    const handleLogout = () => {
        Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notificaciones</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Nuevas solicitudes</Text>
                        <Switch value={settings.notifications.newTripRequests} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, newTripRequests: v } })} />
                    </View>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Actualizaciones</Text>
                        <Switch value={settings.notifications.tripUpdates} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, tripUpdates: v } })} />
                    </View>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Sonido</Text>
                        <Switch value={settings.notifications.sound} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, sound: v } })} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacidad</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Compartir ubicación</Text>
                        <Switch value={settings.privacy.shareLocationWithPassengers} onValueChange={(v) => setSettings({ ...settings, privacy: { ...settings.privacy, shareLocationWithPassengers: v } })} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferencias</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Auto-aceptar viajes</Text>
                        <Switch value={settings.preferences.autoAcceptTrips} onValueChange={(v) => setSettings({ ...settings, preferences: { ...settings.preferences, autoAcceptTrips: v } })} />
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="exit-to-app" size={20} color="#f44336" />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollView: { flex: 1 },
    section: { backgroundColor: '#fff', marginTop: 20, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    settingLabel: { fontSize: 16, color: '#333' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f44336' },
    logoutText: { color: '#f44336', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
