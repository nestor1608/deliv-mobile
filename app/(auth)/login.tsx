import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { AuthContext } from '../../src/context/AuthContext';
import { paramToString } from '../../src/utils/params';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userType = paramToString(params.userType);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginAttempts, setLoginAttempts] = useState(0);

    const { login } = useContext(AuthContext);

    useEffect(() => {
        // Validar que se haya pasado el tipo de usuario
        if (!userType) {
            Alert.alert('Error', 'Tipo de usuario no especificado', [
                { text: 'Volver', onPress: () => router.back() }
            ]);
        }
    }, [userType]);

    const validateForm = () => {
        const newErrors = {};

        // Validar username/email
        if (!formData.username.trim()) {
            newErrors.username = 'El usuario o email es requerido';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Debe tener al menos 3 caracteres';
        }

        // Validar password
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 4) {
            newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value.trim()
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setLoginAttempts(prev => prev + 1);

        try {
            await login(formData.username, formData.password, userType);
            // AuthContext se encarga de la navegación al home
        } catch (error) {
            const errorMessage = error.message || 'Error al iniciar sesión';

            // Mostrar mensaje específico según el tipo de error
            if (errorMessage.includes('不同意') || errorMessage.includes('Invalid credentials')) {
                Alert.alert('Credenciales inválidas', 'Usuario o contraseña incorrectos. Intenta nuevamente.');
            } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
                Alert.alert('Error de conexión', 'No se pudo conectar al servidor. Verifica tu conexión a internet.');
            } else {
                Alert.alert('Error de inicio de sesión', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Recuperar contraseña',
            'Se enviará un enlace de recuperación a tu correo electrónico',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Enviar', onPress: () => {} }
            ]
        );
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
                        <Text style={styles.title}>¡Bienvenido!</Text>
                        <Text style={styles.subtitle}>
                            Inicia sesión como {userType === 'customer' ? 'Cliente' : userType === 'vendor' ? 'Comercio' : 'Repartidor'}
                        </Text>

                        <View style={styles.form}>
                            <Input
                                placeholder="Usuario o email"
                                value={formData.username}
                                onChangeText={(value) => handleInputChange('username', value)}
                                error={errors.username}
                                autoCapitalize="none"
                                autoCorrect={false}
                                leftIcon={<Icon name="person" size={20} color="#666" />}
                            />

                            <Input
                                placeholder="Contraseña"
                                value={formData.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                error={errors.password}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                leftIcon={<Icon name="lock" size={20} color="#666" />}
                                rightIcon={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Icon
                                            name={showPassword ? "visibility-off" : "visibility"}
                                            size={20}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                }
                            />

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={handleForgotPassword}
                            >
                                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>

                            <Button
                                title="Iniciar Sesión"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                            />

                            {loginAttempts >= 3 && (
                                <Text style={styles.attemptsWarning}>
                                    ¿Has tenido problemas? Contacta a soporte
                                </Text>
                            )}
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>o</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.registerLink}
                            onPress={() => router.push('/register')}
                        >
                            <Text style={styles.registerText}>
                                ¿No tienes cuenta? <Text style={styles.registerLink}>Regístrate</Text>
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007BFF',
        fontSize: 14,
    },
    attemptsWarning: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginTop: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    dividerText: {
        color: '#666',
        fontSize: 14,
        marginHorizontal: 16,
    },
    registerLink: {
        alignSelf: 'center',
        paddingVertical: 16,
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerLink: {
        color: '#007BFF',
        fontWeight: '600',
    },
});
