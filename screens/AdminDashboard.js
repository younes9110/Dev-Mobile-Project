import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isAdmin } from '../services/adminService';
import { getCurrentUser } from '../services/firebaseAuth';

export default function AdminDashboard({ navigation }) {
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdmin();
    setIsUserAdmin(adminStatus);
    setLoading(false);

    if (!adminStatus) {
      Alert.alert(
        'Accès refusé',
        'Vous n\'avez pas les permissions d\'administrateur.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  const menuItems = [
    {
      id: 'doctors',
      title: 'Gérer les Médecins',
      icon: 'medical',
      color: '#00897B',
      screen: 'DoctorManagement',
      description: 'Ajouter, modifier ou supprimer des médecins',
    },
    {
      id: 'users',
      title: 'Gérer les Utilisateurs',
      icon: 'people',
      color: '#1976D2',
      screen: 'UserManagement',
      description: 'Voir et gérer tous les utilisateurs',
    },
    {
      id: 'appointments',
      title: 'Rendez-vous',
      icon: 'calendar',
      color: '#7B1FA2',
      screen: 'AppointmentManagement',
      description: 'Voir tous les rendez-vous',
    },
    {
      id: 'stats',
      title: 'Statistiques',
      icon: 'stats-chart',
      color: '#F57C00',
      screen: 'AdminStats',
      description: 'Statistiques de l\'application',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={40} color="#00897B" />
          <Text style={styles.headerTitle}>Panneau d'Administration</Text>
          <Text style={styles.headerSubtitle}>Gestion de l'application Tabib</Text>
        </View>
      </View>

      <View style={styles.content}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
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
    marginTop: 50,
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
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

