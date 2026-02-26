import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const entriesRef = (uid) => collection(db, 'users', uid, 'journalEntries');

export async function addJournalEntry(uid, { dateISO, dateDisplay, feelingBefore, feelingAfter, reflection }) {
  return addDoc(entriesRef(uid), {
    dateISO,
    dateDisplay,
    feelingBefore,
    feelingAfter,
    reflection,
    createdAt: serverTimestamp(),
  });
}

export async function updateJournalEntry(uid, entryId, { feelingBefore, feelingAfter, reflection }) {
  return updateDoc(doc(db, 'users', uid, 'journalEntries', entryId), {
    feelingBefore,
    feelingAfter,
    reflection,
  });
}

export async function deleteJournalEntry(uid, entryId) {
  return deleteDoc(doc(db, 'users', uid, 'journalEntries', entryId));
}
