import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserAppointments } from '../services/firebaseDatabase';
import { getCurrentUser } from '../services/firebaseAuth';
import { readData, listenToData } from '../services/firebaseDatabase';

export default function UserAppointments({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = getUserAppointments(user.uid, async (appointmentsList) => {
      // Enrich appointments with doctor data and message count
      const enrichedAppointments = await Promise.all(
        appointmentsList.map(async (appointment) => {
          let doctorName = 'Médecin inconnu';
          let doctorPhoto = null;
          let doctorSpecialty = '';
          let hasMessages = false;
          let lastMessageTime = null;

          if (appointment.doctorId) {
            const doctorResult = await readData(`doctors/${appointment.doctorId}`);
            if (doctorResult.success && doctorResult.data) {
              doctorName = doctorResult.data.name || doctorName;
              doctorPhoto = doctorResult.data.photo || null;
              doctorSpecialty = doctorResult.data.specialty || '';
            }
          }

          // Check if appointment has messages
          const messagesResult = await readData(`appointments/${appointment.id}/messages`);
          if (messagesResult.success && messagesResult.data) {
            const messages = Object.values(messagesResult.data);
            hasMessages = messages.length > 0;
            if (hasMessages) {
              const sortedMessages = messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              lastMessageTime = sortedMessages[0]?.timestamp || null;
            }
          }

          return {
            ...appointment,
            doctorName,
            doctorPhoto,
            doctorSpecialty,
            hasMessages,
            lastMessageTime,
          };
        })
      );

      // Sort by date (most recent first)
      enrichedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB - dateA;
      });

      setAppointments(enrichedAppointments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.date?.includes(searchQuery) ||
      appointment.time?.includes(searchQuery);
    
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
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => {
          // Navigate to chat with doctor
          navigation.navigate('UserChat', {
            appointment: item,
            doctor: {
              id: item.doctorId,
              name: item.doctorName,
              photo: item.doctorPhoto,
              specialty: item.doctorSpecialty,
            },
          });
        }}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.doctorInfo}>
            {item.doctorPhoto ? (
              <Image source={{ uri: item.doctorPhoto }} style={styles.doctorAvatar} />
            ) : (
              <View style={styles.doctorAvatarPlaceholder}>
                <Ionicons name="person" size={24} color="#00897B" />
              </View>
            )}
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{item.doctorName}</Text>
              <Text style={styles.doctorSpecialty}>{item.doctorSpecialty}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {new Date(item.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.time || 'Heure non définie'}</Text>
          </View>
          {item.reason && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.reason}</Text>
            </View>
          )}
        </View>

        {item.hasMessages && (
          <View style={styles.messageIndicator}>
            <Ionicons name="chatbubble" size={16} color="#00897B" />
            <Text style={styles.messageIndicatorText}>Messages disponibles</Text>
            {item.lastMessageTime && (
              <Text style={styles.lastMessageTime}>
                {new Date(item.lastMessageTime).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#00897B" />
          <Text style={styles.chatButtonText}>Ouvrir la conversation</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Chargement de vos rendez-vous...</Text>
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
            <Text style={styles.emptySubtext}>
              Prenez un rendez-vous avec un médecin pour commencer
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
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  doctorAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  doctorSpecialty: {
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
  messageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  messageIndicatorText: {
    marginLeft: 5,
    color: '#00897B',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00897B',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
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
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
});

