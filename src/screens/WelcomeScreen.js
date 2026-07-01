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
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

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
      available: true, // Deshabilitado por ahora
    },
    {
      id: 'delivery',
      title: 'Repartidor',
      subtitle: 'Entrega pedidos',
      icon: 'delivery-dining',
      color: '#FF9800',
      available: true, // Deshabilitado por ahora
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
              <Text style={styles.sectionTitle}>¿Cómo quieres usar Dely?</Text>
              
              {userTypes.map((userType) => (
                <TouchableOpacity
                  key={userType.id}
                  style={[
                    styles.userTypeButton,
                    !userType.available && styles.disabledButton
                  ]}
                  onPress={() => {
                    if (userType.available) {
                      navigation.navigate('Login', { userType: userType.id });
                    }
                  }}
                  disabled={!userType.available}
                >
                  <View style={[styles.userTypeIcon, { backgroundColor: userType.color }]}>
                    <Icon name={userType.icon} size={24} color="#FFF" />
                  </View>
                  <View style={styles.userTypeInfo}>
                    <Text style={[
                      styles.userTypeTitle,
                      !userType.available && styles.disabledText
                    ]}>
                      {userType.title}
                    </Text>
                    <Text style={[
                      styles.userTypeSubtitle,
                      !userType.available && styles.disabledText
                    ]}>
                      {userType.subtitle}
                    </Text>
                  </View>
                  {userType.available ? (
                    <Icon name="chevron-right" size={24} color="#FFF" />
                  ) : (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Próximamente</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>
                  ¿No tienes cuenta? <Text style={styles.registerBold}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
              
              <View style={styles.footerLinks}>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Términos y Condiciones</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}>•</Text>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Política de Privacidad</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  userTypesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  userTypeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.4)',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,152,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  registerLink: {
    marginBottom: 20,
  },
  registerText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  registerBold: {
    fontWeight: 'bold',
    color: '#FFF',
    textDecorationLine: 'underline',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    paddingHorizontal: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
});

export default WelcomeScreen;