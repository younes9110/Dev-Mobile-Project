import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo,
  limitToFirst,
  limitToLast
} from 'firebase/database';
import { database } from './firebaseConfig';

/**
 * Firebase Realtime Database Service
 * Provides helper functions for common database operations
 */

// ==================== WRITE OPERATIONS ====================

/**
 * Write data to a specific path (overwrites existing data)
 * @param {string} path - Database path (e.g., 'users/user123')
 * @param {object} data - Data to write
 * @returns {Promise<void>}
 */
export const writeData = async (path, data) => {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error writing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Push data to a path (creates a new entry with auto-generated key)
 * @param {string} path - Database path (e.g., 'appointments')
 * @param {object} data - Data to push
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export const pushData = async (path, data) => {
  try {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    return { success: true, key: newRef.key };
  } catch (error) {
    console.error('Error pushing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update data at a specific path (merges with existing data)
 * @param {string} path - Database path
 * @param {object} updates - Object with paths and values to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateData = async (path, updates) => {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete data at a specific path
 * @param {string} path - Database path
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteData = async (path) => {
  try {
    const dbRef = ref(database, path);
    await remove(dbRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting data:', error);
    return { success: false, error: error.message };
  }
};

// ==================== READ OPERATIONS ====================

/**
 * Read data from a specific path (one-time read)
 * @param {string} path - Database path
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const readData = async (path) => {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Error reading data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to real-time changes at a specific path
 * @param {string} path - Database path
 * @param {function} callback - Callback function that receives the data
 * @returns {function} Unsubscribe function
 */
export const listenToData = (path, callback) => {
  const dbRef = ref(database, path);
  
  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to data:', error);
    callback(null, error);
  });
  
  // Return unsubscribe function
  return () => {
    off(dbRef);
  };
};

// ==================== QUERY OPERATIONS ====================

/**
 * Query data with filters
 * @param {string} path - Database path
 * @param {object} options - Query options
 * @param {string} options.orderBy - Field to order by (e.g., 'name', 'timestamp')
 * @param {string} options.equalTo - Value to filter by
 * @param {number} options.limit - Limit number of results
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const queryData = (path, options = {}, callback) => {
  try {
    let dbRef = ref(database, path);
    
    // Apply ordering
    if (options.orderBy) {
      dbRef = query(dbRef, orderByChild(options.orderBy));
    }
    
    // Apply filter
    if (options.equalTo !== undefined) {
      dbRef = query(dbRef, equalTo(options.equalTo));
    }
    
    // Apply limit
    if (options.limit) {
      dbRef = query(dbRef, limitToFirst(options.limit));
    }
    
    // Set up listener
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object to array if needed
        const dataArray = options.returnArray !== false 
          ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
          : data;
        callback(dataArray);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error querying data:', error);
      callback([], error);
    });
    
    return () => {
      off(dbRef);
    };
  } catch (error) {
    console.error('Error querying data:', error);
    callback([], error);
    return () => {}; // Return empty unsubscribe function
  }
};

// ==================== SPECIFIC USE CASES FOR YOUR APP ====================

/**
 * Save a doctor to the database
 * @param {object} doctorData - Doctor information
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export const saveDoctor = async (doctorData) => {
  return await pushData('doctors', {
    ...doctorData,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
};

/**
 * Get all doctors
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getDoctors = (callback) => {
  return listenToData('doctors', (data) => {
    if (data) {
      // Convert object to array
      const doctors = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(doctors);
    } else {
      callback([]);
    }
  });
};

/**
 * Get doctors by specialty
 * @param {string} specialty - Doctor specialty
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getDoctorsBySpecialty = (specialty, callback) => {
  return queryData('doctors', {
    orderBy: 'specialty',
    equalTo: specialty,
    returnArray: true
  }, callback);
};

/**
 * Save an appointment
 * @param {object} appointmentData - Appointment information
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export const saveAppointment = async (appointmentData) => {
  return await pushData('appointments', {
    ...appointmentData,
    createdAt: Date.now(),
    status: 'pending'
  });
};

/**
 * Get appointments for a user
 * @param {string} userId - User ID
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getUserAppointments = (userId, callback) => {
  return queryData('appointments', {
    orderBy: 'userId',
    equalTo: userId,
    returnArray: true
  }, callback);
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status (e.g., 'confirmed', 'cancelled', 'completed')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  return await updateData(`appointments/${appointmentId}`, {
    status,
    updatedAt: Date.now()
  });
};

