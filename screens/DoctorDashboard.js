import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isDoctor, getDoctorByEmail } from '../services/doctorService';
import { getCurrentUser, logOut } from '../services/firebaseAuth';
import { getDoctorAppointments } from '../services/doctorService';
import { readData } from '../services/firebaseDatabase';

export default function DoctorDashboard({ navigation }) {
  const [isUserDoctor, setIsUserDoctor] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointmentsCount, setAppointmentsCount] = useState({
    pending: 0,
    confirmed: 0,
    today: 0,
  });
  const unsubscribeRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    checkDoctorStatus();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const checkDoctorStatus = async () => {
    try {
      const doctorStatus = await isDoctor();
      setIsUserDoctor(doctorStatus);

      if (doctorStatus) {
        const user = getCurrentUser();
        console.log('Current user:', user);
        console.log('User email:', user?.email);
        
        if (user && user.email) {
          const doctorResult = await getDoctorByEmail(user.email);
          console.log('Doctor result:', doctorResult);
          
          if (doctorResult.success && doctorResult.doctor) {
            console.log('Setting doctor:', doctorResult.doctor);
            setDoctor(doctorResult.doctor);
            loadAppointments(doctorResult.doctor.id);
          } else {
            console.error('Failed to get doctor data:', doctorResult.error);
            // Even if we can't find the doctor in database, we can still show the dashboard
            // with basic info from the user
            const basicDoctor = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Médecin',
              email: user.email,
              specialty: 'Non spécifié',
            };
            setDoctor(basicDoctor);
            setLoading(false);
            Alert.alert(
              'Information',
              'Votre profil médecin n\'est pas complet dans la base de données. Veuillez contacter l\'administrateur.',
              [{ text: 'OK' }]
            );
          }
        } else {
          console.error('No user or email found');
          setLoading(false);
          Alert.alert(
            'Erreur',
            'Utilisateur non trouvé.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Auth'),
              },
            ]
          );
        }
      } else {
        setLoading(false);
        Alert.alert(
          'Accès refusé',
          'Vous n\'êtes pas autorisé à accéder à cette page.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Auth'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error in checkDoctorStatus:', error);
      setLoading(false);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du chargement.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Auth'),
          },
        ]
      );
    }
  };

  const loadAppointments = (doctorId) => {
    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to ensure loading doesn't stay forever
      timeoutRef.current = setTimeout(() => {
        console.log('Appointments loading timeout - setting loading to false');
        setLoading(false);
      }, 3000); // 3 second timeout

      // Unsubscribe from previous listener if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = getDoctorAppointments(doctorId, (appointments) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log('Appointments loaded:', appointments.length);
        
        const pending = appointments.filter(a => a.status === 'pending').length;
        const confirmed = appointments.filter(a => a.status === 'confirmed').length;
        
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(a => a.date === today).length;

        setAppointmentsCount({
          pending,
          confirmed,
          today: todayAppointments,
        });
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const result = await logOut();
            if (result.success) {
              navigation.replace('Auth');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isUserDoctor || !doctor) {
    return null;
  }

  const menuItems = [
    {
      id: 'appointments',
      title: 'Mes Rendez-vous',
      icon: 'calendar',
      color: '#00897B',
      screen: 'DoctorAppointments',
      description: 'Voir et gérer vos rendez-vous',
      badge: appointmentsCount.pending > 0 ? appointmentsCount.pending : null,
    },
    {
      id: 'patients',
      title: 'Mes Patients',
      icon: 'people',
      color: '#1976D2',
      screen: 'DoctorPatients',
      description: 'Voir la liste de vos patients',
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      icon: 'person',
      color: '#7B1FA2',
      screen: 'DoctorProfileEdit',
      description: 'Modifier votre profil',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {doctor.photo ? (
                <Image source={{ uri: doctor.photo }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={40} color="#00897B" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#00897B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={32} color="#FFA726" />
          <Text style={styles.statNumber}>{appointmentsCount.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color="#66BB6A" />
          <Text style={styles.statNumber}>{appointmentsCount.confirmed}</Text>
          <Text style={styles.statLabel}>Confirmés</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="today-outline" size={32} color="#42A5F5" />
          <Text style={styles.statNumber}>{appointmentsCount.today}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </View>
      </View>

      <View style={styles.content}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.screen, { doctor })}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>{item.title}</Text>
              <Text style={styles.menuCardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#E0F2F1',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  specialty: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  menuCardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

