import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function DeliveryCostScreen() {
    const [baseCost, setBaseCost] = useState('5.00');
    const [costPerKm, setCostPerKm] = useState('1.50');

    const saveMutation = useMutation({
        mutationFn: (data: { base_cost: string; cost_per_km: string }) =>
            apiClient.post('delivery/cost-config/', data),
        onSuccess: () => {
            console.log('Cost config saved successfully');
        },
        onError: (error) => {
            console.error('Error saving cost config:', error);
        },
    });

    const handleSave = () => {
        saveMutation.mutate({ base_cost: baseCost, cost_per_km: costPerKm });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Configuración de Costos</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Costo base:</Text>
                <TextInput style={styles.input} value={baseCost} onChangeText={setBaseCost} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Costo por km:</Text>
                <TextInput style={styles.input} value={costPerKm} onChangeText={setCostPerKm} keyboardType="numeric" />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveMutation.isPending}>
                <Text style={styles.saveButtonText}>
                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    inputGroup: { marginBottom: 15 },
    label: { marginBottom: 5, fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontWeight: 'bold' }
});
