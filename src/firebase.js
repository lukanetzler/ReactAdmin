import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyDqzLMJKSlCVWOui0lpla4wPVPW9smsmZI",
  authDomain: "prayvail-14bb0.firebaseapp.com",
  projectId: "prayvail-14bb0",
  storageBucket: "prayvail-14bb0.firebasestorage.app",
  messagingSenderId: "704606350525",
  appId: "1:704606350525:web:142335cd2bd548b1a5dbd4",
  measurementId: "G-M8DN49C9SB"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: Capacitor.isNativePlatform()
    ? indexedDBLocalPersistence
    : browserLocalPersistence,
});
export const db = getFirestore(app);
export const storage = getStorage(app);
