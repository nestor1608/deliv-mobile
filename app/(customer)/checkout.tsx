import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    TextInput,
    Modal,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/services/apiClient';
import { paramToString } from '../../src/utils/params';

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderDataParam = paramToString(params.orderData);
    const insets = useSafeAreaInsets();

    const orderData = orderDataParam ? JSON.parse(orderDataParam) : null;

    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [locationData, setLocationData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('now');
    const [scheduledTime, setScheduledTime] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(30);

    const paymentMethods = [
        { id: 'cash', name: 'Efectivo', icon: 'attach-money' },
        { id: 'card', name: 'Tarjeta de crédito/débito', icon: 'credit-card' },
        { id: 'transfer', name: 'Transferencia bancaria', icon: 'account-balance' },
    ];

    const generateTimeSlots = (baseTime) => {
        const now = new Date();
        return [
            {
                id: 'now',
                label: 'Lo antes posible',
                time: `${baseTime} min`
            },
            {
                id: '1h',
                label: 'En 1 hora',
                time: new Date(now.getTime() + 60 * 60 * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            },
            {
                id: '2h',
                label: 'En 2 horas',
                time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            },
        ];
    };

    const timeSlots = generateTimeSlots(estimatedDeliveryTime);

    const placeOrderMutation = useMutation({
        mutationFn: (orderPayload: any) => apiClient.post('api/orders/', orderPayload),
        onSuccess: () => {
            Alert.alert(
                '¡Pedido realizado!',
                'Tu pedido ha sido confirmado. Puedes seguir el estado en la pantalla de seguimiento.',
                [
                    {
                        text: 'Seguir pedido',
                        onPress: () => router.replace('/order-tracking')
                    }
                ]
            );
        },
        onError: (error) => {
            Alert.alert('Error', error.message || 'No se pudo procesar el pedido. Intenta nuevamente.');
        },
    });

    const handlePlaceOrder = () => {
        if (!deliveryAddress.trim()) {
            Alert.alert('Error', 'Por favor ingresa una dirección de entrega');
            return;
        }
        if (!paymentMethod) {
            Alert.alert('Error', 'Por favor selecciona un método de pago');
            return;
        }

        placeOrderMutation.mutate({
            delivery_address: deliveryAddress,
            payment_method: paymentMethod,
            notes: deliveryNotes,
            delivery_time: deliveryTime,
            scheduled_time: scheduledTime,
        });
    };

    const handleSelectLocation = () => {
        router.push('/location-picker');
    };

    const renderPaymentModal = () => (
        <Modal
            visible={showPaymentModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPaymentModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.paymentModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Método de pago</Text>
                        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentOption,
                                paymentMethod === method.id && styles.selectedPayment
                            ]}
                            onPress={() => {
                                setPaymentMethod(method.id);
                                setShowPaymentModal(false);
                            }}
                        >
                            <Icon name={method.icon} size={24} color="#666" />
                            <Text style={styles.paymentText}>{method.name}</Text>
                            {paymentMethod === method.id && (
                                <Icon name="check" size={24} color="#4CAF50" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const renderTimeModal = () => (
        <Modal
            visible={showTimeModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowTimeModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.timeModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Horario de entrega</Text>
                        <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {timeSlots.map((slot) => (
                        <TouchableOpacity
                            key={slot.id}
                            style={[
                                styles.timeOption,
                                deliveryTime === slot.id && styles.selectedTime
                            ]}
                            onPress={() => {
                                setDeliveryTime(slot.id);
                                setShowTimeModal(false);
                            }}
                        >
                            <Text style={[
                                styles.timeLabel,
                                deliveryTime === slot.id && styles.selectedTimeText
                            ]}>
                                {slot.label}
                            </Text>
                            <Text style={[
                                styles.timeValue,
                                deliveryTime === slot.id && styles.selectedTimeText
                            ]}>
                                {slot.time}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={() => {
                            setShowTimeModal(false);
                            setShowDatePicker(true);
                        }}
                    >
                        <Icon name="calendar-today" size={20} color="#007BFF" />
                        <Text style={styles.scheduleButtonText}>Programar para otra fecha</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (!orderData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No hay datos del pedido</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.retryButtonText}>Volver al carrito</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Finalizar Compra</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Dirección de entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dirección de entrega</Text>
                    <TouchableOpacity
                        style={styles.addressCard}
                        onPress={handleSelectLocation}
                    >
                        <Icon name="location-on" size={24} color="#007BFF" />
                        <View style={styles.addressInfo}>
                            {deliveryAddress ? (
                                <>
                                    <Text style={styles.addressText}>{deliveryAddress}</Text>
                                    <Text style={styles.addressHint}>Toca para cambiar</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.addressPlaceholder}>¿Dónde quieres recibir tu pedido?</Text>
                                    <Text style={styles.addressHint}>Toca para seleccionar</Text>
                                </>
                            )}
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.notesInput}
                        placeholder="Notas de entrega (opcional)"
                        value={deliveryNotes}
                        onChangeText={setDeliveryNotes}
                        multiline
                    />
                </View>

                {/* Horario de entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Horario de entrega</Text>
                    <TouchableOpacity
                        style={styles.timeCard}
                        onPress={() => setShowTimeModal(true)}
                    >
                        <Icon name="schedule" size={24} color="#007BFF" />
                        <View style={styles.timeInfo}>
                            <Text style={styles.timeLabel}>
                                {deliveryTime === 'now'
                                    ? 'Lo antes posible'
                                    : deliveryTime === 'scheduled' && scheduledTime
                                        ? scheduledTime.toLocaleDateString('es-ES')
                                        : 'Seleccionar horario'}
                            </Text>
                            <Text style={styles.timeHint}>Toca para cambiar</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Método de pago */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de pago</Text>
                    <TouchableOpacity
                        style={styles.paymentCard}
                        onPress={() => setShowPaymentModal(true)}
                    >
                        <Icon
                            name={paymentMethods.find(m => m.id === paymentMethod)?.icon || 'payment'}
                            size={24}
                            color="#007BFF"
                        />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentText}>
                                {paymentMethods.find(m => m.id === paymentMethod)?.name || 'Seleccionar método de pago'}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Resumen del pedido */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen del pedido</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${orderData.subtotal?.toFixed(2) || '0.00'}</Text>
                        </View>
                        {orderData.discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Descuento</Text>
                                <Text style={[styles.summaryValue, styles.discountValue]}>
                                    -${orderData.discount?.toFixed(2) || '0.00'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Envío</Text>
                            <Text style={styles.summaryValue}>
                                {orderData.deliveryFee === 0 ? 'Gratis' : `$${orderData.deliveryFee?.toFixed(2) || '0.00'}`}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${orderData.total?.toFixed(2) || '0.00'}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Botón de confirmar */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.confirmButton, placeOrderMutation.isPending && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                >
                    {placeOrderMutation.isPending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            Confirmar Pedido • ${orderData.total?.toFixed(2) || '0.00'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {renderPaymentModal()}
            {renderTimeModal()}
            {showDatePicker && (
                <Modal
                    visible={showDatePicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.datePickerModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Programar fecha</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Icon name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateInputContainer}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="DD/MM/AAAA"
                                    value={scheduledTime ? scheduledTime.toLocaleDateString('es-ES') : ''}
                                    onChangeText={(text) => {
                                        // Parse DD/MM/YYYY format
                                        const parts = text.split('/');
                                        if (parts.length === 3) {
                                            const day = parseInt(parts[0], 10);
                                            const month = parseInt(parts[1], 10) - 1;
                                            const year = parseInt(parts[2], 10);
                                            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >= 2025) {
                                                const date = new Date(year, month, day);
                                                if (!isNaN(date.getTime())) {
                                                    setScheduledTime(date);
                                                    setDeliveryTime('scheduled');
                                                    setShowDatePicker(false);
                                                }
                                            }
                                        }
                                    }}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
        marginLeft: 12,
    },
    addressText: {
        fontSize: 14,
        color: '#333',
    },
    addressPlaceholder: {
        fontSize: 14,
        color: '#999',
    },
    addressHint: {
        fontSize: 12,
        color: '#007BFF',
        marginTop: 4,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    timeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
    },
    timeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    timeLabel: {
        fontSize: 14,
        color: '#333',
    },
    timeHint: {
        fontSize: 12,
        color: '#007BFF',
        marginTop: 4,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
    },
    paymentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    paymentText: {
        fontSize: 14,
        color: '#333',
    },
    summaryCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
    },
    discountValue: {
        color: '#4CAF50',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#DDD',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    footer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#CCC',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    paymentModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 32,
    },
    timeModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 32,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedPayment: {
        backgroundColor: '#F0FFF0',
    },
    timeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedTime: {
        backgroundColor: '#F0FFF0',
    },
    selectedTimeText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    scheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginHorizontal: 16,
        marginTop: 8,
    },
    scheduleButtonText: {
        color: '#007BFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    datePickerModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 32,
    },
    dateInputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        textAlign: 'center',
    },
});
