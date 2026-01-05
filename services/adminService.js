import { readData, writeData, updateData, deleteData, listenToData, pushData } from './firebaseDatabase';
import { getCurrentUser } from './firebaseAuth';

/**
 * Admin Service
 * Provides functions for admin role management and admin operations
 */

// Admin email list - you can also store this in Firebase
const ADMIN_EMAILS = [
  'admin@tabib.com', // Add your admin email here
];

/**
 * Check if current user is an admin
 * @returns {Promise<boolean>}
 */
export const isAdmin = async () => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    // Check if user email is in admin list
    if (ADMIN_EMAILS.includes(user.email)) {
      return true;
    }

    // Check user role in database
    const userDataResult = await readData(`users/${user.uid}`);
    if (userDataResult.success && userDataResult.data) {
      return userDataResult.data.role === 'admin';
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Set user role to admin
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setUserAsAdmin = async (userId) => {
  try {
    const result = await updateData(`users/${userId}`, {
      role: 'admin',
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error setting user as admin:', error);
    return {
      success: false,
      error: error.message || 'Failed to set user as admin'
    };
  }
};

/**
 * Get all users
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getAllUsers = (callback) => {
  return listenToData('users', (data) => {
    if (data) {
      const users = Object.keys(data).map(key => ({
        id: key,
        uid: key,
        ...data[key]
      }));
      callback(users);
    } else {
      callback([]);
    }
  });
};

/**
 * Delete a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    const result = await deleteData(`users/${userId}`);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    };
  }
};

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {object} updates - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUser = async (userId, updates) => {
  try {
    const result = await updateData(`users/${userId}`, {
      ...updates,
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
};

/**
 * Get all doctors
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getAllDoctors = (callback) => {
  return listenToData('doctors', (data) => {
    if (data) {
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
 * Add a new doctor
 * @param {object} doctorData - Doctor information
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export const addDoctor = async (doctorData) => {
  try {
    const result = await pushData('doctors', {
      ...doctorData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error adding doctor:', error);
    return {
      success: false,
      error: error.message || 'Failed to add doctor'
    };
  }
};

/**
 * Update a doctor
 * @param {string} doctorId - Doctor ID
 * @param {object} updates - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateDoctor = async (doctorId, updates) => {
  try {
    const result = await updateData(`doctors/${doctorId}`, {
      ...updates,
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Error updating doctor:', error);
    return {
      success: false,
      error: error.message || 'Failed to update doctor'
    };
  }
};

/**
 * Delete a doctor
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteDoctor = async (doctorId) => {
  try {
    const result = await deleteData(`doctors/${doctorId}`);
    return result;
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete doctor'
    };
  }
};

/**
 * Get all appointments
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} Unsubscribe function
 */
export const getAllAppointments = (callback) => {
  return listenToData('appointments', (data) => {
    if (data) {
      const appointments = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(appointments);
    } else {
      callback([]);
    }
  });
};

