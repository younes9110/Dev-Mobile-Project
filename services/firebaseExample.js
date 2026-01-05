/**
 * Firebase Database Usage Examples
 * 
 * This file shows how to use the Firebase database service in your components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import {
  getDoctors,
  getDoctorsBySpecialty,
  saveDoctor,
  saveAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  writeData,
  readData,
  listenToData,
  pushData,
  updateData,
  deleteData
} from './firebaseDatabase';

// ==================== EXAMPLE 1: Get All Doctors (Real-time) ====================
export function DoctorsListExample() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = getDoctors((doctorsList) => {
      setDoctors(doctorsList);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>{item.specialty}</Text>
        </View>
      )}
    />
  );
}

// ==================== EXAMPLE 2: Get Doctors by Specialty ====================
export function SpecialtyDoctorsExample({ specialty }) {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const unsubscribe = getDoctorsBySpecialty(specialty, (doctorsList) => {
      setDoctors(doctorsList);
    });

    return () => unsubscribe();
  }, [specialty]);

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  );
}

// ==================== EXAMPLE 3: Save a Doctor ====================
export function SaveDoctorExample() {
  const handleSaveDoctor = async () => {
    const doctorData = {
      name: 'Dr. John Doe',
      specialty: 'Cardiologue',
      rating: 4.8,
      experience: '10 ans',
      price: '30€',
      location: 'Paris'
    };

    const result = await saveDoctor(doctorData);
    
    if (result.success) {
      console.log('Doctor saved with ID:', result.key);
    } else {
      console.error('Error saving doctor:', result.error);
    }
  };

  return <Button title="Save Doctor" onPress={handleSaveDoctor} />;
}

// ==================== EXAMPLE 4: Save an Appointment ====================
export function BookAppointmentExample({ userId, doctorId }) {
  const handleBookAppointment = async () => {
    const appointmentData = {
      userId: userId,
      doctorId: doctorId,
      date: '2024-01-15',
      time: '10:00',
      reason: 'Consultation générale'
    };

    const result = await saveAppointment(appointmentData);
    
    if (result.success) {
      console.log('Appointment booked with ID:', result.key);
    } else {
      console.error('Error booking appointment:', result.error);
    }
  };

  return <Button title="Book Appointment" onPress={handleBookAppointment} />;
}

// ==================== EXAMPLE 5: Get User Appointments ====================
export function UserAppointmentsExample({ userId }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const unsubscribe = getUserAppointments(userId, (appointmentsList) => {
      setAppointments(appointmentsList);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>Date: {item.date}</Text>
          <Text>Time: {item.time}</Text>
          <Text>Status: {item.status}</Text>
        </View>
      )}
    />
  );
}

// ==================== EXAMPLE 6: Update Appointment Status ====================
export function UpdateAppointmentExample({ appointmentId }) {
  const handleConfirm = async () => {
    const result = await updateAppointmentStatus(appointmentId, 'confirmed');
    
    if (result.success) {
      console.log('Appointment confirmed');
    } else {
      console.error('Error updating appointment:', result.error);
    }
  };

  return <Button title="Confirm Appointment" onPress={handleConfirm} />;
}

// ==================== EXAMPLE 7: Basic Write Operation ====================
export function BasicWriteExample() {
  const handleWrite = async () => {
    const result = await writeData('users/user123', {
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: Date.now()
    });

    if (result.success) {
      console.log('Data written successfully');
    }
  };

  return <Button title="Write Data" onPress={handleWrite} />;
}

// ==================== EXAMPLE 8: Basic Read Operation ====================
export function BasicReadExample() {
  const [userData, setUserData] = useState(null);

  const handleRead = async () => {
    const result = await readData('users/user123');
    
    if (result.success) {
      setUserData(result.data);
    }
  };

  return (
    <View>
      <Button title="Read Data" onPress={handleRead} />
      {userData && <Text>{JSON.stringify(userData)}</Text>}
    </View>
  );
}

// ==================== EXAMPLE 9: Real-time Listener ====================
export function RealtimeListenerExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Listen to real-time changes
    const unsubscribe = listenToData('notifications/user123', (snapshot) => {
      setData(snapshot);
    });

    return () => unsubscribe();
  }, []);

  return <Text>{data ? JSON.stringify(data) : 'No data'}</Text>;
}

// ==================== EXAMPLE 10: Delete Data ====================
export function DeleteDataExample({ itemId }) {
  const handleDelete = async () => {
    const result = await deleteData(`appointments/${itemId}`);
    
    if (result.success) {
      console.log('Item deleted');
    } else {
      console.error('Error deleting:', result.error);
    }
  };

  return <Button title="Delete" onPress={handleDelete} />;
}


