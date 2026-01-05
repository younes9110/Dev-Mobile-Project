import { readData, listenToData, updateData, pushData } from './firebaseDatabase';
import { getCurrentUser } from './firebaseAuth';

/**
 * Doctor Service
 * Provides functions for doctor-related operations
 */

/**
 * Check if current user is a doctor
 * @returns {Promise<boolean>}
 */
export const isDoctor = async () => {
  try {
    const user = getCurrentUser();
    if (!user || !user.email) {
      console.log('No user or email found');
      return false;
    }

    const userEmail = user.email.trim().toLowerCase();
    console.log('Checking doctor status for email:', userEmail);

    // Check if user email matches a doctor in the database
    const doctorsResult = await readData('doctors');
    if (doctorsResult.success && doctorsResult.data) {
      const doctors = Object.entries(doctorsResult.data).map(([id, data]) => ({
        id,
        ...data
      }));
      const doctor = doctors.find(d => {
        const doctorEmail = (d.email || '').trim().toLowerCase();
        return doctorEmail === userEmail;
      });
      
      if (doctor) {
        console.log('Doctor found in database:', doctor.name, 'ID:', doctor.id);
        return true;
      } else {
        console.log('No doctor found with email:', userEmail);
        console.log('Available doctor emails:', doctors.map(d => (d.email || '').trim().toLowerCase()));
      }
    } else {
      console.log('Failed to read doctors or no doctors data');
    }

    // Check user role in database
    const userDataResult = await readData(`users/${user.uid}`);
    if (userDataResult.success && userDataResult.data) {
      const isDoctorRole = userDataResult.data.role === 'doctor';
      if (isDoctorRole) {
        console.log('User has doctor role in database');
        return true;
      }
    }

    console.log('User is not a doctor');
    return false;
  } catch (error) {
    console.error('Error checking doctor status:', error);
    return false;
  }
};

/**
 * Get doctor data by email
 * @param {string} email - Doctor email
 * @returns {Promise<{success: boolean, doctor?: object, error?: string}>}
 */
export const getDoctorByEmail = async (email) => {
  try {
    if (!email) {
      console.error('No email provided to getDoctorByEmail');
      return { success: false, error: 'No email provided' };
    }

    const userEmail = email.trim().toLowerCase();
    console.log('Searching for doctor with email:', userEmail);

    const doctorsResult = await readData('doctors');
    console.log('Doctors result:', doctorsResult);
    
    if (doctorsResult.success && doctorsResult.data) {
      const doctors = Object.entries(doctorsResult.data).map(([id, data]) => ({
        id,
        ...data
      }));
      
      console.log('Total doctors found:', doctors.length);
      console.log('Doctor emails:', doctors.map(d => d.email));
      
      const doctor = doctors.find(d => {
        const doctorEmail = (d.email || '').trim().toLowerCase();
        const match = doctorEmail === userEmail;
        if (match) {
          console.log('Found matching doctor:', d.name, 'with email:', d.email);
        }
        return match;
      });
      
      if (doctor) {
        return { success: true, doctor };
      } else {
        console.log('No doctor found matching email:', userEmail);
        console.log('Available emails:', doctors.map(d => (d.email || '').trim().toLowerCase()));
      }
    } else {
      console.log('Failed to read doctors or no doctors data');
    }
    
    return { success: false, error: 'Doctor not found' };
  } catch (error) {
    console.error('Error getting doctor by email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get doctor data by ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<{success: boolean, doctor?: object, error?: string}>}
 */
export const getDoctorById = async (doctorId) => {
  try {
    const result = await readData(`doctors/${doctorId}`);
    if (result.success && result.data) {
      return { success: true, doctor: { id: doctorId, ...result.data } };
    }
    return { success: false, error: 'Doctor not found' };
  } catch (error) {
    console.error('Error getting doctor by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get appointments for a specific doctor
 * @param {string} doctorId - Doctor ID
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getDoctorAppointments = (doctorId, callback) => {
  return listenToData('appointments', (data) => {
    if (data) {
      const appointments = Object.entries(data)
        .map(([id, appointment]) => ({
          id,
          ...appointment
        }))
        .filter(appointment => appointment.doctorId === doctorId);
      
      // Sort by date and time
      appointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      });
      
      callback(appointments);
    } else {
      callback([]);
    }
  });
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status (pending, confirmed, cancelled, completed)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const result = await updateData(`appointments/${appointmentId}`, {
      status,
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update appointment status'
    };
  }
};

/**
 * Send a message in chat
 * @param {string} appointmentId - Appointment ID
 * @param {string} senderId - Sender user ID
 * @param {string} senderName - Sender name
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export const sendMessage = async (appointmentId, senderId, senderName, message) => {
  try {
    const result = await pushData(`appointments/${appointmentId}/messages`, {
      senderId,
      senderName,
      message,
      timestamp: Date.now(),
      createdAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message'
    };
  }
};

/**
 * Get messages for an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getAppointmentMessages = (appointmentId, callback) => {
  return listenToData(`appointments/${appointmentId}/messages`, (data) => {
    if (data) {
      const messages = Object.entries(data)
        .map(([id, message]) => ({
          id,
          ...message
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    } else {
      callback([]);
    }
  });
};

