import React, { useState, useEffect, useContext } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CheckoutScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { userData } = useContext(AuthContext);
    const { orderData } = route.params;
    
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [locationData, setLocationData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('now');
    const [scheduledTime, setScheduledTime] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
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
            { 
                id: '3h', 
                label: 'En 3 horas', 
                time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) 
            },
        ];
    };

    const [timeSlots, setTimeSlots] = useState(generateTimeSlots(30));

    useEffect(() => {
        setDeliveryAddress(userData?.address || '');
        setPaymentMethod('cash');
    }, [userData]);

    useEffect(() => {
        // Actualizar slots de tiempo cuando cambie el tiempo estimado
        setTimeSlots(generateTimeSlots(estimatedDeliveryTime));
    }, [estimatedDeliveryTime]);

    const handleAddressChange = () => {
        navigation.navigate('LocationPicker', {
            onLocationSelected: (selectedLocationData, fullAddress) => {
                setLocationData(selectedLocationData);
                setDeliveryAddress(fullAddress);
                setEstimatedDeliveryTime(selectedLocationData.estimatedTime);
            }
        });
    };

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
        setShowPaymentModal(false);
    };

    const handleTimeSelect = (time) => {
        setDeliveryTime(time);
        setShowTimeModal(false);
    };

    const validateOrder = () => {
        if (!deliveryAddress.trim()) {
            Alert.alert('Error', 'Por favor selecciona una dirección de entrega');
            return false;
        }
        if (!paymentMethod) {
            Alert.alert('Error', 'Por favor selecciona un método de pago');
            return false;
        }
        return true;
    };

    const calculateDeliveryFee = () => {
        if (!locationData) return orderData.deliveryFee;
        
        const distance = parseFloat(locationData.distance);
        
        // Entrega gratis para pedidos mayores a $50 y distancia menor a 5km
        if (orderData.subtotal >= 50 && distance < 5) {
            return 0;
        }
        
        // Tarifa base + tarifa por distancia
        const baseFee = 5;
        const distanceFee = distance * 2; // $2 por km
        
        return Math.max(baseFee, distanceFee);
    };

    const getUpdatedOrderData = () => {
        const deliveryFee = calculateDeliveryFee();
        const total = orderData.subtotal - orderData.discount + deliveryFee;
        
        return {
            ...orderData,
            deliveryFee,
            total
        };
    };

    const updatedOrderData = getUpdatedOrderData();

    const handlePlaceOrder = async () => {
        if (!validateOrder()) return;

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const finalEstimatedTime = deliveryTime === 'now' ? 
                estimatedDeliveryTime : 
                timeSlots.find(slot => slot.id === deliveryTime)?.time || 'Programado';
            
            const orderDetails = {
                id: Math.random().toString(36).substr(2, 9),
                items: updatedOrderData.items,
                address: deliveryAddress,
                locationData,
                paymentMethod,
                deliveryTime,
                notes: deliveryNotes,
                subtotal: updatedOrderData.subtotal,
                discount: updatedOrderData.discount,
                deliveryFee: updatedOrderData.deliveryFee,
                total: updatedOrderData.total,
                status: scheduledTime ? 'scheduled' : 'confirmed',
                estimatedDelivery: finalEstimatedTime,
                orderDate: new Date().toISOString(),
                ...(scheduledTime ? { scheduled_time: scheduledTime.toISOString() } : {}),
            };

            Alert.alert(
                '¡Pedido confirmado!',
                `Tu pedido #${orderDetails.id} ha sido confirmado.\nTiempo estimado: ${finalEstimatedTime} min`,
                [
                    {
                        text: 'Ver pedido',
                        onPress: () => {
                            navigation.navigate('OrderTracking', { orderId: orderDetails.id });
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error placing order:', error);
            Alert.alert('Error', 'No se pudo procesar tu pedido. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const renderPaymentModal = () => (
        <Modal
            visible={showPaymentModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPaymentModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Método de pago</Text>
                        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.paymentOption}
                            onPress={() => handlePaymentMethodSelect(method.id)}
                        >
                            <Icon name={method.icon} size={24} color="#666" />
                            <Text style={styles.paymentOptionText}>{method.name}</Text>
                            {paymentMethod === method.id && (
                                <Icon name="check" size={24} color="#28A745" />
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
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimeModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Tiempo de entrega</Text>
                        <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {timeSlots.map((slot) => (
                        <TouchableOpacity
                            key={slot.id}
                            style={styles.timeOption}
                            onPress={() => handleTimeSelect(slot.id)}
                        >
                            <View style={styles.timeInfo}>
                                <Text style={styles.timeLabel}>{slot.label}</Text>
                                <Text style={styles.timeValue}>{slot.time}</Text>
                            </View>
                            {deliveryTime === slot.id && (
                                <Icon name="check" size={24} color="#28A745" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const renderDeliveryInfo = () => {
        if (!locationData) return null;

        return (
            <View style={styles.deliveryInfo}>
                <View style={styles.deliveryInfoRow}>
                    <Icon name="local-shipping" size={16} color="#666" />
                    <Text style={styles.deliveryInfoText}>
                        Distancia: {locationData.distance} km
                    </Text>
                </View>
                <View style={styles.deliveryInfoRow}>
                    <Icon name="schedule" size={16} color="#666" />
                    <Text style={styles.deliveryInfoText}>
                        Tiempo estimado: {estimatedDeliveryTime} min
                    </Text>
                </View>
                {updatedOrderData.deliveryFee === 0 && (
                    <View style={styles.freeDeliveryBadge}>
                        <Icon name="local-offer" size={16} color="#28A745" />
                        <Text style={styles.freeDeliveryText}>¡Envío gratis!</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Resumen del pedido */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen del pedido</Text>
                    <View style={styles.orderSummary}>
                        <Text style={styles.itemCount}>
                            {updatedOrderData.items.length} producto{updatedOrderData.items.length > 1 ? 's' : ''}
                        </Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${updatedOrderData.subtotal.toFixed(2)}</Text>
                        </View>
                        {updatedOrderData.discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Descuento</Text>
                                <Text style={[styles.summaryValue, styles.discountValue]}>
                                    -${updatedOrderData.discount.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Envío</Text>
                            <Text style={styles.summaryValue}>
                                {updatedOrderData.deliveryFee === 0 ? 'Gratis' : `$${updatedOrderData.deliveryFee.toFixed(2)}`}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${updatedOrderData.total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Dirección de entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dirección de entrega</Text>
                    <TouchableOpacity style={styles.addressContainer} onPress={handleAddressChange}>
                        <View style={styles.addressInfo}>
                            <Icon name="location-on" size={24} color="#666" />
                            <View style={styles.addressText}>
                                <Text style={styles.addressLabel}>Entregar en:</Text>
                                <Text style={styles.addressValue}>
                                    {deliveryAddress || 'Seleccionar dirección'}
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                    {renderDeliveryInfo()}
                </View>

                {/* Tiempo de entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tiempo de entrega</Text>
                    <TouchableOpacity style={styles.optionContainer} onPress={() => setShowTimeModal(true)}>
                        <View style={styles.optionInfo}>
                            <Icon name="schedule" size={24} color="#666" />
                            <View style={styles.optionText}>
                                <Text style={styles.optionLabel}>
                                    {timeSlots.find(slot => slot.id === deliveryTime)?.label || 'Seleccionar horario'}
                                </Text>
                                <Text style={styles.optionValue}>
                                    {timeSlots.find(slot => slot.id === deliveryTime)?.time || ''}
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Método de pago */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de pago</Text>
                    <TouchableOpacity style={styles.optionContainer} onPress={() => setShowPaymentModal(true)}>
                        <View style={styles.optionInfo}>
                            <Icon 
                                name={paymentMethods.find(m => m.id === paymentMethod)?.icon || 'payment'} 
                                size={24} 
                                color="#666" 
                            />
                            <View style={styles.optionText}>
                                <Text style={styles.optionLabel}>
                                    {paymentMethods.find(m => m.id === paymentMethod)?.name || 'Seleccionar método'}
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Notas de entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notas de entrega</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Instrucciones especiales para la entrega..."
                        value={deliveryNotes}
                        onChangeText={setDeliveryNotes}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Programar pedido */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>¿Cuándo querés recibirlo?</Text>
                    <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.scheduleButtonText}>
                            {scheduledTime
                                ? scheduledTime.toLocaleString('es-AR')
                                : 'Lo antes posible'}
                        </Text>
                    </TouchableOpacity>
                    {scheduledTime && (
                        <TouchableOpacity onPress={() => setScheduledTime(null)}>
                            <Text style={styles.clearScheduleText}>Entregar ahora</Text>
                        </TouchableOpacity>
                    )}
                    {showDatePicker && (
                        <DateTimePicker
                            value={scheduledTime || new Date()}
                            mode="datetime"
                            minimumDate={new Date()}
                            maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                            onChange={(event, date) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (date) setScheduledTime(date);
                            }}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Botón de confirmar pedido */}
            <View style={[styles.checkoutContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.checkoutButtonText}>
                            Confirmar pedido • ${updatedOrderData.total.toFixed(2)}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {renderPaymentModal()}
            {renderTimeModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 16,
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 16,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    orderSummary: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
    },
    itemCount: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    discountValue: {
        color: '#28A745',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#DDD',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    addressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    addressText: {
        marginLeft: 12,
        flex: 1,
    },
    addressLabel: {
        fontSize: 14,
        color: '#666',
    },
    addressValue: {
        fontSize: 16,
        color: '#333',
        marginTop: 4,
    },
    deliveryInfo: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    deliveryInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    deliveryInfoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    freeDeliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    freeDeliveryText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#28A745',
        fontWeight: 'bold',
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    optionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionText: {
        marginLeft: 12,
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        color: '#333',
    },
    optionValue: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    scheduleButton: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    scheduleButtonText: {
        fontSize: 16,
        color: '#333',
    },
    clearScheduleText: {
        fontSize: 14,
        color: '#2196F3',
        textAlign: 'center',
        marginTop: 8,
    },
    checkoutContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    checkoutButton: {
        backgroundColor: '#28A745',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        paddingBottom: 32,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    paymentOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    timeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    timeInfo: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 16,
        color: '#333',
    },
    timeValue: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});

export default CheckoutScreen;