// src/screens/store/StoreProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
    Switch,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VendorContext } from '../../src/context/VendorContext';
import { AuthContext } from '../../src/context/AuthContext';
import Button from '../../src/components/Button';

const BUSINESS_TYPES = [
    'Restaurante',
    'Cafetería',
    'Panadería',
    'Heladería',
    'Comida rápida',
    'Pizzería',
    'Sushi',
    'Vegano',
    'Saludable',
    'Internacional',
    'Otros',
];

const DELIVERY_ZONES = [
    { name: 'Centro', enabled: true },
    { name: 'Norte', enabled: false },
    { name: 'Sur', enabled: true },
    { name: 'Este', enabled: false },
    { name: 'Oeste', enabled: true },
];

export default function StoreProfileScreen() {
    const router = useRouter();
    const { vendorProfile, updateVendorProfile, isLoading } = useContext(VendorContext);
    const { userData } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        business_type: BUSINESS_TYPES[0],
        logo: null,
        cover_image: null,
        delivery_fee: '',
        min_order_amount: '',
        estimated_delivery_time: '',
        is_open: true,
        delivery_zones: DELIVERY_ZONES,
        business_hours: {
            monday: { open: '09:00', close: '22:00', enabled: true },
            tuesday: { open: '09:00', close: '22:00', enabled: true },
            wednesday: { open: '09:00', close: '22:00', enabled: true },
            thursday: { open: '09:00', close: '22:00', enabled: true },
            friday: { open: '09:00', close: '22:00', enabled: true },
            saturday: { open: '10:00', close: '23:00', enabled: true },
            sunday: { open: '10:00', close: '21:00', enabled: false },
        },
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (vendorProfile) {
            setFormData({
                business_name: vendorProfile.business_name || '',
                description: vendorProfile.description || '',
                address: vendorProfile.address || '',
                phone: vendorProfile.phone || userData?.phone || '',
                email: vendorProfile.email || userData?.email || '',
                business_type: vendorProfile.business_type || BUSINESS_TYPES[0],
                logo: vendorProfile.logo ? { uri: vendorProfile.logo } : null,
                cover_image: vendorProfile.cover_image ? { uri: vendorProfile.cover_image } : null,
                delivery_fee: vendorProfile.delivery_fee?.toString() || '',
                min_order_amount: vendorProfile.min_order_amount?.toString() || '',
                estimated_delivery_time: vendorProfile.estimated_delivery_time?.toString() || '',
                is_open: vendorProfile.is_open ?? true,
                delivery_zones: vendorProfile.delivery_zones || DELIVERY_ZONES,
                business_hours: vendorProfile.business_hours || formData.business_hours,
            });
        }
    }, [vendorProfile, userData]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.business_name.trim()) {
            newErrors.business_name = 'El nombre del negocio es obligatorio';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'La dirección es obligatoria';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'El teléfono es obligatorio';
        }

        if (formData.delivery_fee && (isNaN(parseFloat(formData.delivery_fee)) || parseFloat(formData.delivery_fee) < 0)) {
            newErrors.delivery_fee = 'Ingresa una tarifa de envío válida';
        }

        if (formData.min_order_amount && (isNaN(parseFloat(formData.min_order_amount)) || parseFloat(formData.min_order_amount) < 0)) {
            newErrors.min_order_amount = 'Ingresa un monto mínimo válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async (imageType) => {
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
            aspect: imageType === 'logo' ? [1, 1] : [16, 9],
            quality: 0.8,
            maxWidth: 800,
            maxHeight: imageType === 'logo' ? 800 : 450,
        });

        if (!result.canceled) {
            updateField(imageType, {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: `${imageType}_${Date.now()}.jpg`,
            });
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Error', 'Por favor corrige los errores en el formulario');
            return;
        }

        try {
            const profileData = {
                business_name: formData.business_name.trim(),
                description: formData.description.trim(),
                address: formData.address.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                business_type: formData.business_type,
                delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : null,
                min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
                estimated_delivery_time: formData.estimated_delivery_time ? parseInt(formData.estimated_delivery_time) : null,
                is_open: formData.is_open,
                delivery_zones: formData.delivery_zones,
                business_hours: formData.business_hours,
                ...(formData.logo && { logo: formData.logo }),
                ...(formData.cover_image && { cover_image: formData.cover_image }),
            };

            const result = await updateVendorProfile(profileData);
            if (result.success) {
                Alert.alert('Éxito', 'Perfil actualizado correctamente');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        }
    };

    const updateBusinessHours = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            business_hours: {
                ...prev.business_hours,
                [day]: {
                    ...prev.business_hours[day],
                    [field]: value,
                },
            },
        }));
    };

    const updateDeliveryZone = (index, enabled) => {
        const updatedZones = [...formData.delivery_zones];
        updatedZones[index].enabled = enabled;
        updateField('delivery_zones', updatedZones);
    };

    const renderImageSection = (imageType, title, aspectRatio) => (
        <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>{title}</Text>
            <TouchableOpacity
                style={[
                    styles.imageContainer,
                    imageType === 'logo' ? styles.logoContainer : styles.coverContainer
                ]}
                onPress={() => pickImage(imageType)}
            >
                {formData[imageType] ? (
                    <Image
                        source={{ uri: formData[imageType].uri }}
                        style={[
                            styles.image,
                            imageType === 'logo' ? styles.logoImage : styles.coverImage
                        ]}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name={imageType === 'logo' ? 'storefront-outline' : 'image-outline'}
                            size={imageType === 'logo' ? 32 : 48}
                            color="#ccc"
                        />
                        <Text style={styles.imagePlaceholderText}>
                            Toca para {imageType === 'logo' ? 'agregar logo' : 'agregar imagen de portada'}
                        </Text>
                    </View>
                )}
                <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="#FFF" />
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

    const renderBusinessTypeSelector = () => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de negocio</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
            >
                {BUSINESS_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.categoryChip,
                            formData.business_type === type && styles.selectedCategoryChip
                        ]}
                        onPress={() => updateField('business_type', type)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            formData.business_type === type && styles.selectedCategoryChipText
                        ]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderBusinessHours = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios de atención</Text>
            {Object.entries(formData.business_hours).map(([day, hours]) => (
                <View key={day} style={styles.businessHourRow}>
                    <View style={styles.dayContainer}>
                        <Text style={styles.dayLabel}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Text>
                        <Switch
                            value={hours.enabled}
                            onValueChange={(value) => updateBusinessHours(day, 'enabled', value)}
                            trackColor={{ false: '#767577', true: '#4CAF50' }}
                            thumbColor={hours.enabled ? '#ffffff' : '#f4f3f4'}
                        />
                    </View>
                    {hours.enabled && (
                        <View style={styles.timeContainer}>
                            <TextInput
                                style={styles.timeInput}
                                placeholder="09:00"
                                value={hours.open}
                                onChangeText={(value) => updateBusinessHours(day, 'open', value)}
                            />
                            <Text style={styles.timeSeparator}>-</Text>
                            <TextInput
                                style={styles.timeInput}
                                placeholder="22:00"
                                value={hours.close}
                                onChangeText={(value) => updateBusinessHours(day, 'close', value)}
                            />
                        </View>
                    )}
                </View>
            ))}
        </View>
    );

    const renderDeliveryZones = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zonas de delivery</Text>
            {formData.delivery_zones.map((zone, index) => (
                <View key={index} style={styles.zoneRow}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Switch
                        value={zone.enabled}
                        onValueChange={(value) => updateDeliveryZone(index, value)}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        thumbColor={zone.enabled ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
            ))}
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
                    {/* Imágenes */}
                    {renderImageSection('cover_image', 'Imagen de portada', [16, 9])}
                    {renderImageSection('logo', 'Logo del negocio', [1, 1])}

                    {/* Información básica */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información básica</Text>

                        {renderInput('business_name', 'Nombre del negocio', 'Ej: Pizzería Don Juan', { required: true })}

                        {renderInput('description', 'Descripción', 'Describe tu negocio...', {
                            multiline: true,
                            numberOfLines: 3
                        })}

                        {renderBusinessTypeSelector()}

                        {renderInput('address', 'Dirección', 'Dirección completa', { required: true })}

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                {renderInput('phone', 'Teléfono', '+54 9 11 1234-5678', {
                                    keyboardType: 'phone-pad',
                                    required: true
                                })}
                            </View>
                            <View style={styles.halfWidth}>
                                {renderInput('email', 'Email', 'contacto@negocio.com', {
                                    keyboardType: 'email-address'
                                })}
                            </View>
                        </View>
                    </View>

                    {/* Configuración de delivery */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Configuración de delivery</Text>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                {renderInput('delivery_fee', 'Costo de envío', '0.00', {
                                    keyboardType: 'decimal-pad'
                                })}
                            </View>
                            <View style={styles.halfWidth}>
                                {renderInput('min_order_amount', 'Pedido mínimo', '0.00', {
                                    keyboardType: 'decimal-pad'
                                })}
                            </View>
                        </View>

                        {renderInput('estimated_delivery_time', 'Tiempo estimado (minutos)', '30', {
                            keyboardType: 'number-pad'
                        })}
                    </View>

                    {/* Zonas de delivery */}
                    {renderDeliveryZones()}

                    {/* Horarios */}
                    {renderBusinessHours()}

                    {/* Estado del negocio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estado del negocio</Text>
                        <View style={styles.switchContainer}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Negocio abierto</Text>
                                <Text style={styles.switchDescription}>
                                    Los clientes {formData.is_open ? 'pueden' : 'no pueden'} hacer pedidos
                                </Text>
                            </View>
                            <Switch
                                value={formData.is_open}
                                onValueChange={(value) => updateField('is_open', value)}
                                trackColor={{ false: '#767577', true: '#4CAF50' }}
                                thumbColor={formData.is_open ? '#ffffff' : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title="Guardar cambios"
                            onPress={handleSubmit}
                            loading={isLoading}
                            disabled={isLoading}
                        />
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    imageSection: {
        marginBottom: 24,
    },
    imageSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    imageContainer: {
        position: 'relative',
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
    logoContainer: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        borderRadius: 60,
    },
    coverContainer: {
        height: 160,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoImage: {
        borderRadius: 60,
    },
    coverImage: {},
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    imagePlaceholderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        width: 32,
        height: 32,
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
    businessHourRow: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textTransform: 'capitalize',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        minWidth: 80,
    },
    timeSeparator: {
        fontSize: 16,
        color: '#666',
        marginHorizontal: 12,
    },
    zoneRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    zoneName: {
        fontSize: 16,
        color: '#333',
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
});
