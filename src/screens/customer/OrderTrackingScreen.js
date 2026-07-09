import React, { useState, useEffect, useContext, useRef } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import wsService from '../../services/ws';
import { AuthContext } from '../../context/AuthContext';

const OrderTrackingScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { orderId } = route.params || {};
    const { userToken, API_BASE_URL } = useContext(AuthContext);
    const wsConnectedRef = useRef(false);

    const [orderStatus, setOrderStatus] = useState('confirmed');
    const [estimatedTime, setEstimatedTime] = useState(30);
    
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
                            if (!isNaN(parsed)) setEstimatedTime(parsed);
                        }
                    }
                } catch (e) {
                    console.error('WS message error:', e);
                }
            },
            onOpen: () => { wsConnectedRef.current = true; },
            onError: (err) => console.error('WS error:', err),
        });

        wsService.connect(wsUrl, userToken);

        return () => { wsService.disconnect(); };
    }, [orderId]);

    useEffect(() => {
        if (wsConnectedRef.current) return;

        const fallbackTimer = setTimeout(() => {
            if (!wsConnectedRef.current) {
                if (orderStatus === 'confirmed') {
                    setOrderStatus('preparing');
                    setEstimatedTime(25);
                } else if (orderStatus === 'preparing') {
                    setOrderStatus('ready');
                    setEstimatedTime(15);
                } else if (orderStatus === 'ready') {
                    setOrderStatus('delivering');
                    setEstimatedTime(10);
                } else if (orderStatus === 'delivering') {
                    setOrderStatus('delivered');
                    setEstimatedTime(0);
                }
            }
        }, 5000);

        return () => clearTimeout(fallbackTimer);
    }, [orderStatus]);

    const handleCallStore = () => {
        Alert.alert(
            'Llamar al local',
            '¿Deseas llamar al local para consultar sobre tu pedido?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Llamar', onPress: () => Linking.openURL('tel:+5493756123456') }
            ]
        );
    };

    const handleGoHome = () => {
        navigation.navigate('Home');
    };

    const renderOrderSteps = () => {
        return orderStates.map((state, index) => {
            const isActive = state.id === orderStatus;
            const isCompleted = state.id === 'delivered' || (state.completed && orderStatus !== 'confirmed');
            
            return (
                <View key={state.id} style={styles.stepContainer}>
                    <View style={styles.stepLeft}>
                        <View style={[
                            styles.stepIcon,
                            isCompleted && styles.stepIconCompleted,
                            isActive && styles.stepIconActive
                        ]}>
                            <Icon 
                                name={state.icon} 
                                size={20} 
                                color={isCompleted || isActive ? '#FFF' : '#999'} 
                            />
                        </View>
                        {index < orderStates.length - 1 && (
                            <View style={[
                                styles.stepLine,
                                isCompleted && styles.stepLineCompleted
                            ]} />
                        )}
                    </View>
                    <View style={styles.stepRight}>
                        <Text style={[
                            styles.stepLabel,
                            isActive && styles.stepLabelActive,
                            isCompleted && styles.stepLabelCompleted
                        ]}>
                            {state.label}
                        </Text>
                        {isActive && (
                            <Text style={styles.stepSubtext}>
                                Tiempo estimado: {estimatedTime} min
                            </Text>
                        )}
                    </View>
                </View>
            );
        });
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header del pedido */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderTop}>
                        <Text style={styles.orderTitle}>Pedido #{orderId}</Text>
                        <TouchableOpacity 
                            style={styles.callButton}
                            onPress={handleCallStore}
                        >
                            <Icon name="phone" size={20} color="#28A745" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.orderSubtitle}>
                        {new Date().toLocaleString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Estado actual */}
                <View style={styles.currentStatusContainer}>
                    <View style={styles.statusCard}>
                        <Icon name="schedule" size={32} color="#28A745" />
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitle}>
                                {orderStates.find(s => s.id === orderStatus)?.label}
                            </Text>
                            <Text style={styles.statusSubtitle}>
                                Tiempo estimado: {estimatedTime} minutos
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Progreso del pedido */}
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Estado del pedido</Text>
                    <View style={styles.stepsContainer}>
                        {renderOrderSteps()}
                    </View>
                </View>

                {/* Información del pedido */}
                <View style={styles.orderInfoSection}>
                    <Text style={styles.sectionTitle}>Información del pedido</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Icon name="location-on" size={20} color="#666" />
                            <View style={styles.infoText}>
                                <Text style={styles.infoLabel}>Dirección de entrega</Text>
                                <Text style={styles.infoValue}>
                                    Tu dirección de entrega seleccionada
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="payment" size={20} color="#666" />
                            <View style={styles.infoText}>
                                <Text style={styles.infoLabel}>Método de pago</Text>
                                <Text style={styles.infoValue}>Efectivo</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="receipt" size={20} color="#666" />
                            <View style={styles.infoText}>
                                <Text style={styles.infoLabel}>Total</Text>
                                <Text style={styles.infoValue}>$45.50</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Ayuda */}
                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
                    <TouchableOpacity 
                        style={styles.helpButton}
                        onPress={handleCallStore}
                    >
                        <Icon name="help-outline" size={20} color="#666" />
                        <Text style={styles.helpButtonText}>Contactar al local</Text>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Botón de volver al inicio */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={handleGoHome}
                >
                    <Icon name="home" size={20} color="#FFF" />
                    <Text style={styles.homeButtonText}>Volver al inicio</Text>
                </TouchableOpacity>
            </View>
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
    orderHeader: {
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    orderHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    callButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#E8F5E8',
    },
    orderSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    currentStatusContainer: {
        padding: 16,
    },
    statusCard: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statusInfo: {
        marginLeft: 16,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    progressSection: {
        padding: 16,
        backgroundColor: '#FFF',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    stepsContainer: {
        marginLeft: 8,
    },
    stepContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    stepLeft: {
        width: 32,
        alignItems: 'center',
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconCompleted: {
        backgroundColor: '#28A745',
    },
    stepIconActive: {
        backgroundColor: '#FFC107',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#EEE',
        marginVertical: 4,
    },
    stepLineCompleted: {
        backgroundColor: '#28A745',
    },
    stepRight: {
        flex: 1,
        marginLeft: 16,
    },
    stepLabel: {
        fontSize: 16,
        color: '#999',
    },
    stepLabelActive: {
        color: '#333',
        fontWeight: 'bold',
    },
    stepLabelCompleted: {
        color: '#28A745',
    },
    stepSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    orderInfoSection: {
        padding: 16,
        backgroundColor: '#FFF',
        marginTop: 8,
    },
    infoCard: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        marginTop: 4,
    },
    helpSection: {
        padding: 16,
        backgroundColor: '#FFF',
        marginTop: 8,
        marginBottom: 16,
    },
    helpTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E5E5',
    },
    helpButtonText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    bottomContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    homeButton: {
        backgroundColor: '#28A745',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default OrderTrackingScreen;