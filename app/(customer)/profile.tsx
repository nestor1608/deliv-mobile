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
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { NotificationContext } from '../../src/context/NotificationContext';
import { LanguageContext } from '../../src/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getItem, setItem } from '../../src/utils/storage';

export default function ProfileScreen() {
    const router = useRouter();
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
        address: (userData as any)?.address || '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await getItem('userSettings');
            if (stored) {
                setSettings(stored);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await setItem('userSettings', newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const handleEditProfile = () => {
        setEditData({
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            email: userData?.email || '',
            phone: userData?.phone || '',
            address: userData?.address || '',
        });
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await updateProfile(editData);
            setShowEditModal(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: () => logout()
                }
            ]
        );
    };

    const handleChangeLanguage = (lang) => {
        switchLanguage(lang);
        setShowLanguagePicker(false);
    };

    const toggleSetting = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
    };

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
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditProfile}
                >
                    <Icon name="edit" size={24} color="#007BFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {userData?.avatar ? (
                            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="person" size={40} color="#FFF" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraButton}>
                            <Icon name="camera-alt" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>
                        {userData?.first_name || ''} {userData?.last_name || ''}
                    </Text>
                    <Text style={styles.userEmail}>{userData?.email || ''}</Text>
                    <Text style={styles.userPhone}>{userData?.phone || ''}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => router.push('/address-book')}
                        >
                            <Icon name="location-on" size={24} color="#4CAF50" />
                            <Text style={styles.quickActionText}>Direcciones</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => router.push('/payment-methods')}
                        >
                            <Icon name="payment" size={24} color="#2196F3" />
                            <Text style={styles.quickActionText}>Pagos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => router.push('/order-history')}
                        >
                            <Icon name="receipt" size={24} color="#FF9800" />
                            <Text style={styles.quickActionText}>Pedidos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => router.push('/ride-history')}
                        >
                            <Icon name="directions-car" size={24} color="#9C27B0" />
                            <Text style={styles.quickActionText}>Viajes</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    <View style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => setShowLanguagePicker(true)}
                        >
                            <Icon name="language" size={24} color="#666" />
                            <Text style={styles.settingText}>Idioma</Text>
                            <Text style={styles.settingValue}>
                                {i18n.language === 'es' ? 'Español' : 'English'}
                            </Text>
                            <Icon name="chevron-right" size={24} color="#CCC" />
                        </TouchableOpacity>

                        <View style={styles.settingItem}>
                            <Icon name="notifications" size={24} color="#666" />
                            <Text style={styles.settingText}>Notificaciones</Text>
                            <Switch
                                value={settings.notifications}
                                onValueChange={() => toggleSetting('notifications')}
                                trackColor={{ false: '#DDD', true: '#81C784' }}
                                thumbColor={settings.notifications ? '#4CAF50' : '#F5F5F5'}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <Icon name="location-on" size={24} color="#666" />
                            <Text style={styles.settingText}>Compartir ubicación</Text>
                            <Switch
                                value={settings.locationSharing}
                                onValueChange={() => toggleSetting('locationSharing')}
                                trackColor={{ false: '#DDD', true: '#81C784' }}
                                thumbColor={settings.locationSharing ? '#4CAF50' : '#F5F5F5'}
                            />
                        </View>
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Soporte</Text>
                    <View style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => Linking.openURL('mailto:soporte@dely.com')}
                        >
                            <Icon name="email" size={24} color="#666" />
                            <Text style={styles.settingText}>Ayuda</Text>
                            <Icon name="chevron-right" size={24} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => router.push('/notifications')}
                        >
                            <Icon name="info" size={24} color="#666" />
                            <Text style={styles.settingText}>Acerca de</Text>
                            <Icon name="chevron-right" size={24} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Icon name="logout" size={24} color="#F44336" />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowEditModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Editar Perfil</Text>
                        <TouchableOpacity onPress={handleSaveProfile} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#007BFF" />
                            ) : (
                                <Text style={styles.saveText}>Guardar</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                value={editData.first_name}
                                onChangeText={(text) => setEditData({ ...editData, first_name: text })}
                                placeholder="Nombre"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Apellido</Text>
                            <TextInput
                                style={styles.input}
                                value={editData.last_name}
                                onChangeText={(text) => setEditData({ ...editData, last_name: text })}
                                placeholder="Apellido"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editData.email}
                                onChangeText={(text) => setEditData({ ...editData, email: text })}
                                placeholder="Email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                value={editData.phone}
                                onChangeText={(text) => setEditData({ ...editData, phone: text })}
                                placeholder="Teléfono"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Dirección</Text>
                            <TextInput
                                style={styles.input}
                                value={editData.address}
                                onChangeText={(text) => setEditData({ ...editData, address: text })}
                                placeholder="Dirección"
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Language Picker Modal */}
            <Modal
                visible={showLanguagePicker}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowLanguagePicker(false)}
            >
                <TouchableOpacity
                    style={styles.languageOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLanguagePicker(false)}
                >
                    <View style={styles.languageModal}>
                        <Text style={styles.languageTitle}>Seleccionar idioma</Text>
                        <TouchableOpacity
                            style={styles.languageOption}
                            onPress={() => handleChangeLanguage('es')}
                        >
                            <Text style={styles.languageText}>Español</Text>
                            {i18n.language === 'es' && <Icon name="check" size={24} color="#4CAF50" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.languageOption}
                            onPress={() => handleChangeLanguage('en')}
                        >
                            <Text style={styles.languageText}>English</Text>
                            {i18n.language === 'en' && <Icon name="check" size={24} color="#4CAF50" />}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

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
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 12,
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
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: '#FFF',
        marginBottom: 12,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
    },
    quickAction: {
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 12,
        color: '#333',
        marginTop: 8,
    },
    settingsCard: {
        paddingHorizontal: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    settingValue: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        marginTop: 12,
    },
    logoutText: {
        fontSize: 16,
        color: '#F44336',
        marginLeft: 8,
    },
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveText: {
        fontSize: 16,
        color: '#007BFF',
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
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
    },
    languageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageModal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '80%',
    },
    languageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    languageText: {
        fontSize: 16,
        color: '#333',
    },
});
