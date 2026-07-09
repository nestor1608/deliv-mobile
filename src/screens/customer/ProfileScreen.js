// src/screens/customer/ProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Switch,
    Modal,
    TextInput,
    Image,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LanguageContext } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, logout, updateProfile } = useContext(AuthContext);
    const { unreadCount } = useContext(NotificationContext);
    const { switchLanguage } = useContext(LanguageContext);
    const { t } = useTranslation();
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        notifications: true,
        orderUpdates: true,
        promotions: false,
        darkMode: false,
        locationSharing: true,
    });
    
    const [editData, setEditData] = useState({
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        address: userData?.address || '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem('userSettings');
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const handleEditProfile = async () => {
        if (!editData.first_name.trim() || !editData.email.trim()) {
            Alert.alert('Error', 'Nombre y email son obligatorios');
            return;
        }

        setLoading(true);
        try {
            await updateProfile(editData);
            setShowEditModal(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleImagePicker = async () => {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (result.granted === false) {
            Alert.alert('Error', 'Se necesitan permisos para acceder a las fotos');
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!pickerResult.canceled) {
            // Aquí implementarías la subida de imagen al servidor
            // const uploadedUrl = await uploadImage(pickerResult.assets[0].uri);
            // await updateProfile({ avatar: uploadedUrl });
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar sesión', style: 'destructive', onPress: logout }
            ]
        );
    };

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
    };

    const openSupport = () => {
        Alert.alert(
            'Soporte',
            'Selecciona una opción:',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/1234567890') },
                { text: 'Email', onPress: () => Linking.openURL('mailto:soporte@dely.com') },
                { text: 'Llamar', onPress: () => Linking.openURL('tel:+1234567890') }
            ]
        );
    };

    const menuItems = [
        {
            id: 'orders',
            title: 'Mis Pedidos',
            icon: 'shopping-bag',
            onPress: () => navigation.navigate('OrderHistory'),
            showBadge: false,
        },
        {
            id: 'rides',
            title: 'Mis Viajes',
            icon: 'directions-car',
            onPress: () => navigation.navigate('RideHistory'),
            showBadge: false,
        },
        {
            id: 'notifications',
            title: 'Notificaciones',
            icon: 'notifications',
            onPress: () => navigation.navigate('Notifications'),
            showBadge: unreadCount > 0,
            badgeCount: unreadCount,
        },
        {
            id: 'addresses',
            title: 'Mis Direcciones',
            icon: 'location-on',
            onPress: () => navigation.navigate('AddressBook'),
            showBadge: false,
        },
        {
            id: 'payment',
            title: 'Métodos de Pago',
            icon: 'payment',
            onPress: () => navigation.navigate('PaymentMethods'),
            showBadge: false,
        },
        {
            id: 'favorites',
            title: 'Favoritos',
            icon: 'favorite',
            onPress: () => navigation.navigate('Favorites'),
            showBadge: false,
        },
        {
            id: 'support',
            title: 'Ayuda y Soporte',
            icon: 'help-outline',
            onPress: openSupport,
            showBadge: false,
        },
        {
            id: 'about',
            title: 'Acerca de',
            icon: 'info-outline',
            onPress: () => navigation.navigate('About'),
            showBadge: false,
        },
    ];

    const renderEditModal = () => (
        <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowEditModal(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity 
                        onPress={() => setShowEditModal(false)}
                        style={styles.modalCloseButton}
                    >
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Editar Perfil</Text>
                    <TouchableOpacity 
                        onPress={handleEditProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#2196F3" />
                        ) : (
                            <Text style={styles.saveButton}>Guardar</Text>
                        )}
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.first_name}
                            onChangeText={(text) => setEditData({...editData, first_name: text})}
                            placeholder="Tu nombre"
                        />
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Apellido</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.last_name}
                            onChangeText={(text) => setEditData({...editData, last_name: text})}
                            placeholder="Tu apellido"
                        />
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.email}
                            onChangeText={(text) => setEditData({...editData, email: text})}
                            placeholder="tu@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.phone}
                            onChangeText={(text) => setEditData({...editData, phone: text})}
                            placeholder="+54 9 11 1234-5678"
                            keyboardType="phone-pad"
                        />
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dirección</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.address}
                            onChangeText={(text) => setEditData({...editData, address: text})}
                            placeholder="Tu dirección principal"
                            multiline
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );

    const renderMenuItem = (item) => (
        <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                    <Icon name={item.icon} size={24} color="#666" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            
            <View style={styles.menuItemRight}>
                {item.showBadge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </Text>
                    </View>
                )}
                <Icon name="chevron-right" size={24} color="#CCC" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setShowEditModal(true)}
                >
                    <Icon name="edit" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <TouchableOpacity 
                        style={styles.avatarContainer}
                        onPress={handleImagePicker}
                    >
                        {userData?.avatar ? (
                            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="person" size={40} color="#FFF" />
                            </View>
                        )}
                        <View style={styles.avatarEditIcon}>
                            <Icon name="camera-alt" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={styles.userName}>
                        {userData?.first_name} {userData?.last_name}
                    </Text>
                    <Text style={styles.userEmail}>{userData?.email}</Text>
                    
                    {userData?.phone && (
                        <Text style={styles.userPhone}>{userData.phone}</Text>
                    )}
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map(renderMenuItem)}
                </View>

                {/* Language */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguagePicker(!showLanguagePicker)}>
                        <View style={styles.settingLeft}>
                            <Icon name="language" size={24} color="#666" />
                            <Text style={styles.settingText}>{t('profile.language')}</Text>
                        </View>
                        <Text style={styles.settingValue}>{i18n.language === 'es' ? 'Español' : 'English'}</Text>
                    </TouchableOpacity>
                    {showLanguagePicker && (
                        <View>
                            <TouchableOpacity style={styles.languageOption} onPress={() => { switchLanguage('es'); setShowLanguagePicker(false); }}>
                                <Text style={[styles.languageText, i18n.language === 'es' && styles.languageActive]}>Español</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.languageOption} onPress={() => { switchLanguage('en'); setShowLanguagePicker(false); }}>
                                <Text style={[styles.languageText, i18n.language === 'en' && styles.languageActive]}>English</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Settings */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>{t('profile.notifications')}</Text>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Icon name="notifications" size={24} color="#666" />
                            <Text style={styles.settingText}>Notificaciones</Text>
                        </View>
                        <Switch
                            value={settings.notifications}
                            onValueChange={(value) => handleSettingChange('notifications', value)}
                            trackColor={{ false: '#DDD', true: '#2196F3' }}
                        />
                    </View>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Icon name="shopping-bag" size={24} color="#666" />
                            <Text style={styles.settingText}>Actualizaciones de pedidos</Text>
                        </View>
                        <Switch
                            value={settings.orderUpdates}
                            onValueChange={(value) => handleSettingChange('orderUpdates', value)}
                            trackColor={{ false: '#DDD', true: '#2196F3' }}
                        />
                    </View>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Icon name="local-offer" size={24} color="#666" />
                            <Text style={styles.settingText}>Promociones</Text>
                        </View>
                        <Switch
                            value={settings.promotions}
                            onValueChange={(value) => handleSettingChange('promotions', value)}
                            trackColor={{ false: '#DDD', true: '#2196F3' }}
                        />
                    </View>
                    
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Icon name="location-on" size={24} color="#666" />
                            <Text style={styles.settingText}>Compartir ubicación</Text>
                        </View>
                        <Switch
                            value={settings.locationSharing}
                            onValueChange={(value) => handleSettingChange('locationSharing', value)}
                            trackColor={{ false: '#DDD', true: '#2196F3' }}
                        />
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Icon name="logout" size={24} color="#FF6B6B" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {renderEditModal()}
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
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEditIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 16,
        color: '#666',
    },
    menuSection: {
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    settingsSection: {
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    logoutSection: {
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF6B6B',
        marginLeft: 12,
        fontWeight: '600',
    },
    languageOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    languageText: {
        fontSize: 16,
        color: '#333',
    },
    languageActive: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    settingValue: {
        fontSize: 16,
        color: '#666',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    formGroup: {
        marginVertical: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FFF',
    },
});

export default ProfileScreen;