import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Button from '../../src/components/Button';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    const userTypes = [
        {
            id: 'customer',
            title: 'Cliente',
            subtitle: 'Pide comida y viajes',
            icon: 'person',
            color: '#4CAF50',
            available: true,
        },
        {
            id: 'vendor',
            title: 'Comercio',
            subtitle: 'Vende tus productos',
            icon: 'store',
            color: '#2196F3',
            available: true,
        },
        {
            id: 'delivery',
            title: 'Repartidor',
            subtitle: 'Entrega pedidos',
            icon: 'delivery-dining',
            color: '#FF9800',
            available: true,
        },
        {
            id: 'driver',
            title: 'Conductor',
            subtitle: 'Gana dinero llevando pasajeros',
            icon: 'car',
            color: '#9C27B0',
            available: true,
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ImageBackground
                source={require('../../assets/icon.png')}
                style={styles.background}
                blurRadius={3}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        {/* Logo y título */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Icon name="local-shipping" size={48} color="#FFF" />
                            </View>
                            <Text style={styles.logoText}>Dely</Text>
                            <Text style={styles.tagline}>Tu plataforma de delivery y movilidad</Text>
                        </View>

                        {/* Opciones de usuario */}
                        <View style={styles.userTypesContainer}>
                            {userTypes.map((userType) => (
                                <TouchableOpacity
                                    key={userType.id}
                                    style={[
                                        styles.userTypeCard,
                                        { borderColor: userType.color },
                                        !userType.available && styles.disabledCard
                                    ]}
                                    onPress={() => {
                                        if (userType.available) {
                                            router.push({
                                                pathname: '/login',
                                                params: { userType: userType.id }
                                            });
                                        }
                                    }}
                                    disabled={!userType.available}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: userType.color }]}>
                                        <Icon name={userType.icon} size={28} color="#FFF" />
                                    </View>
                                    <View style={styles.userTypeTextContainer}>
                                        <Text style={styles.userTypeTitle}>{userType.title}</Text>
                                        <Text style={styles.userTypeSubtitle}>{userType.subtitle}</Text>
                                    </View>
                                    {userType.available ? (
                                        <Icon name="chevron-right" size={24} color={userType.color} />
                                    ) : (
                                        <Text style={styles.comingSoon}>Próx</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.footerLink}>Regístrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    userTypesContainer: {
        width: '100%',
        maxWidth: 350,
    },
    userTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    disabledCard: {
        opacity: 0.6,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userTypeTextContainer: {
        flex: 1,
    },
    userTypeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userTypeSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    comingSoon: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginRight: 8,
    },
    footerLink: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
