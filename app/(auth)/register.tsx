import React, { useState, useContext } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { AuthContext } from '../../src/context/AuthContext';

export default function RegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userType = params.userType || 'customer';
    const { register: registerContext } = useContext(AuthContext);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !phone || !password || !confirmPassword) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const first_name = name.split(' ')[0] || '';
            const last_name = name.split(' ').slice(1).join(' ') || '';
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

            await registerContext({
                username: username,
                email: email,
                password: password,
                password_confirm: confirmPassword,
                first_name: first_name,
                last_name: last_name,
                phone_number: phone,
                role: userType,
            });
        } catch (error) {
            Alert.alert('Error de Registro', error.message || 'Intente nuevamente más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Icon name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Crear Cuenta</Text>
                        <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>

                        <View style={styles.form}>
                            <Input
                                placeholder="Nombre completo"
                                value={name}
                                onChangeText={setName}
                                leftIcon={<Icon name="person" size={20} color="#666" />}
                            />
                            <Input
                                placeholder="Correo electrónico"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                leftIcon={<Icon name="email" size={20} color="#666" />}
                            />
                            <Input
                                placeholder="Teléfono (ej: +5491112223344)"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                leftIcon={<Icon name="phone" size={20} color="#666" />}
                            />
                            <Input
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                leftIcon={<Icon name="lock" size={20} color="#666" />}
                            />
                            <Input
                                placeholder="Confirmar contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                leftIcon={<Icon name="lock" size={20} color="#666" />}
                            />
                            <Button
                                title="Registrarse"
                                onPress={handleRegister}
                                loading={loading}
                            />
                        </View>

                        <Text style={styles.terms}>
                            Al registrarte, aceptas nuestros{' '}
                            <Text style={styles.termsLink}>Términos de Servicio</Text>
                            {' '}y{' '}
                            <Text style={styles.termsLink}>Política de Privacidad</Text>
                        </Text>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.loginText}>
                                ¿Ya tienes cuenta? <Text style={styles.loginLink}>Inicia sesión</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    terms: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
    termsLink: {
        color: '#007BFF',
    },
    loginLink: {
        alignSelf: 'center',
        paddingVertical: 16,
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        color: '#007BFF',
        fontWeight: '600',
    },
});
