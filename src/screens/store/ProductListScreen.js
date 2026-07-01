// src/screens/store/ProductListScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    Alert,
    RefreshControl,
    Switch,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VendorContext } from '../../context/VendorContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

export default function ProductListScreen({ navigation }) {
    const {
        products,
        loadProducts,
        deleteProduct,
        updateProduct,
        isLoading,
    } = useContext(VendorContext);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadProducts();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

    const handleToggleAvailability = async (product) => {
        try {
            await updateProduct(product.id, {
                is_available: !product.is_available
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la disponibilidad del producto');
        }
    };

    const handleDeleteProduct = (product) => {
        Alert.alert(
            'Eliminar producto',
            `¿Estás seguro que quieres eliminar "${product.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(product.id);
                            Alert.alert('Éxito', 'Producto eliminado correctamente');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el producto');
                        }
                    },
                },
            ]
        );
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productCard}>
            {/* Imagen del producto */}
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#ccc" />
                    </View>
                )}
                
                {/* Badge de disponibilidad */}
                <View style={[
                    styles.availabilityBadge,
                    { backgroundColor: item.is_available ? '#4CAF50' : '#F44336' }
                ]}>
                    <Text style={styles.availabilityText}>
                        {item.is_available ? 'Disponible' : 'No disponible'}
                    </Text>
                </View>

                {/* Botón de edición rápida */}
                <TouchableOpacity
                    style={styles.quickEditButton}
                    onPress={() => navigation.navigate('ProductForm', { product: item })}
                >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Información del producto */}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                </Text>
                
                {item.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.productDetails}>
                    <Text style={styles.productPrice}>${item.price}</Text>
                    {item.stock !== undefined && (
                        <Text style={[
                            styles.stockText,
                            { color: item.stock > 5 ? '#4CAF50' : item.stock > 0 ? '#FF9800' : '#F44336' }
                        ]}>
                            Stock: {item.stock}
                        </Text>
                    )}
                </View>

                {/* Controles */}
                <View style={styles.productControls}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Disponible</Text>
                        <Switch
                            value={item.is_available}
                            onValueChange={() => handleToggleAvailability(item)}
                            trackColor={{ false: '#767577', true: '#4CAF50' }}
                            thumbColor={item.is_available ? '#ffffff' : '#f4f3f4'}
                            style={styles.switch}
                        />
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => navigation.navigate('ProductForm', { product: item })}
                        >
                            <Ionicons name="pencil-outline" size={16} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteProduct(item)}
                        >
                            <Ionicons name="trash-outline" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes productos</Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery 
                    ? `No se encontraron productos que coincidan con "${searchQuery}"`
                    : 'Comienza agregando productos a tu catálogo'
                }
            </Text>
            {!searchQuery && (
                <TouchableOpacity
                    style={styles.addFirstProductButton}
                    onPress={() => navigation.navigate('ProductForm')}
                >
                    <Text style={styles.addFirstProductText}>Agregar primer producto</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}
                    >
                        <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtros por categoría */}
            {categories.length > 1 && (
                <View style={styles.categoriesContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === item && styles.selectedCategoryChip
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategory === item && styles.selectedCategoryChipText
                                ]}>
                                    {item === 'all' ? 'Todos' : item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Estadísticas */}
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                    {searchQuery && ` encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProductItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            {/* Botón flotante para agregar producto */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ProductForm')}
            >
                <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        flexGrow: 1,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    categoriesContainer: {
        marginBottom: 12,
    },
    categoryChip: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedCategoryChip: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    selectedCategoryChipText: {
        color: '#FFF',
    },
    statsContainer: {
        paddingVertical: 8,
    },
    statsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    row: {
        justifyContent: 'space-between',
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        width: ITEM_WIDTH,
        overflow: 'hidden',
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
    imageContainer: {
        position: 'relative',
        height: 120,
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    availabilityBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    availabilityText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    quickEditButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
    productDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        lineHeight: 16,
    },
    productDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    stockText: {
        fontSize: 12,
        fontWeight: '600',
    },
    productControls: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    switchLabel: {
        fontSize: 14,
        color: '#333',
    },
    switch: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        borderRadius: 6,
        paddingVertical: 8,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    editButton: {
        backgroundColor: '#2196F3',
    },
    deleteButton: {
        backgroundColor: '#F44336',
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
        marginBottom: 24,
    },
    addFirstProductButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    addFirstProductText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#FF6B6B',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 8,
            },
        }),
    },
});