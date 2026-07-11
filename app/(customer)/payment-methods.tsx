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

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedType, setSelectedType] = useState('card');
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        alias: '',
        cbu: '',
        bank: '',
    });

    const paymentTypes = [
        {
            id: 'card',
            name: 'Tarjeta de Crédito/Débito',
            icon: 'credit-card',
            description: 'Visa, Mastercard, American Express'
        },
        {
            id: 'mercadopago',
            name: 'Mercado Pago',
            icon: 'payment',
            description: 'Pago con tu cuenta de Mercado Pago'
        },
        {
            id: 'transfer',
            name: 'Transferencia Bancaria',
            icon: 'account-balance',
            description: 'CBU o Alias bancario'
        },
        {
            id: 'cash',
            name: 'Efectivo',
            icon: 'attach-money',
            description: 'Pago en efectivo al recibir'
        }
    ];

    // Query for payment methods (mock data)
    const { data: mockPaymentMethods = [], isLoading } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: () => {
            return Promise.resolve([
                {
                    id: 1,
                    type: 'card',
                    card_number: '**** **** **** 1234',
                    card_name: 'JUAN PEREZ',
                    card_type: 'Visa',
                    expiry_date: '12/25',
                    is_default: true,
                    created_at: '2025-01-10T10:00:00Z',
                },
                {
                    id: 2,
                    type: 'mercadopago',
                    email: 'juan.perez@email.com',
                    is_default: false,
                    created_at: '2025-01-08T14:30:00Z',
                },
                {
                    id: 3,
                    type: 'transfer',
                    bank: 'Banco Nación',
                    alias: 'juan.perez.mp',
                    cbu: '0110****0004567890',
                    is_default: false,
                    created_at: '2025-01-05T09:15:00Z',
                },
            ]);
        },
        staleTime: Infinity,
    });

    // Handle side effects from query data (useQuery v5 does not support onSuccess)
    const prevMockPaymentMethodsRef = useRef(mockPaymentMethods);
    useEffect(() => {
        if (mockPaymentMethods && mockPaymentMethods !== prevMockPaymentMethodsRef.current) {
            setPaymentMethods(mockPaymentMethods);
            prevMockPaymentMethodsRef.current = mockPaymentMethods;
        }
    }, [mockPaymentMethods]);

    const loading = isLoading;

    const getPaymentTypeInfo = (type) => {
        return paymentTypes.find(t => t.id === type) || paymentTypes[0];
    };

    const getCardType = (cardNumber) => {
        const number = cardNumber.replace(/\s/g, '');
        if (number.startsWith('4')) return 'Visa';
        if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
        if (number.startsWith('3')) return 'American Express';
        return 'Tarjeta';
    };

    const formatCardNumber = (text) => {
        const cleaned = text.replace(/\s/g, '');
        const match = cleaned.match(/.{1,4}/g);
        return match ? match.join(' ') : cleaned;
    };

    const formatExpiryDate = (text) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        return cleaned;
    };

    const handleAddPaymentMethod = () => {
        setSelectedType('card');
        setFormData({
            cardNumber: '',
            cardName: '',
            expiryDate: '',
            cvv: '',
            alias: '',
            cbu: '',
            bank: '',
        });
        setShowAddModal(true);
    };

    const handleDeletePaymentMethod = (method) => {
        Alert.alert(
            'Eliminar método de pago',
            '¿Estás seguro de que quieres eliminar este método de pago?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setPaymentMethods(prev => prev.filter(pm => pm.id !== method.id));
                    }
                }
            ]
        );
    };

    const handleSetDefault = async (method) => {
        setPaymentMethods(prev =>
            prev.map(pm => ({
                ...pm,
                is_default: pm.id === method.id
            }))
        );
        Alert.alert('Éxito', 'Método de pago por defecto actualizado');
    };

    const validateCardForm = () => {
        if (!formData.cardNumber.replace(/\s/g, '') || formData.cardNumber.replace(/\s/g, '').length < 13) {
            Alert.alert('Error', 'Número de tarjeta inválido');
            return false;
        }
        if (!formData.cardName.trim()) {
            Alert.alert('Error', 'Nombre del titular es obligatorio');
            return false;
        }
        if (!formData.expiryDate || formData.expiryDate.length !== 5) {
            Alert.alert('Error', 'Fecha de vencimiento inválida');
            return false;
        }
        if (!formData.cvv || formData.cvv.length < 3) {
            Alert.alert('Error', 'CVV inválido');
            return false;
        }
        return true;
    };

    const validateTransferForm = () => {
        if (!formData.bank.trim()) {
            Alert.alert('Error', 'Banco es obligatorio');
            return false;
        }
        if (!formData.alias.trim() && !formData.cbu.trim()) {
            Alert.alert('Error', 'Alias o CBU es obligatorio');
            return false;
        }
        return true;
    };

    const handleSavePaymentMethod = async () => {
        let isValid = false;

        switch (selectedType) {
            case 'card':
                isValid = validateCardForm();
                break;
            case 'transfer':
                isValid = validateTransferForm();
                break;
            case 'mercadopago':
            case 'cash':
                isValid = true;
                break;
            default:
                isValid = false;
        }

        if (!isValid) return;

        try {
            let newPaymentMethod;

            switch (selectedType) {
                case 'card':
                    newPaymentMethod = {
                        id: Date.now(),
                        type: 'card',
                        card_number: '**** **** **** ' + formData.cardNumber.slice(-4),
                        card_name: formData.cardName.toUpperCase(),
                        card_type: getCardType(formData.cardNumber),
                        expiry_date: formData.expiryDate,
                        is_default: paymentMethods.length === 0,
                        created_at: new Date().toISOString(),
                    };
                    break;

                case 'transfer':
                    newPaymentMethod = {
                        id: Date.now(),
                        type: 'transfer',
                        bank: formData.bank,
                        alias: formData.alias,
                        cbu: formData.cbu ? '**** **** ****' + formData.cbu.slice(-4) : '',
                        is_default: paymentMethods.length === 0,
                        created_at: new Date().toISOString(),
                    };
                    break;

                case 'mercadopago':
                    newPaymentMethod = {
                        id: Date.now(),
                        type: 'mercadopago',
                        email: 'tu.email@ejemplo.com',
                        is_default: paymentMethods.length === 0,
                        created_at: new Date().toISOString(),
                    };
                    break;

                case 'cash':
                    if (paymentMethods.some(pm => pm.type === 'cash')) {
                        Alert.alert('Error', 'Ya tienes efectivo como método de pago');
                        return;
                    }
                    newPaymentMethod = {
                        id: Date.now(),
                        type: 'cash',
                        is_default: paymentMethods.length === 0,
                        created_at: new Date().toISOString(),
                    };
                    break;
            }

            setPaymentMethods(prev => [...prev, newPaymentMethod]);
            setShowAddModal(false);
            Alert.alert('Éxito', 'Método de pago agregado correctamente');
        } catch (error) {
            console.error('Error saving payment method:', error);
            Alert.alert('Error', 'No se pudo guardar el método de pago');
        }
    };

    const renderPaymentMethodForm = () => {
        switch (selectedType) {
            case 'card':
                return (
                    <>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Número de tarjeta *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cardNumber}
                                onChangeText={(text) => setFormData({
                                    ...formData,
                                    cardNumber: formatCardNumber(text)
                                })}
                                placeholder="1234 5678 9012 3456"
                                keyboardType="numeric"
                                maxLength={19}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nombre del titular *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cardName}
                                onChangeText={(text) => setFormData({
                                    ...formData,
                                    cardName: text.toUpperCase()
                                })}
                                placeholder="JUAN PEREZ"
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Vencimiento *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.expiryDate}
                                    onChangeText={(text) => setFormData({
                                        ...formData,
                                        expiryDate: formatExpiryDate(text)
                                    })}
                                    placeholder="MM/AA"
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </View>

                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>CVV *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.cvv}
                                    onChangeText={(text) => setFormData({
                                        ...formData,
                                        cvv: text.replace(/\D/g, '')
                                    })}
                                    placeholder="123"
                                    keyboardType="numeric"
                                    maxLength={4}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    </>
                );

            case 'transfer':
                return (
                    <>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Banco *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.bank}
                                onChangeText={(text) => setFormData({...formData, bank: text})}
                                placeholder="Ej: Banco Nación, Banco Galicia..."
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Alias</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.alias}
                                onChangeText={(text) => setFormData({...formData, alias: text})}
                                placeholder="tu.alias.mp"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>CBU (opcional si tienes alias)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.cbu}
                                onChangeText={(text) => setFormData({
                                    ...formData,
                                    cbu: text.replace(/\D/g, '')
                                })}
                                placeholder="1234567890123456789012"
                                keyboardType="numeric"
                                maxLength={22}
                            />
                        </View>
                    </>
                );

            case 'mercadopago':
                return (
                    <View style={styles.infoContainer}>
                        <Icon name="info" size={24} color="#2196F3" />
                        <Text style={styles.infoText}>
                            Al confirmar, serás redirigido a Mercado Pago para autorizar el pago.
                        </Text>
                    </View>
                );

            case 'cash':
                return (
                    <View style={styles.infoContainer}>
                        <Icon name="info" size={24} color="#4CAF50" />
                        <Text style={styles.infoText}>
                            Podrás pagar en efectivo al momento de recibir tu pedido.
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    const renderAddModal = () => (
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
                    <Text style={styles.modalTitle}>Agregar Método de Pago</Text>
                    <TouchableOpacity
                        onPress={handleSavePaymentMethod}
                        style={styles.saveButton}
                    >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    {/* Selector de tipo */}
                    <View style={styles.typeSelector}>
                        {paymentTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeOption,
                                    selectedType === type.id && styles.selectedTypeOption
                                ]}
                                onPress={() => setSelectedType(type.id)}
                            >
                                <Icon
                                    name={type.icon}
                                    size={24}
                                    color={selectedType === type.id ? '#2196F3' : '#666'}
                                />
                                <View style={styles.typeInfo}>
                                    <Text style={[
                                        styles.typeName,
                                        selectedType === type.id && styles.selectedTypeName
                                    ]}>
                                        {type.name}
                                    </Text>
                                    <Text style={styles.typeDescription}>{type.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Formulario específico del tipo */}
                    <View style={styles.formContainer}>
                        {renderPaymentMethodForm()}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );

    const renderPaymentMethod = ({ item }) => {
        const typeInfo = getPaymentTypeInfo(item.type);

        return (
            <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                    <View style={styles.paymentInfo}>
                        <View style={styles.paymentLabelContainer}>
                            <Icon name={typeInfo.icon} size={24} color="#666" />
                            <View style={styles.paymentTextInfo}>
                                <Text style={styles.paymentName}>{typeInfo.name}</Text>
                                {item.type === 'card' && (
                                    <>
                                        <Text style={styles.paymentDetails}>
                                            {item.card_type} {item.card_number}
                                        </Text>
                                        <Text style={styles.paymentSubDetails}>
                                            {item.card_name}  - Vence {item.expiry_date}
                                        </Text>
                                    </>
                                )}
                                {item.type === 'mercadopago' && (
                                    <Text style={styles.paymentDetails}>{item.email}</Text>
                                )}
                                {item.type === 'transfer' && (
                                    <>
                                        <Text style={styles.paymentDetails}>{item.bank}</Text>
                                        <Text style={styles.paymentSubDetails}>
                                            {item.alias && `Alias: ${item.alias}`}
                                            {item.cbu && `  CBU: ${item.cbu}`}
                                        </Text>
                                    </>
                                )}
                                {item.type === 'cash' && (
                                    <Text style={styles.paymentDetails}>Pago en efectivo</Text>
                                )}
                            </View>
                            {item.is_default && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultBadgeText}>Por defecto</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <View style={styles.paymentActions}>
                    {!item.is_default && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleSetDefault(item)}
                        >
                            <Icon name="star-border" size={16} color="#666" />
                            <Text style={styles.actionButtonText}>Por defecto</Text>
                        </TouchableOpacity>
                    )}

                    {item.type !== 'cash' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeletePaymentMethod(item)}
                        >
                            <Icon name="delete" size={16} color="#F44336" />
                            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
                                Eliminar
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="payment" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>No tienes métodos de pago</Text>
            <Text style={styles.emptySubtitle}>
                Agrega un método de pago para realizar tus pedidos
            </Text>
            <TouchableOpacity
                style={styles.addFirstPaymentButton}
                onPress={handleAddPaymentMethod}
            >
                <Text style={styles.addFirstPaymentText}>Agregar método de pago</Text>
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
                <Text style={styles.headerTitle}>Métodos de Pago</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddPaymentMethod}
                >
                    <Icon name="add" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            {/* Payment Methods List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>Cargando métodos de pago...</Text>
                </View>
            ) : (
                <FlatList
                    data={paymentMethods}
                    renderItem={renderPaymentMethod}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    contentContainerStyle={paymentMethods.length === 0 ? styles.emptyList : styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                />
            )}

            {renderAddModal()}
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
    paymentCard: {
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
    paymentHeader: {
        marginBottom: 12,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentTextInfo: {
        flex: 1,
        marginLeft: 12,
    },
    paymentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    paymentDetails: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    paymentSubDetails: {
        fontSize: 12,
        color: '#666',
    },
    defaultBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    defaultBadgeText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: 'bold',
    },
    paymentActions: {
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
    addFirstPaymentButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstPaymentText: {
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
    },
    typeSelector: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        marginBottom: 8,
    },
    selectedTypeOption: {
        borderColor: '#2196F3',
        backgroundColor: '#F3F8FF',
    },
    typeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    typeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectedTypeName: {
        color: '#2196F3',
    },
    typeDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    formGroup: {
        marginBottom: 16,
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
    },
    row: {
        flexDirection: 'row',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});
