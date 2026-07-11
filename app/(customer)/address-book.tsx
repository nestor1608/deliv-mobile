import React, { useState, useContext, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';
import * as Location from 'expo-location';

export default function AddressBookScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [addresses, setAddresses] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        label: '',
        address: '',
        reference: '',
        coordinates: null,
    });

    const addressTypes = [
        { id: 'home', label: 'Casa', icon: 'home' },
        { id: 'work', label: 'Trabajo', icon: 'work' },
        { id: 'other', label: 'Otro', icon: 'location-on' },
    ];

    // Query for addresses (mock data)
    const { data: mockAddresses = [], isLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: () => {
            return Promise.resolve([
                {
                    id: 1,
                    type: 'home',
                    label: 'Casa',
                    address: 'Av. Corrientes 1234, Buenos Aires',
                    reference: 'Portón azul, timbre 2B',
                    coordinates: {
                        latitude: -34.6037,
                        longitude: -58.3816,
                    },
                    is_default: true,
                    created_at: '2025-01-10T10:00:00Z',
                },
                {
                    id: 2,
                    type: 'work',
                    label: 'Oficina',
                    address: 'Puerto Madero, Buenos Aires',
                    reference: 'Torre 3, piso 15',
                    coordinates: {
                        latitude: -34.6118,
                        longitude: -58.3639,
                    },
                    is_default: false,
                    created_at: '2025-01-08T14:30:00Z',
                },
            ]);
        },
        staleTime: Infinity,
    });

    // Handle side effects from query data (useQuery v5 does not support onSuccess)
    const prevMockAddressesRef = useRef(mockAddresses);
    useEffect(() => {
        if (mockAddresses && mockAddresses !== prevMockAddressesRef.current) {
            setAddresses(mockAddresses);
            prevMockAddressesRef.current = mockAddresses;
        }
    }, [mockAddresses]);

    const loading = isLoading;

    const getAddressTypeInfo = (type) => {
        return addressTypes.find(t => t.id === type) || addressTypes[2];
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        setFormData({
            label: '',
            address: '',
            reference: '',
            coordinates: null,
        });
        setShowAddModal(true);
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setFormData({
            label: address.label,
            address: address.address,
            reference: address.reference,
            coordinates: address.coordinates,
        });
        setShowAddModal(true);
    };

    const handleDeleteAddress = (address) => {
        Alert.alert(
            'Eliminar dirección',
            `¿Estás seguro de que quieres eliminar "${address.label}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setAddresses(prev => prev.filter(addr => addr.id !== address.id));
                    }
                }
            ]
        );
    };

    const handleSetDefault = async (address) => {
        setAddresses(prev =>
            prev.map(addr => ({
                ...addr,
                is_default: addr.id === address.id
            }))
        );
        Alert.alert('Éxito', 'Dirección por defecto actualizada');
    };

    const handleUseCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Error', 'Se necesitan permisos de ubicación');
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            const [result] = await Location.reverseGeocodeAsync(coords);
            if (result) {
                const address = [
                    result.street,
                    result.streetNumber,
                    result.district,
                    result.city
                ].filter(Boolean).join(' ');
                setFormData(prev => ({
                    ...prev,
                    address,
                    coordinates: coords,
                }));
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación actual');
        }
    };

    const handleSaveAddress = async () => {
        if (!formData.label.trim() || !formData.address.trim()) {
            Alert.alert('Error', 'Nombre y dirección son obligatorios');
            return;
        }
        try {
            const addressData = {
                label: formData.label.trim(),
                address: formData.address.trim(),
                reference: formData.reference.trim(),
                coordinates: formData.coordinates,
                type: 'other',
            };

            if (editingAddress) {
                setAddresses(prev =>
                    prev.map(addr =>
                        addr.id === editingAddress.id
                            ? { ...addr, ...addressData }
                            : addr
                    )
                );
                Alert.alert('Éxito', 'Dirección actualizada correctamente');
            } else {
                const newAddress = {
                    id: Date.now(),
                    ...addressData,
                    is_default: addresses.length === 0,
                    created_at: new Date().toISOString(),
                };
                setAddresses(prev => [...prev, newAddress]);
                Alert.alert('Éxito', 'Dirección agregada correctamente');
            }
            setShowAddModal(false);
        } catch (error) {
            console.error('Error saving address:', error);
            Alert.alert('Error', 'No se pudo guardar la dirección');
        }
    };

    const handleSelectFromMap = () => {
        setShowAddModal(false);
        router.push({
            pathname: '/location-picker',
            params: {
                onLocationSelected: '(locationData, fullAddress) => {}'
            }
        });
    };

    const renderAddressModal = () => (
        <Modal
            visible={showAddModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowAddModal(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={() => setShowAddModal(false)}
                        style={styles.modalCloseButton}
                    >
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleSaveAddress}
                        style={styles.saveButton}
                    >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nombre de la dirección *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.label}
                            onChangeText={(text) => setFormData({...formData, label: text})}
                            placeholder="Ej: Casa, Trabajo, Gimnasio..."
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dirección *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.address}
                            onChangeText={(text) => setFormData({...formData, address: text})}
                            placeholder="Ingresa la dirección completa"
                            multiline
                        />

                        <View style={styles.locationButtons}>
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={handleUseCurrentLocation}
                            >
                                <Icon name="my-location" size={16} color="#2196F3" />
                                <Text style={styles.locationButtonText}>Usar ubicación actual</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={handleSelectFromMap}
                            >
                                <Icon name="map" size={16} color="#2196F3" />
                                <Text style={styles.locationButtonText}>Seleccionar en mapa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Referencia (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.reference}
                            onChangeText={(text) => setFormData({...formData, reference: text})}
                            placeholder="Ej: Portón verde, timbre 2A, al lado del kiosco..."
                            multiline
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );

    const renderAddress = ({ item }) => {
        const typeInfo = getAddressTypeInfo(item.type);

        return (
            <View style={styles.addressCard}>
                <View style={styles.addressHeader}>
                    <View style={styles.addressInfo}>
                        <View style={styles.addressLabelContainer}>
                            <Icon name={typeInfo.icon} size={20} color="#666" />
                            <Text style={styles.addressLabel}>{item.label}</Text>
                            {item.is_default && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultBadgeText}>Por defecto</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.addressText}>{item.address}</Text>
                        {item.reference && (
                            <Text style={styles.addressReference}>{item.reference}</Text>
                        )}
                    </View>
                </View>
                <View style={styles.addressActions}>
                    {!item.is_default && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleSetDefault(item)}
                        >
                            <Icon name="star-border" size={16} color="#666" />
                            <Text style={styles.actionButtonText}>Por defecto</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditAddress(item)}
                    >
                        <Icon name="edit" size={16} color="#2196F3" />
                        <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteAddress(item)}
                    >
                        <Icon name="delete" size={16} color="#F44336" />
                        <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="location-off" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>No tienes direcciones guardadas</Text>
            <Text style={styles.emptySubtitle}>
                Agrega direcciones para hacer tus pedidos más rápido
            </Text>
            <TouchableOpacity
                style={styles.addFirstAddressButton}
                onPress={handleAddAddress}
            >
                <Text style={styles.addFirstAddressText}>Agregar primera dirección</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Direcciones</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddAddress}
                >
                    <Icon name="add" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            {/* Addresses List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>Cargando direcciones...</Text>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    contentContainerStyle={addresses.length === 0 ? styles.emptyList : styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                />
            )}

            {renderAddressModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    addButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 8,
    },
    emptyList: {
        flex: 1,
    },
    addressCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addressHeader: {
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    defaultBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    defaultBadgeText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: 'bold',
    },
    addressText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
    addressReference: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    addressActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 12,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    addFirstAddressButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstAddressText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    saveButtonText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FFF',
        minHeight: 48,
    },
    locationButtons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#F0F8FF',
        marginRight: 8,
    },
    locationButtonText: {
        fontSize: 12,
        color: '#2196F3',
        marginLeft: 4,
        fontWeight: '500',
    },
});
