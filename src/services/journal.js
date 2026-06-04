import { collection, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { localAddJournalEntry, localUpdateJournalEntry, localDeleteJournalEntry } from './localStore';

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

const entriesRef = (uid) => collection(db, 'users', uid, 'journalEntries');

export async function addJournalEntry(uid, { dateISO, dateDisplay, feelingBefore, feelingAfter, reflection, meditationTitle, entryType, pathTitle, trackTitle, isRevisit }) {
  const data = Object.fromEntries(
    Object.entries({ dateISO, dateDisplay, feelingBefore, feelingAfter, reflection, meditationTitle, entryType, pathTitle, trackTitle, isRevisit })
      .filter(([, v]) => v !== undefined && v !== null && v !== false)
  );
  if (!uid) return localAddJournalEntry(data);
  return withTimeout(addDoc(entriesRef(uid), { ...data, createdAt: new Date().toISOString() }));
}

export async function addJourneyEvent(uid, { entryType, pathTitle }) {
  const now = new Date();
  const data = {
    entryType,
    pathTitle,
    dateISO: now.toISOString().split('T')[0],
    dateDisplay: now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
  };
  if (!uid) return localAddJournalEntry(data);
  return withTimeout(addDoc(entriesRef(uid), { ...data, createdAt: now.toISOString() }));
}

export async function updateJournalEntry(uid, entryId, { feelingBefore, feelingAfter, reflection }) {
  if (!uid) { localUpdateJournalEntry(entryId, { feelingBefore, feelingAfter, reflection }); return; }
  return withTimeout(setDoc(doc(db, 'users', uid, 'journalEntries', entryId), {
    feelingBefore, feelingAfter, reflection,
  }, { merge: true }));
}

export async function deleteJournalEntry(uid, entryId) {
  if (!uid) { localDeleteJournalEntry(entryId); return; }
  return withTimeout(deleteDoc(doc(db, 'users', uid, 'journalEntries', entryId)));
}
