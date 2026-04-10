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

export async function addJournalEntry(uid, { dateISO, dateDisplay, feelingBefore, feelingAfter, reflection }) {
  if (!uid) return localAddJournalEntry({ dateISO, dateDisplay, feelingBefore, feelingAfter, reflection });
  return withTimeout(addDoc(entriesRef(uid), {
    dateISO, dateDisplay, feelingBefore, feelingAfter, reflection,
    createdAt: new Date().toISOString(),
  }));
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
