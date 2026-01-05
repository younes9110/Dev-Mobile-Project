import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// Get these values from your Firebase Console: https://console.firebase.google.com/
// Go to Project Settings > General > Your apps > Firebase SDK snippet > Config
// 
// IMPORTANT: If you created the Realtime Database in a specific region (not default),
// update the databaseURL to match your actual database URL from Firebase Console.
// You can find it in: Build > Realtime Database > Data tab (shown at the top)
const firebaseConfig = {
  apiKey: "AIzaSyCusQ9StZeroHmIbF-jFahnQt2s_5c3XiA",
  authDomain: "tabib-4d8cc.firebaseapp.com",
  databaseURL: "https://tabib-4d8cc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tabib-4d8cc",
  storageBucket: "tabib-4d8cc.firebasestorage.app",
  messagingSenderId: "171244559876",
  appId: "1:171244559876:web:0a962d53544c7ceae09f51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
export default app;
