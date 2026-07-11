// src/screens/store/ProductFormScreen.js
import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Switch,
    Alert,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VendorContext } from '../../src/context/VendorContext';
import Button from '../../src/components/Button';

const CATEGORIES = [
    'Comidas',
    'Bebidas',
    'Postres',
    'Entradas',
    'Platos principales',
    'Snacks',
    'Saludable',
    'Vegano',
    'Sin gluten',
    'Otros',
];

export default function ProductFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productParam = params?.product;
    const product = productParam ? JSON.parse(productParam) : null;
    const isEditing = !!product;

    const { createProduct, updateProduct, isLoading } = useContext(VendorContext);

    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price?.toString() || '',
        stock: product?.stock?.toString() || '',
        category: product?.category || CATEGORIES[0],
        is_available: product?.is_available ?? true,
        image: product?.image ? { uri: product.image } : null,
    });

    const [errors, setErrors] = useState({});

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
        }

        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Ingresa un precio válido';
        }

        if (formData.stock && (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0)) {
            newErrors.stock = 'Ingresa un stock válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos acceso a tu galería para seleccionar una imagen'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 600,
        });

        if (!result.canceled) {
            updateField('image', {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: `product_${Date.now()}.jpg`,
            });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos acceso a tu cámara para tomar una foto'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 600,
        });

        if (!result.canceled) {
            updateField('image', {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: `product_${Date.now()}.jpg`,
            });
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Seleccionar imagen',
            'Elige una opción',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tomar foto', onPress: takePhoto },
                { text: 'Elegir de galería', onPress: pickImage },
                ...(formData.image ? [
                    { text: 'Quitar imagen', onPress: () => updateField('image', null), style: 'destructive' }
                ] : [])
            ]
        );
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Error', 'Por favor corrige los errores en el formulario');
            return;
        }

        try {
            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                stock: formData.stock ? parseInt(formData.stock) : null,
                category: formData.category,
                is_available: formData.is_available,
                ...(formData.image && { image: formData.image }),
            };

            let result;
            if (isEditing) {
                result = await updateProduct(product.id, productData);
            } else {
                result = await createProduct(productData);
            }

            if (result.success) {
                Alert.alert(
                    'Éxito',
                    `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || `No se pudo ${isEditing ? 'actualizar' : 'crear'} el producto`
            );
        }
    };

    const renderImageSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagen del producto</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={showImageOptions}>
                {formData.image ? (
                    <Image source={{ uri: formData.image.uri }} style={styles.productImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera-outline" size={48} color="#ccc" />
                        <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                    </View>
                )}
                <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color="#FFF" />
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderInput = (field, label, placeholder, options = {}) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
                {label}
                {options.required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
                style={[
                    styles.input,
                    errors[field] && styles.inputError,
                    options.multiline && styles.textArea
                ]}
                placeholder={placeholder}
                value={formData[field]}
                onChangeText={(value) => updateField(field, value)}
                keyboardType={options.keyboardType || 'default'}
                multiline={options.multiline}
                numberOfLines={options.numberOfLines}
                textAlignVertical={options.multiline ? 'top' : 'center'}
                placeholderTextColor="#999"
            />
            {errors[field] && (
                <Text style={styles.errorText}>{errors[field]}</Text>
            )}
        </View>
    );

    const renderCategorySelector = () => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoría</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
            >
                {CATEGORIES.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            formData.category === category && styles.selectedCategoryChip
                        ]}
                        onPress={() => updateField('category', category)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            formData.category === category && styles.selectedCategoryChipText
                        ]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <Text style={styles.title}>
                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                    </Text>

                    {renderImageSection()}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información básica</Text>

                        {renderInput('name', 'Nombre', 'Ej: Hamburguesa clásica', { required: true })}

                        {renderInput('description', 'Descripción', 'Describe tu producto...', {
                            multiline: true,
                            numberOfLines: 3
                        })}

                        {renderCategorySelector()}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Precio y stock</Text>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                {renderInput('price', 'Precio', '0.00', {
                                    keyboardType: 'decimal-pad',
                                    required: true
                                })}
                            </View>
                            <View style={styles.halfWidth}>
                                {renderInput('stock', 'Stock', 'Opcional', {
                                    keyboardType: 'number-pad'
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Disponibilidad</Text>
                        <View style={styles.switchContainer}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Producto disponible</Text>
                                <Text style={styles.switchDescription}>
                                    Los clientes {formData.is_available ? 'pueden' : 'no pueden'} pedirlo
                                </Text>
                            </View>
                            <Switch
                                value={formData.is_available}
                                onValueChange={(value) => updateField('is_available', value)}
                                trackColor={{ false: '#767577', true: '#4CAF50' }}
                                thumbColor={formData.is_available ? '#ffffff' : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title={isEditing ? 'Actualizar producto' : 'Crear producto'}
                            onPress={handleSubmit}
                            loading={isLoading}
                            disabled={isLoading}
                        />

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
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
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    imagePlaceholderText: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#F44336',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    inputError: {
        borderColor: '#F44336',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    categoryScrollView: {
        marginBottom: 8,
    },
    categoryChip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
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
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
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
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});
