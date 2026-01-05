import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { saveAppointment } from '../services/firebaseDatabase';
import { getCurrentUser } from '../services/firebaseAuth';

export default function DoctorProfile({ route, navigation }) {
  const { doctor } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleBooking = async () => {
    if (!selectedTime) {
      Alert.alert('Erreur', 'Veuillez sélectionner une heure');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour prendre un rendez-vous');
      return;
    }

    setBookingLoading(true);

    try {
      const appointmentData = {
        userId: user.uid,
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: selectedDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        time: selectedTime,
        reason: reason.trim() || 'Consultation',
        status: 'pending',
      };

      const result = await saveAppointment(appointmentData);

      if (result.success) {
        Alert.alert(
          'Succès',
          'Votre rendez-vous a été enregistré avec succès!',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowBookingModal(false);
                setSelectedTime(null);
                setReason('');
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de réserver le rendez-vous');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réservation');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: doctor.photo }} style={styles.profileImage} />
        <Text style={styles.name}>{doctor.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.rating}>{doctor.rating}/5</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expérience</Text>
        <Text style={styles.sectionContent}>{doctor.experience}</Text>
      </View>

      {(doctor.address || doctor.city) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>
          <Text style={styles.sectionContent}>
            {doctor.address && `${doctor.address}, `}
            {doctor.city}
          </Text>
        </View>
      )}

      {doctor.latitude && doctor.longitude && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: doctor.latitude,
              longitude: doctor.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
          >
            <Marker
              coordinate={{
                latitude: doctor.latitude,
                longitude: doctor.longitude,
              }}
              title={doctor.name}
              description={doctor.address || doctor.city}
            />
          </MapView>
        </View>
      )}

      {doctor.workingHours && typeof doctor.workingHours === 'object' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heures de travail</Text>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
            const dayLabels = {
              monday: 'Lundi',
              tuesday: 'Mardi',
              wednesday: 'Mercredi',
              thursday: 'Jeudi',
              friday: 'Vendredi',
              saturday: 'Samedi',
              sunday: 'Dimanche',
            };
            const dayData = doctor.workingHours[day];
            if (dayData && dayData.enabled) {
              return (
                <View key={day} style={styles.workingHoursRow}>
                  <Text style={styles.workingHoursDay}>{dayLabels[day]}:</Text>
                  <Text style={styles.workingHoursTime}>
                    {dayData.from} - {dayData.to}
                  </Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disponibilités</Text>
        <Text style={styles.sectionSubtitle}>
          Sélectionnez une heure pour votre rendez-vous
        </Text>
        <View style={styles.availabilityContainer}>
          {timeSlots.map((time, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot
              ]}
              onPress={() => {
                setSelectedTime(time);
                if (!showBookingModal) {
                  setShowBookingModal(true);
                }
              }}
            >
              <Text style={[
                styles.timeText,
                selectedTime === time && styles.selectedTimeText
              ]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedTime ? (
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => setShowBookingModal(true)}
        >
          <Text style={styles.bookButtonText}>Confirmer le rendez-vous</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.bookButtonPlaceholder}>
          <Text style={styles.bookButtonPlaceholderText}>
            Sélectionnez une heure ci-dessus pour prendre un rendez-vous
          </Text>
        </View>
      )}

      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmer le rendez-vous</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={24} color="#00897B" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="fade"
            >
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerContent}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Choisir une date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerGrid}>
                    {getNextDays().map((date, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.datePickerDay,
                          selectedDate.toDateString() === date.toDateString() && styles.selectedDatePickerDay
                        ]}
                        onPress={() => {
                          setSelectedDate(date);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[
                          styles.datePickerDayText,
                          selectedDate.toDateString() === date.toDateString() && styles.selectedDatePickerDayText
                        ]}>
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </Text>
                        <Text style={[
                          styles.datePickerDateText,
                          selectedDate.toDateString() === date.toDateString() && styles.selectedDatePickerDayText
                        ]}>
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </Modal>

            <Text style={styles.modalLabel}>Heure</Text>
            {selectedTime ? (
              <Text style={styles.modalText}>{selectedTime}</Text>
            ) : (
              <Text style={styles.modalTextPlaceholder}>Sélectionnez une heure ci-dessus</Text>
            )}

            <Text style={styles.modalLabel}>Motif de consultation</Text>
            <TextInput
              style={[styles.modalInput, styles.reasonInput]}
              placeholder="Décrivez brièvement votre problème..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBookingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  (!selectedTime || bookingLoading) && styles.confirmButtonDisabled,
                ]}
                onPress={handleBooking}
                disabled={!selectedTime || bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E0F2F1',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    marginLeft: 5,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
  },
  availabilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  timeSlot: {
    backgroundColor: '#E0F2F1',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#00897B',
  },
  timeText: {
    fontSize: 16,
    color: '#00897B',
  },
  selectedTimeText: {
    color: '#fff',
  },
  bookButton: {
    backgroundColor: '#00897B',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bookButtonPlaceholder: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  bookButtonPlaceholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#00897B',
    marginLeft: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  reasonInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  modalTextPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#00897B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  datePickerDay: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedDatePickerDay: {
    backgroundColor: '#00897B',
  },
  datePickerDayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  datePickerDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedDatePickerDayText: {
    color: '#fff',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  workingHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  workingHoursDay: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  workingHoursTime: {
    fontSize: 16,
    color: '#00897B',
    fontWeight: '600',
  },
});
