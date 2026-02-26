import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function createUserProfile(uid, { name, email }) {
  return setDoc(doc(db, 'users', uid), {
    name,
    email,
    notifDailyVerse: true,
    notifReflection: true,
    notifNewContent: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, 'users', uid), data);
}
