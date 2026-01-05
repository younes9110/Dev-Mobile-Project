import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingScreen({ route }) {
  const { doctor } = route.params;

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const availableSlots = [
    '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00',
    '17:00', '18:00',
  ];

  const handleBooking = (time) => {
    alert(`Rendez-vous réservé avec ${doctor.name} à ${time} le ${date.toLocaleDateString()}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réserver avec {doctor.name}</Text>

      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>📅 {date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.subtitle}>Sélectionnez une heure :</Text>
      <FlatList
        data={availableSlots}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.slot} onPress={() => handleBooking(item)}>
            <Text style={styles.slotText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  dateButton: {
    backgroundColor: '#00897B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: { color: '#fff', fontSize: 16 },
  subtitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  grid: { gap: 12 },
  slot: {
    backgroundColor: '#E0F2F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    margin: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  slotText: { fontSize: 15 },
});
