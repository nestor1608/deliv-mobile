// src/screens/store/OrdersScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VendorContext } from '../../context/VendorContext';

const { width } = Dimensions.get('window');

const ORDER_STATUS = {
    pending: { label: 'Pendiente', color: '#FF9800', icon: 'time-outline' },
    accepted: { label: 'Aceptado', color: '#2196F3', icon: 'checkmark-circle-outline' },
    preparing: { label: 'Preparando', color: '#9C27B0', icon: 'restaurant-outline' },
    ready: { label: 'Listo', color: '#4CAF50', icon: 'checkmark-done-outline' },
    delivered: { label: 'Entregado', color: '#607D8B', icon: 'car-outline' },
    cancelled: { label: 'Cancelado', color: '#F44336', icon: 'close-circle-outline' },
};

export default function OrdersScreen({ navigation, route }) {
    const { orders, loadOrders, updateOrderStatus, isLoading } = useContext(VendorContext);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('pending');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notes, setNotes] = useState('');

    const filterFromRoute = route.params?.filter;

    useEffect(() => {
        if (filterFromRoute) {
            setSelectedTab(filterFromRoute);
        }
        loadOrders();
    }, [filterFromRoute]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const filteredOrders = orders.filter(order => {
        if (selectedTab === 'all') return true;
        return order.status === selectedTab;
    });

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus, notes);
            setModalVisible(false);
            setNotes('');
            Alert.alert('Éxito', 'Estado del pedido actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
        }
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            pending: 'accepted',
            accepted: 'preparing',
            preparing: 'ready',
            ready: 'delivered',
        };
        return statusFlow[currentStatus];
    };

    const canUpdateStatus = (status) => {
        return ['pending', 'accepted', 'preparing', 'ready'].includes(status);
    };

    const renderOrderItem = ({ item }) => {
        const status = ORDER_STATUS[item.status];
        const nextStatus = getNextStatus(item.status);
        const nextStatusInfo = ORDER_STATUS[nextStatus];

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>Pedido #{item.id}</Text>
                        <Text style={styles.orderTime}>
                            {new Date(item.created_at).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        <Ionicons name={status.icon} size={16} color="#FFF" />
                        <Text style={styles.statusText}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.customerInfo}>
                    <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>{item.customer?.name || 'Cliente'}</Text>
                        <Text style={styles.customerAddress}>
                            {item.delivery_address?.street_address || 'Dirección no disponible'}
                        </Text>
                    </View>
                    <Text style={styles.orderTotal}>${item.total}</Text>
                </View>

                <View style={styles.orderItems}>
                    <Text style={styles.itemsTitle}>
                        Productos ({item.items?.length || 0})
                    </Text>
                    {item.items?.slice(0, 2).map((orderItem, index) => (
                        <Text key={index} style={styles.itemText}>
                            {orderItem.quantity}x {orderItem.product?.name}
                        </Text>
                    ))}
                    {item.items?.length > 2 && (
                        <Text style={styles.moreItems}>
                            +{item.items.length - 2} más
                        </Text>
                    )}
                </View>

                <View style={styles.orderActions}>
                    {canUpdateStatus(item.status) && nextStatus && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={() => handleStatusUpdate(item.id, nextStatus)}
                        >
                            <Ionicons name={nextStatusInfo.icon} size={16} color="#FFF" />
                            <Text style={styles.buttonText}>
                                Marcar como {nextStatusInfo.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {item.status === 'pending' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.dangerButton]}
                            onPress={() => {
                                Alert.alert(
                                    'Rechazar pedido',
                                    '¿Estás seguro que quieres rechazar este pedido?',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                            text: 'Rechazar',
                                            onPress: () => handleStatusUpdate(item.id, 'cancelled'),
                                            style: 'destructive',
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                            <Text style={styles.buttonText}>Rechazar</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => openStatusModal(item)}
                    >
                        <Ionicons name="create-outline" size={16} color="#666" />
                        <Text style={[styles.buttonText, { color: '#666' }]}>
                            Más opciones
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay pedidos</Text>
            <Text style={styles.emptySubtitle}>
                {selectedTab === 'pending'
                    ? 'No tienes pedidos pendientes en este momento'
                    : `No hay pedidos con estado "${ORDER_STATUS[selectedTab]?.label}"`}
            </Text>
        </View>
    );

    const tabs = [
        { key: 'pending', label: 'Pendientes', count: orders.filter(o => o.status === 'pending').length },
        { key: 'preparing', label: 'Preparando', count: orders.filter(o => o.status === 'preparing').length },
        { key: 'ready', label: 'Listos', count: orders.filter(o => o.status === 'ready').length },
        { key: 'all', label: 'Todos', count: orders.length },
    ];

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={tabs}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedTab === item.key && styles.activeTab,
                            ]}
                            onPress={() => setSelectedTab(item.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedTab === item.key && styles.activeTabText,
                                ]}
                            >
                                {item.label}
                            </Text>
                            {item.count > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{item.count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Lista de pedidos */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal para más opciones */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Actualizar Pedido #{selectedOrder?.id}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statusOptions}>
                            {Object.entries(ORDER_STATUS).map(([key, statusInfo]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.statusOption,
                                        selectedOrder?.status === key && styles.currentStatus,
                                    ]}
                                    onPress={() => handleStatusUpdate(selectedOrder?.id, key)}
                                    disabled={selectedOrder?.status === key}
                                >
                                    <Ionicons
                                        name={statusInfo.icon}
                                        size={20}
                                        color={statusInfo.color}
                                    />
                                    <Text style={styles.statusOptionText}>
                                        {statusInfo.label}
                                    </Text>
                                    {selectedOrder?.status === key && (
                                        <Text style={styles.currentLabel}>Actual</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>Notas (opcional)</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Agregar notas sobre el pedido..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    activeTab: {
        backgroundColor: '#FF6B6B',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#FFF',
    },
    tabBadge: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    tabBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 4,
    },
    customerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    customerAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    orderItems: {
        marginBottom: 16,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    itemText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    moreItems: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    orderActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    dangerButton: {
        backgroundColor: '#F44336',
    },
    secondaryButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFF',
        marginLeft: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 34,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    statusOptions: {
        paddingVertical: 20,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
    },
    currentStatus: {
        backgroundColor: '#e8f5e8',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    statusOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    currentLabel: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    notesSection: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 20,
    },
    notesLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 80,
    },
});