import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Firestore writes can hang indefinitely if security rules reject them.
// This helper races the write against a timeout so the UI never freezes.
function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timed out')), ms)
    ),
  ]);
}

export async function createUserProfile(uid, { name, email }) {
  return withTimeout(setDoc(doc(db, 'users', uid), {
    name,
    email,
    notifDailyVerse: true,
    notifReflection: true,
    notifNewContent: false,
    createdAt: new Date().toISOString(),
  }));
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  return withTimeout(setDoc(doc(db, 'users', uid), data, { merge: true }));
}
