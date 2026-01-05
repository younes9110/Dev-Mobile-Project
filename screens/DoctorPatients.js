import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorAppointments } from '../services/doctorService';
import { readData } from '../services/firebaseDatabase';

export default function DoctorPatients({ route, navigation }) {
  const { doctor } = route.params;
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let unsubscribe = null;

    const loadPatients = async () => {
      try {
        // Get all appointments for this doctor
        unsubscribe = getDoctorAppointments(doctor.id, async (appointments) => {
          // Get unique patients from appointments
          const patientIds = [...new Set(appointments.map(a => a.userId).filter(Boolean))];
          
          if (patientIds.length === 0) {
            setPatients([]);
            setLoading(false);
            return;
          }
          
          // Fetch patient data for each unique patient
          const patientsData = await Promise.all(
            patientIds.map(async (userId) => {
              const userResult = await readData(`users/${userId}`);
              if (userResult.success && userResult.data) {
                // Count appointments for this patient
                const patientAppointments = appointments.filter(a => a.userId === userId);
                return {
                  id: userId,
                  ...userResult.data,
                  appointmentsCount: patientAppointments.length,
                  lastAppointment: patientAppointments.length > 0 
                    ? patientAppointments[patientAppointments.length - 1].date 
                    : null,
                };
              }
              return null;
            })
          );

          const validPatients = patientsData.filter(p => p !== null);
          setPatients(validPatients);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading patients:', error);
        setLoading(false);
      }
    };

    loadPatients();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [doctor.id]);

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query)
    );
  });

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => {
        // Navigate to patient details or chat
        navigation.navigate('DoctorChat', {
          appointment: {
            id: `patient-${item.id}`,
            userId: item.id,
            userName: item.name || item.email,
            doctorId: doctor.id,
          },
          doctor,
        });
      }}
    >
      <View style={styles.patientAvatar}>
        <Ionicons name="person" size={30} color="#00897B" />
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name || item.email || 'Patient'}</Text>
        {item.email && (
          <View style={styles.patientDetail}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.patientDetailText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.patientDetail}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.patientDetailText}>{item.phone}</Text>
          </View>
        )}
        <View style={styles.patientStats}>
          <Text style={styles.patientStatText}>
            {item.appointmentsCount || 0} rendez-vous
          </Text>
          {item.lastAppointment && (
            <Text style={styles.patientStatText}>
              Dernier: {new Date(item.lastAppointment).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Chargement des patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {patients.reduce((sum, p) => sum + (p.appointmentsCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total rendez-vous</Text>
        </View>
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun patient trouvé'
                : 'Aucun patient enregistré'}
            </Text>
          </View>
        }
      />
    </View>
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
    padding: 15,
    backgroundColor: '#E0F2F1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    padding: 15,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  patientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  patientDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  patientStats: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 10,
  },
  patientStatText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

