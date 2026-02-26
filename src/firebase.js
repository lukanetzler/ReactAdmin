import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const auth = getAuth(app);
export const db = getFirestore(app);
