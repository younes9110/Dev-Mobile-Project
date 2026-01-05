# Firebase Database Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Realtime Database

1. In your Firebase project, go to **Build** > **Realtime Database**
2. Click **Create Database**
3. Choose your location (e.g., `us-central1`)
4. Start in **test mode** for development (you can secure it later)

## Step 3: Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 4: Configure Your App

1. Open `services/firebaseConfig.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCusQ9StZeroHmIbF-jFahnQt2s_5c3XiA",
  authDomain: "tabib-4d8cc.firebaseapp.com",
  databaseURL: " https://tabib-4d8cc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tabib-4d8cc",
  storageBucket: "tabib-4d8cc.firebasestorage.app",
  messagingSenderId: "171244559876",
  appId: "1:171244559876:web:0a962d53544c7ceae09f51"
};
```

## Step 5: Set Up Database Rules (Important!)

Go to **Realtime Database** > **Rules** and update them based on your needs:

### For Development (Test Mode):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### For Production (Secure):
```json
{
  "rules": {
    "doctors": {
      ".read": true,
      ".write": "auth != null"
    },
    "appointments": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Usage Examples

See `services/firebaseDatabase.js` for all available functions, or check the example below.


