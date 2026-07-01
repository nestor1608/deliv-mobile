import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Share,
    ActivityIndicator
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { productId } = route.params;
    const { userToken } = useContext(AuthContext);
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        loadProductDetail();
        checkIfFavorite();
    }, [productId]);

    const loadProductDetail = async () => {
        try {
            setLoading(true);
            // Aquí harías la llamada a tu API de Django
            // const response = await fetch(`/api/products/${productId}/`, {
            //     headers: { 'Authorization': `Token ${userToken}` }
            // });
            // const data = await response.json();
            
            // Datos simulados - reemplaza con tu API
            const mockProduct = {
                id: productId,
                name: 'Hamburguesa Clásica Deluxe',
                description: 'Deliciosa hamburguesa con carne 100% res, lechuga fresca, tomate, cebolla, queso cheddar y nuestra salsa especial. Servida con papas fritas crujientes.',
                price: 12.99,
                originalPrice: 15.99,
                images: [
                    'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Hamburguesa+1',
                    'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Hamburguesa+2',
                    'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Hamburguesa+3'
                ],
                store: {
                    id: 1,
                    name: 'Burger Palace',
                    image: 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=BP',
                    rating: 4.8,
                    deliveryTime: '15-25 min',
                    deliveryFee: 1.50
                },
                category: 'Hamburguesas',
                rating: 4.7,
                reviewCount: 256,
                preparationTime: '10-15 min',
                calories: 650,
                ingredients: ['Carne de res', 'Pan brioche', 'Lechuga', 'Tomate', 'Cebolla', 'Queso cheddar', 'Salsa especial'],
                variants: [
                    { id: 1, name: 'Pequeña', price: 10.99 },
                    { id: 2, name: 'Mediana', price: 12.99 },
                    { id: 3, name: 'Grande', price: 15.99 }
                ],
                extras: [
                    { id: 1, name: 'Papas extra', price: 2.50 },
                    { id: 2, name: 'Queso extra', price: 1.50 },
                    { id: 3, name: 'Tocino', price: 3.00 }
                ],
                inStock: true,
                discount: 19
            };
            
            setProduct(mockProduct);
            setSelectedVariant(mockProduct.variants[1]); // Seleccionar mediana por defecto
        } catch (error) {
            console.error('Error loading product:', error);
            Alert.alert('Error', 'No se pudo cargar el producto');
        } finally {
            setLoading(false);
        }
    };

    const checkIfFavorite = async () => {
        // Verificar si el producto está en favoritos
        setIsFavorite(false);
    };

    const toggleFavorite = async () => {
        try {
            setIsFavorite(!isFavorite);
            // Aquí harías la llamada a tu API para agregar/quitar de favoritos
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!product.inStock) {
            Alert.alert('Producto no disponible', 'Este producto no está disponible en este momento');
            return;
        }

        try {
            setAddingToCart(true);
            
            const cartItem = {
                productId: product.id,
                quantity: quantity,
                variant: selectedVariant,
                price: selectedVariant ? selectedVariant.price : product.price
            };

            // Aquí harías la llamada a tu API de Django
            // const response = await fetch('/api/cart/add/', {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Token ${userToken}`,
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(cartItem)
            // });

            Alert.alert(
                'Producto agregado',
                `${product.name} se agregó al carrito`,
                [
                    { text: 'Continuar comprando', style: 'cancel' },
                    { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
                ]
            );
        } catch (error) {
            console.error('Error adding to cart:', error);
            Alert.alert('Error', 'No se pudo agregar el producto al carrito');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `¡Mira este producto! ${product.name} - $${product.price}`,
                title: product.name,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleStorePress = () => {
        navigation.navigate('StoreProducts', { 
            storeId: product.store.id, 
            storeName: product.store.name 
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Cargando producto...</Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No se pudo cargar el producto</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadProductDetail}
                >
                    <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Imagen del producto */}
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: product.images[0] }} 
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    
                    {/* Botones de acción sobre la imagen */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={toggleFavorite}
                    >
                        <Icon 
                            name={isFavorite ? "favorite" : "favorite-border"} 
                            size={24} 
                            color={isFavorite ? "#FF6B6B" : "#FFF"} 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                    >
                        <Icon name="share" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* Badge de descuento */}
                    {product.discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{product.discount}%</Text>
                        </View>
                    )}
                </View>

                {/* Información del producto */}
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                    
                    {/* Precio */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>
                            ${selectedVariant ? selectedVariant.price.toFixed(2) : product.price.toFixed(2)}
                        </Text>
                        {product.originalPrice && (
                            <Text style={styles.originalPrice}>
                                ${product.originalPrice.toFixed(2)}
                            </Text>
                        )}
                    </View>

                    {/* Rating y tiempo de preparación */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Icon name="star" size={16} color="#FFD700" />
                            <Text style={styles.statText}>{product.rating} ({product.reviewCount})</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="schedule" size={16} color="#666" />
                            <Text style={styles.statText}>{product.preparationTime}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="local-fire-department" size={16} color="#FF6B6B" />
                            <Text style={styles.statText}>{product.calories} cal</Text>
                        </View>
                    </View>

                    {/* Información del comercio */}
                    <TouchableOpacity style={styles.storeInfo} onPress={handleStorePress}>
                        <Image source={{ uri: product.store.image }} style={styles.storeImage} />
                        <View style={styles.storeDetails}>
                            <Text style={styles.storeName}>{product.store.name}</Text>
                            <View style={styles.storeStats}>
                                <View style={styles.storeStatItem}>
                                    <Icon name="star" size={14} color="#FFD700" />
                                    <Text style={styles.storeStatText}>{product.store.rating}</Text>
                                </View>
                                <Text style={styles.storeStatText}>{product.store.deliveryTime}</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Variantes */}
                    {product.variants && product.variants.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tamaño</Text>
                            <View style={styles.variantContainer}>
                                {product.variants.map((variant) => (
                                    <TouchableOpacity
                                        key={variant.id}
                                        style={[
                                            styles.variantButton,
                                            selectedVariant?.id === variant.id && styles.selectedVariant
                                        ]}
                                        onPress={() => setSelectedVariant(variant)}
                                    >
                                        <Text style={[
                                            styles.variantText,
                                            selectedVariant?.id === variant.id && styles.selectedVariantText
                                        ]}>
                                            {variant.name}
                                        </Text>
                                        <Text style={[
                                            styles.variantPrice,
                                            selectedVariant?.id === variant.id && styles.selectedVariantText
                                        ]}>
                                            ${variant.price.toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Ingredientes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredientes</Text>
                        <View style={styles.ingredientContainer}>
                            {product.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientTag}>
                                    <Text style={styles.ingredientText}>{ingredient}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom bar con cantidad y botón de agregar */}
            <View style={styles.bottomBar}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Icon name="remove" size={20} color="#007BFF" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(quantity + 1)}
                    >
                        <Icon name="add" size={20} color="#007BFF" />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    style={[styles.addToCartButton, !product.inStock && styles.disabledButton]}
                    onPress={handleAddToCart}
                    disabled={!product.inStock || addingToCart}
                >
                    {addingToCart ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Icon name="shopping-cart" size={20} color="#FFF" />
                            <Text style={styles.addToCartText}>
                                {product.inStock ? 'Agregar al carrito' : 'No disponible'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: 300,
        backgroundColor: '#F5F5F5',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteButton: {
        position: 'absolute',
        top: 40,
        right: 64,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 40,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    discountBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 16,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    productDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 16,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#28A745',
    },
    originalPrice: {
        fontSize: 18,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
    },
    storeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    storeImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    storeDetails: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    storeStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    storeStatText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    variantContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    variantButton: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        minWidth: 80,
        alignItems: 'center',
    },
    selectedVariant: {
        borderColor: '#007BFF',
        backgroundColor: '#007BFF',
    },
    variantText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    selectedVariantText: {
        color: '#FFF',
    },
    variantPrice: {
        fontSize: 12,
        color: '#666',
    },
    ingredientContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientTag: {
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    ingredientText: {
        fontSize: 12,
        color: '#666',
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    quantityText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 16,
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#999',
    },
    addToCartText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ProductDetailScreen;