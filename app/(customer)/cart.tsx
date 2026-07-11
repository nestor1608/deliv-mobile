import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    SafeAreaView,
    StatusBar,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function CartScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { userToken } = useContext(AuthContext);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(2.50);

    // Query for cart items (real API)
    const { data: cartItems = [], isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: () => apiClient.get('orders/cart/').then((res: any) => res?.items || []),
    });

    const loading = isLoading;

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(itemId);
            return;
        }
        try {
            await apiClient.post('orders/cart/update/', { item_id: itemId, quantity: newQuantity });
            Alert.alert('Cantidad actualizada', 'La cantidad se ha actualizado');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la cantidad');
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            await apiClient.post('orders/cart/remove/', { item_id: itemId });
        } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el producto');
        }
    };

    const applyPromoCode = async () => {
        if (!promoCode.trim()) {
            Alert.alert('Error', 'Por favor ingresa un código promocional');
            return;
        }
        try {
            const vendorId = cartItems.length > 0 ? cartItems[0].storeId : null;
            const response = await apiClient.get<{ valid: boolean; discount_amount?: number; message?: string }>(
                `orders/validate-coupon/?code=${encodeURIComponent(promoCode)}&subtotal=${calculateSubtotal()}${vendorId ? `&vendor_id=${vendorId}` : ''}`
            );
            if ((response as any).valid) {
                setDiscount((response as any).discount_amount || 0);
                setPromoCode('');
                Alert.alert('Cupón aplicado', `Descuento: $${(response as any).discount_amount}`);
            } else {
                setDiscount(0);
                setPromoCode('');
                Alert.alert('Cupón inválido', (response as any).message);
            }
        } catch (error) {
            Alert.alert('Error', 'Error al validar cupón');
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateDiscount = () => {
        return discount;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountAmount = calculateDiscount();
        return subtotal - discountAmount + deliveryFee;
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Carrito vacío', 'Agrega productos antes de continuar');
            return;
        }
        const orderData = {
            items: cartItems,
            subtotal: calculateSubtotal(),
            discount: calculateDiscount(),
            deliveryFee: deliveryFee,
            total: calculateTotal(),
            promoCode: discount > 0 ? promoCode : null
        };
        router.push({ pathname: '/checkout', params: { orderData: JSON.stringify(orderData) } });
    };

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemStore}>{item.store}</Text>
                <View style={styles.itemPricing}>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPrice}>
                            ${item.originalPrice.toFixed(2)}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.quantityControls}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                    <Icon name="remove" size={20} color="#666" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                    <Icon name="add" size={20} color="#666" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.id)}
            >
                <Icon name="delete" size={24} color="#FF6B6B" />
            </TouchableOpacity>
        </View>
    );

    const renderEmptyCart = () => (
        <View style={styles.emptyCart}>
            <Icon name="shopping-cart" size={80} color="#DDD" />
            <Text style={styles.emptyCartTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyCartSubtitle}>
                Agrega productos para comenzar tu pedido
            </Text>
            <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/')}
            >
                <Text style={styles.shopButtonText}>Comenzar a comprar</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
                <View style={styles.loadingContainer}>
                    <Text>Cargando carrito...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            {cartItems.length === 0 ? (
                renderEmptyCart()
            ) : (
                <>
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        {/* Items del carrito */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Productos ({cartItems.length})
                            </Text>
                            <FlatList
                                data={cartItems}
                                renderItem={renderCartItem}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                            />
                        </View>
                        {/* Código promocional */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Código promocional</Text>
                            <View style={styles.promoContainer}>
                                <TextInput
                                    style={styles.promoInput}
                                    placeholder="Ingresa tu código"
                                    value={promoCode}
                                    onChangeText={setPromoCode}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={applyPromoCode}
                                >
                                    <Text style={styles.applyButtonText}>Aplicar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Resumen del pedido */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Resumen del pedido</Text>
                            <View style={styles.summaryContainer}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>
                                        ${calculateSubtotal().toFixed(2)}
                                    </Text>
                                </View>
                                {discount > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Descuento</Text>
                                        <Text style={[styles.summaryValue, styles.discountValue]}>
                                            -${calculateDiscount().toFixed(2)}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Envío</Text>
                                    <Text style={styles.summaryValue}>
                                        {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toFixed(2)}`}
                                    </Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>
                                        ${calculateTotal().toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {/* Espaciado inferior */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                    {/* Botón de checkout fijo */}
                    <View style={[styles.checkoutContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.checkoutButtonText}>
                                Continuar compra  - ${calculateTotal().toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 20,
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemStore: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    itemPricing: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28A745',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    removeButton: {
        padding: 8,
    },
    promoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    promoInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        marginRight: 12,
    },
    applyButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    applyButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    summaryContainer: {
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
    checkoutContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
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
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyCartTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyCartSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    shopButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
