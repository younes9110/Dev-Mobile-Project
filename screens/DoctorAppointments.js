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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorAppointments, updateAppointmentStatus } from '../services/doctorService';
import { readData } from '../services/firebaseDatabase';

export default function DoctorAppointments({ route, navigation }) {
  const { doctor } = route.params;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = getDoctorAppointments(doctor.id, async (appointmentsList) => {
      // Enrich appointments with user data
      const enrichedAppointments = await Promise.all(
        appointmentsList.map(async (appointment) => {
          let userName = 'Patient inconnu';
          let userPhone = '';
          let userEmail = '';

          if (appointment.userId) {
            const userResult = await readData(`users/${appointment.userId}`);
            if (userResult.success && userResult.data) {
              userName = userResult.data.name || userResult.data.email || userName;
              userPhone = userResult.data.phone || '';
              userEmail = userResult.data.email || '';
            }
          }

          return {
            ...appointment,
            userName,
            userPhone,
            userEmail,
          };
        })
      );

      setAppointments(enrichedAppointments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [doctor.id]);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.date?.includes(searchQuery) ||
      appointment.time?.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (appointmentId, newStatus) => {
    const statusLabels = {
      confirmed: 'confirmer',
      cancelled: 'annuler',
      completed: 'marquer comme terminé',
    };

    Alert.alert(
      'Changer le statut',
      `Voulez-vous ${statusLabels[newStatus]} ce rendez-vous ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await updateAppointmentStatus(appointmentId, newStatus);
            if (result.success) {
              Alert.alert('Succès', 'Statut mis à jour avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le statut');
            }
          },
        },
      ]
    );
  };

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
          {item.userPhone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.userPhone}</Text>
            </View>
          )}
          {item.reason && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.reason}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleStatusChange(item.id, 'confirmed')}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleStatusChange(item.id, 'cancelled')}
              >
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusChange(item.id, 'completed')}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Terminé</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => navigation.navigate('DoctorChat', { appointment: item, doctor })}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#00897B" />
            <Text style={[styles.actionButtonText, styles.chatButtonText]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
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
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'pending', 'confirmed', 'cancelled', 'completed']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === item && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === item && styles.filterButtonTextActive,
                ]}
              >
                {statusLabels[item] || 'Tous'} ({statusCounts[item]})
              </Text>
            </TouchableOpacity>
          )}
        />
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
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  confirmButton: {
    backgroundColor: '#66BB6A',
  },
  cancelButton: {
    backgroundColor: '#EF5350',
  },
  completeButton: {
    backgroundColor: '#42A5F5',
  },
  chatButton: {
    backgroundColor: '#E0F2F1',
    marginLeft: 'auto',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatButtonText: {
    color: '#00897B',
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

