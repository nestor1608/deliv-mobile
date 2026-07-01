import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeliveryProfileScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi Perfil</Text>

            <View style={styles.profileInfo}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>Juan Pérez</Text>

                <Text style={styles.label}>Vehículo:</Text>
                <Text style={styles.value}>Moto - ABC123</Text>

                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>+1 234 567 890</Text>

                <Text style={styles.label}>Calificación:</Text>
                <Text style={styles.value}>4.8 ★ (120 reseñas)</Text>
            </View>
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