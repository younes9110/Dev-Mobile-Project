import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signUp } from '../services/firebaseAuth';
import { isDoctor } from '../services/doctorService';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return false;
    }
    if (!password.trim()) {
      setError('Veuillez entrer votre mot de passe');
      return false;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (!isLogin) {
      if (!name.trim()) {
        setError('Veuillez entrer votre nom complet');
        return false;
      }
      if (!phone.trim()) {
        setError('Veuillez entrer votre numéro de téléphone');
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    // Clear previous errors
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        // Sign in
        result = await signIn(email.trim(), password);
      } else {
        // Sign up
        result = await signUp(email.trim(), password, name.trim(), phone.trim());
      }

      if (result.success) {
        // Small delay to ensure user data is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user is a doctor
        const doctorStatus = await isDoctor();
        console.log('Doctor status after login:', doctorStatus);
        
        if (doctorStatus) {
          // Navigate to doctor dashboard
          console.log('Redirecting to DoctorDashboard');
          navigation.replace('DoctorDashboard');
        } else {
          // Navigate to regular home
          console.log('Redirecting to Accueil');
          navigation.replace('Accueil');
        }
      } else {
        // Show error message
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    // Clear form when switching
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  const handleGuestLogin = async () => {
    try {
      // Set guest mode flag
      await AsyncStorage.setItem('guest_mode', 'true');
      // Navigate to home screen as guest
      navigation.replace('Accueil');
    } catch (error) {
      console.error('Error setting guest mode:', error);
      setError('Impossible de continuer en tant qu\'invité');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Ionicons name="medical" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Tabib</Text>
          </View>
          <Text style={styles.subtitle}>
            {isLogin ? 'Connectez-vous' : 'Créez votre compte'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#D32F2F" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchMode}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? 'Pas de compte ? S\'inscrire'
                : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
            disabled={loading}
          >
            <Ionicons name="person-outline" size={20} color="#00897B" style={styles.guestIcon} />
            <Text style={styles.guestButtonText}>Continuer en tant qu'invité</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00897B',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00897B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#00897B',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00897B',
  },
  guestIcon: {
    marginRight: 8,
  },
  guestButtonText: {
    color: '#00897B',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 