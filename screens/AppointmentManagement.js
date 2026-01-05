import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllAppointments } from '../services/adminService';
import { readData } from '../services/firebaseDatabase';

export default function AppointmentManagement({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = getAllAppointments(async (appointmentsList) => {
      // Enrich appointments with user and doctor names
      const enrichedAppointments = await Promise.all(
        appointmentsList.map(async (appointment) => {
          let userName = 'Utilisateur inconnu';
          let doctorName = 'Médecin inconnu';

          if (appointment.userId) {
            const userResult = await readData(`users/${appointment.userId}`);
            if (userResult.success && userResult.data) {
              userName = userResult.data.name || userResult.data.email || userName;
            }
          }

          if (appointment.doctorId) {
            const doctorResult = await readData(`doctors/${appointment.doctorId}`);
            if (doctorResult.success && doctorResult.data) {
              doctorName = doctorResult.data.name || doctorName;
            }
          }

          return {
            ...appointment,
            userName,
            doctorName,
          };
        })
      );

      setAppointments(enrichedAppointments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.date?.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: '#FFA726',
    confirmed: '#66BB6A',
    cancelled: '#EF5350',
    completed: '#42A5F5',
  };

  const statusLabels = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    completed: 'Terminé',
  };

  const renderAppointmentItem = ({ item }) => {
    const statusColor = statusColors[item.status] || '#666';
    const statusLabel = statusLabels[item.status] || item.status;

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentDate}>{item.date || 'Date non définie'}</Text>
            <Text style={styles.appointmentTime}>{item.time || 'Heure non définie'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.userName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.doctorName}</Text>
          </View>
          {item.reason && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.reason}</Text>
            </View>
          )}
        </View>

        {item.createdAt && (
          <Text style={styles.createdAt}>
            Créé le: {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
      </View>
    );
  }

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un rendez-vous..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {statusLabels[status] || 'Tous'} ({statusCounts[status]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statNumber, { color: '#FFA726' }]}>
            {statusCounts.pending}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNumber, { color: '#66BB6A' }]}>
            {statusCounts.confirmed}
          </Text>
          <Text style={styles.statLabel}>Confirmés</Text>
        </View>
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || filterStatus !== 'all'
                ? 'Aucun rendez-vous trouvé'
                : 'Aucun rendez-vous enregistré'}
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
  filterContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#00897B',
    borderColor: '#00897B',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
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
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  createdAt: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
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

