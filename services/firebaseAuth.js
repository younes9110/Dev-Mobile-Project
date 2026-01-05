import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import app from './firebaseConfig';
import { writeData, readData, updateData } from './firebaseDatabase';

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

/**
 * Firebase Authentication Service
 * Provides authentication functions for login, signup, and user management
 */

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User full name
 * @param {string} phone - User phone number
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const signUp = async (email, password, name, phone) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });

    // Save additional user data to Realtime Database
    const userData = {
      uid: user.uid,
      email: user.email,
      name: name,
      phone: phone,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const dbResult = await writeData(`users/${user.uid}`, userData);

    if (dbResult.success) {
      return {
        success: true,
        user: {
          ...user,
          ...userData
        }
      };
    } else {
      return {
        success: false,
        error: 'Account created but failed to save user data'
      };
    }
  } catch (error) {
    console.error('Sign up error:', error);
    let errorMessage = 'An error occurred during sign up';
    
    // Handle specific Firebase errors
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Cet email est déjà enregistré';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Adresse email invalide';
        break;
      case 'auth/weak-password':
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erreur réseau. Vérifiez votre connexion';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign in an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional user data from Realtime Database
    const userDataResult = await readData(`users/${user.uid}`);
    
    if (userDataResult.success && userDataResult.data) {
      return {
        success: true,
        user: {
          ...user,
          ...userDataResult.data
        }
      };
    }

    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('Sign in error:', error);
    let errorMessage = 'An error occurred during sign in';
    
    // Handle specific Firebase errors
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Aucun compte trouvé avec cet email';
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Email ou mot de passe incorrect';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Adresse email invalide';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Ce compte a été désactivé';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erreur réseau. Vérifiez votre connexion';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives échouées. Réessayez plus tard';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    };
  }
};

/**
 * Get the current authenticated user
 * @returns {object|null} Current user object or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to authentication state changes
 * @param {function} callback - Callback function that receives the user object
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get additional user data from Realtime Database
      const userDataResult = await readData(`users/${user.uid}`);
      
      if (userDataResult.success && userDataResult.data) {
        callback({
          ...user,
          ...userDataResult.data
        });
      } else {
        callback(user);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Update user profile data
 * @param {string} uid - User ID
 * @param {object} updates - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserData = async (uid, updates) => {
  try {
    const result = await updateData(`users/${uid}`, {
      ...updates,
      updatedAt: Date.now()
    });
    return result;
  } catch (error) {
    console.error('Update user data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user data'
    };
  }
};

