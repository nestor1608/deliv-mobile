import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../src/context/AuthContext';
import wsService from '../../src/services/ws';
import apiClient from '../../src/services/apiClient';

const OrderTrackingScreen = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const { API_BASE_URL, userToken } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const wsConnectedRef = useRef(false);
    const [orderStatus, setOrderStatus] = useState('confirmed');
    const [estimatedTime, setEstimatedTime] = useState(30);

    const { data: orderData } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => apiClient.get(`api/orders/${orderId}/`),
        enabled: !!orderId,
    });

    const orderStates = [
        { id: 'confirmed', label: 'Pedido confirmado', icon: 'check-circle', completed: true },
        { id: 'preparing', label: 'Preparando pedido', icon: 'restaurant', completed: orderStatus !== 'confirmed' },
        { id: 'ready', label: 'Listo para entregar', icon: 'inventory', completed: false },
        { id: 'delivering', label: 'En camino', icon: 'local-shipping', completed: false },
        { id: 'delivered', label: 'Entregado', icon: 'done-all', completed: false }
    ];

    useEffect(() => {
        if (!orderId) return;

        const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
        const host = API_BASE_URL.replace('https://', '').replace('http://', '').replace('/api', '');
        const wsUrl = `${wsProtocol}://${host.replace(':8000', ':8001')}/ws/orders/${orderId}/`;

        wsService.setCallbacks({
            onMessage: (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.type === 'status_update') {
                        setOrderStatus(msg.status);
                        if (msg.message) {
                            const parsed = parseInt(msg.message, 10);
                            if (!isNaN(parsed)) {
                                setEstimatedTime(parsed);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing WS message:', e);
                }
            },
            onOpen: () => { wsConnectedRef.current = true; },
            onError: (err) => console.error('WS error:', err),
        });

        wsService.connect(wsUrl, userToken);

        return () => {
            wsService.disconnect();
        };
    }, [orderId]);

    const handleCancelOrder = () => {
        Alert.alert(
            'Cancelar pedido',
            '¿Estás seguro de que quieres cancelar este pedido?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => {
                        // Implementar cancelación
                        router.back();
                    }
                }
            ]
        );
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:soporte@dely.com');
    };

    const currentStepIndex = orderStates.findIndex(s => s.id === orderStatus);

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
                <Text style={styles.headerTitle}>Seguimiento del Pedido</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order ID */}
                <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Pedido #{orderId || '12345'}</Text>
                    <Text style={styles.estimatedTime}>
                        Tiempo estimado: {estimatedTime} min
                    </Text>
                </View>

                {/* Progress Steps */}
                <View style={styles.progressContainer}>
                    {orderStates.map((state, index) => {
                        const isCompleted = state.completed || index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <View key={state.id} style={styles.stepContainer}>
                                <View style={[
                                    styles.stepCircle,
                                    isCompleted && styles.stepCircleCompleted,
                                    isCurrent && styles.stepCircleCurrent
                                ]}>
                                    {isCompleted ? (
                                        <Icon name="check" size={16} color="#FFF" />
                                    ) : (
                                        <Icon name={state.icon} size={16} color={isCurrent ? '#FFF' : '#CCC'} />
                                    )}
                                </View>
                                {index < orderStates.length - 1 && (
                                    <View style={[
                                        styles.stepLine,
                                        isCompleted && styles.stepLineCompleted
                                    ]} />
                                )}
                                <View style={styles.stepInfo}>
                                    <Text style={[
                                        styles.stepLabel,
                                        (isCompleted || isCurrent) && styles.stepLabelActive
                                    ]}>
                                        {state.label}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Delivery Info */}
                {orderStatus !== 'delivered' && (
                    <View style={styles.deliveryCard}>
                        <View style={styles.deliveryHeader}>
                            <Icon name="motorcycle" size={24} color="#FF6B6B" />
                            <Text style={styles.deliveryTitle}>Tu pedido está en camino</Text>
                        </View>
                        <Text style={styles.deliveryText}>
                            El repartidor está acercándose. Te notificaremos cuando llegue.
                        </Text>
                        <View style={styles.deliveryStats}>
                            <View style={styles.statItem}>
                                <Icon name="schedule" size={20} color="#666" />
                                <Text style={styles.statText}>{estimatedTime} min</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Icon name="location-on" size={20} color="#666" />
                                <Text style={styles.statText}>2.5 km</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Order Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen del pedido</Text>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>$28.50</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Envío</Text>
                        <Text style={styles.summaryValue}>$2.50</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>$31.00</Text>
                    </View>
                </View>

                {/* Help Section */}
                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={handleContactSupport}
                    >
                        <Icon name="chat" size={20} color="#007BFF" />
                        <Text style={styles.helpButtonText}>Contactar a soporte</Text>
                    </TouchableOpacity>
                    {orderStatus !== 'delivered' && (
                        <TouchableOpacity
                            style={[styles.helpButton, styles.cancelButton]}
                            onPress={handleCancelOrder}
                        >
                            <Icon name="cancel" size={20} color="#F44336" />
                            <Text style={[styles.helpButtonText, { color: '#F44336' }]}>
                                Cancelar pedido
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

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
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    orderIdContainer: {
        backgroundColor: '#FFF',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    orderIdLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    estimatedTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    progressContainer: {
        backgroundColor: '#FFF',
        padding: 24,
        marginTop: 12,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleCompleted: {
        backgroundColor: '#4CAF50',
    },
    stepCircleCurrent: {
        backgroundColor: '#FF6B6B',
    },
    stepLine: {
        width: 2,
        height: 40,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 15,
    },
    stepLineCompleted: {
        backgroundColor: '#4CAF50',
    },
    stepInfo: {
        flex: 1,
        marginLeft: 12,
        paddingTop: 4,
    },
    stepLabel: {
        fontSize: 14,
        color: '#CCC',
    },
    stepLabelActive: {
        color: '#333',
        fontWeight: '600',
    },
    deliveryCard: {
        backgroundColor: '#FFF',
        padding: 16,
        marginTop: 12,
    },
    deliveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deliveryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    deliveryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    deliveryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        padding: 16,
        marginTop: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    helpSection: {
        backgroundColor: '#FFF',
        padding: 16,
        marginTop: 12,
        marginBottom: 24,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    cancelButton: {
        borderBottomWidth: 0,
    },
    helpButtonText: {
        fontSize: 14,
        color: '#007BFF',
        marginLeft: 8,
    },
});

export default OrderTrackingScreen;
