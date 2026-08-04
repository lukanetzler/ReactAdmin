// Migrates guest localStorage data into Firestore when a user signs up or logs in.
// Only runs if local data exists. For returning users (already have Firestore path items),
// local data is discarded rather than risk creating duplicates.

import {
  collection, doc, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  hasGuestData, clearGuestData,
  getDailyPath, getCompletionHistory, getTrackCompletions,
  getJournalEntries, getStreakDays, getGuestProfile,
} from './localStore';

// Dedupe concurrent invocations (App.jsx auth listener + explicit signup call may overlap)
let migrationInFlight = null;

// forceMerge: always merge local data even if Firestore path items already exist.
// Used at account CREATION, where signup cards may have just been enrolled — we still
// want to preserve the guest's local progress. Login keeps the discard heuristic.
export async function migrateGuestDataIfNeeded(uid, { forceMerge = false } = {}) {
  if (!hasGuestData()) return;
  if (migrationInFlight) return migrationInFlight;

  migrationInFlight = doMigration(uid, forceMerge).finally(() => { migrationInFlight = null; });
  return migrationInFlight;
}

async function doMigration(uid, forceMerge) {
  try {
    // For LOGIN into an existing account that also has local data, discard local to
    // avoid duplicates. Skipped when forceMerge (fresh signup preserving guest progress).
    if (!forceMerge) {
      const existingPath = await getDocs(collection(db, 'users', uid, 'dailyPath'));
      if (!existingPath.empty) {
        clearGuestData();
        return;
      }
    }

    const pathItems = getDailyPath();
    const completionHistory = getCompletionHistory();
    const trackCompletions = getTrackCompletions();
    const journalEntries = getJournalEntries();
    const streakDays = getStreakDays();
    const guestProfile = getGuestProfile();

    // Firestore batch writes are limited to 500 ops — guest data is tiny so this is safe
    const batch = writeBatch(db);

    pathItems.filter(i => !i.dismissed).forEach(({ id: _id, ...data }) => {
      batch.set(doc(collection(db, 'users', uid, 'dailyPath')), data);
    });

    journalEntries.forEach(({ id: _id, ...data }) => {
      batch.set(doc(collection(db, 'users', uid, 'journalEntries')), data);
    });

    completionHistory.forEach(({ id: _id, ...data }) => {
      batch.set(doc(collection(db, 'users', uid, 'completionHistory')), data);
    });

    trackCompletions.forEach(({ id: _id, ...data }) => {
      batch.set(doc(collection(db, 'users', uid, 'trackCompletions')), data);
    });

    streakDays.forEach(date => {
      batch.set(doc(db, 'users', uid, 'streakDays', date), {
        date, recordedAt: new Date().toISOString(),
      });
    });

    if (guestProfile.name) {
      batch.set(doc(db, 'users', uid), { name: guestProfile.name }, { merge: true });
    }

    await batch.commit();
  } catch (err) {
    console.error('Guest data migration failed:', err);
  } finally {
    clearGuestData();
  }
}
