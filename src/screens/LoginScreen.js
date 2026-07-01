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
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Input from '../components/Input';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const userType = route.params?.userType;
  
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
        { text: 'Volver', onPress: () => navigation.goBack() }
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
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleLogin = async () => {
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    // Verificar intentos de login (rate limiting básico del lado cliente)
    if (loginAttempts >= 5) {
      Alert.alert(
        'Demasiados intentos',
        'Has intentado iniciar sesión demasiadas veces. Espera unos minutos antes de intentar nuevamente.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    
    try {
      await login(formData.username, formData.password, userType);
      
      // Limpiar intentos al loguearse exitosamente
      setLoginAttempts(0);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Incrementar intentos fallidos
      setLoginAttempts(prev => prev + 1);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al iniciar sesión';
      let errorTitle = 'Error';
      
      if (error.message) {
        if (error.message.includes('Credenciales inválidas')) {
          errorTitle = 'Credenciales incorrectas';
          errorMessage = 'El usuario/email o contraseña son incorrectos. Verifica tus datos e intenta nuevamente.';
        } else if (error.message.includes('permisos')) {
          errorTitle = 'Sin permisos';
          errorMessage = `No tienes permisos para acceder como ${getUserTypeLabel(userType)}. Verifica tu tipo de cuenta.`;
        } else if (error.message.includes('Cuenta inactiva')) {
          errorTitle = 'Cuenta inactiva';
          errorMessage = 'Tu cuenta está inactiva. Contacta con soporte para más información.';
        } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
          errorTitle = 'Error de conexión';
          errorMessage = 'Problemas de conexión. Verifica tu internet e intenta nuevamente.';
        } else if (error.message.includes('servidor')) {
          errorTitle = 'Error del servidor';
          errorMessage = 'Error temporal del servidor. Intenta nuevamente en unos minutos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'OK', style: 'default' },
        ...(loginAttempts >= 3 ? [{
          text: '¿Olvidaste tu contraseña?',
          onPress: () => navigation.navigate('PasswordReset'),
          style: 'default'
        }] : [])
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      customer: 'Cliente',
      vendor: 'Comercio',
      delivery: 'Repartidor',
      admin: 'Administrador'
    };
    return labels[type] || type;
  };

  const getUserTypeIcon = (type) => {
    const icons = {
      customer: 'person',
      vendor: 'store',
      delivery: 'delivery-dining',
      admin: 'admin-panel-settings'
    };
    return icons[type] || 'person';
  };

  const getUserTypeColor = (type) => {
    const colors = {
      customer: '#4CAF50',
      vendor: '#2196F3',
      delivery: '#FF9800',
      admin: '#9C27B0'
    };
    return colors[type] || '#4CAF50';
  };

  if (!userType) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#F44336" />
          <Text style={styles.errorText}>Error: Tipo de usuario no especificado</Text>
          <Button 
            title="Volver" 
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={[styles.userTypeIndicator, { backgroundColor: getUserTypeColor(userType) }]}>
              <Icon name={getUserTypeIcon(userType)} size={32} color="#FFF" />
            </View>
            
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>
              Como {getUserTypeLabel(userType)}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Usuario o Email"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              error={errors.username}
              leftIcon="person"
            />
            
            <Input
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.password}
              leftIcon="lock"
              rightIcon={showPassword ? "visibility-off" : "visibility"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {loginAttempts > 0 && (
              <View style={styles.attemptsWarning}>
                <Icon name="warning" size={16} color="#FF9800" />
                <Text style={styles.attemptsText}>
                  Intentos fallidos: {loginAttempts}/5
                </Text>
              </View>
            )}

            <Button 
              title={loading ? "Iniciando sesión..." : "Iniciar sesión"}
              onPress={handleLogin} 
              loading={loading}
              disabled={loading}
              style={[styles.loginButton, { backgroundColor: getUserTypeColor(userType) }]}
            />

            {/* Links adicionales */}
            <View style={styles.linksContainer}>
              <TouchableOpacity 
                style={styles.link}
                onPress={() => navigation.navigate('PasswordReset')}
              >
                <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.link}
                onPress={() => navigation.navigate('Register', { userType })}
              >
                <Text style={styles.linkText}>
                  ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al iniciar sesión, aceptas nuestros{' '}
              <Text style={styles.footerLink}>Términos y Condiciones</Text>
              {' '}y{' '}
              <Text style={styles.footerLink}>Política de Privacidad</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  userTypeIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  attemptsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  attemptsText: {
    color: '#E65100',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
    height: 50,
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default LoginScreen;