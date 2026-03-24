import { collection, addDoc, deleteDoc, doc, setDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timed out')), ms)
    ),
  ]);
}

const pathRef = (uid) => collection(db, 'users', uid, 'dailyPath');

export async function addToPath(uid, cardId, currentCount, extraFields = {}) {
  return withTimeout(addDoc(pathRef(uid), {
    cardId,
    order: currentCount,
    addedAt: new Date().toISOString(),
    trackIndex: 0,
    completed: false,
    ...extraFields,
  }));
}

export async function removeFromPath(uid, itemId) {
  return withTimeout(deleteDoc(doc(db, 'users', uid, 'dailyPath', itemId)));
}

// Advance a playlist to the next track, or mark as completed if on the last track
export async function advancePlaylistTrack(uid, itemId, nextIndex, isLast) {
  const update = isLast
    ? { completed: true }
    : { trackIndex: nextIndex };
  return withTimeout(setDoc(doc(db, 'users', uid, 'dailyPath', itemId), update, { merge: true }));
}

// Complete one track for today.
// The dailyPath update is the critical write — it must succeed for the UI to update.
// trackCompletions and completionHistory are permanent records written independently
// so a security-rule gap on a new collection cannot silently kill the whole operation.
export async function completeTrackForDay(uid, { itemId, cardId, cardTitle, trackIndex, trackTitle, nextIndex, isLast }) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // CRITICAL: update the daily path item — awaited so callers can catch failures
  await withTimeout(setDoc(doc(db, 'users', uid, 'dailyPath', itemId), {
    completedToday: today,
    trackIndex: nextIndex,
    ...(isLast ? { completed: true, completedAt: now } : {}),
  }, { merge: true }));

  // NON-CRITICAL: permanent history records — fire-and-forget so they never block the above
  addDoc(collection(db, 'users', uid, 'trackCompletions'), {
    cardId, cardTitle, trackIndex, trackTitle, completedAt: now,
  }).catch(() => {});

  if (isLast) {
    addDoc(collection(db, 'users', uid, 'completionHistory'), {
      cardId, title: cardTitle, type: 'playlist', completedAt: now,
    }).catch(() => {});
  }
}

// Persist completion on a path item (singles and article readings)
export async function completePathItem(uid, itemId) {
  return withTimeout(setDoc(doc(db, 'users', uid, 'dailyPath', itemId), { completed: true, completedAt: new Date().toISOString() }, { merge: true }));
}

// Write a permanent completion record that survives path item deletion
export async function recordCompletion(uid, cardId, title, type) {
  return withTimeout(addDoc(collection(db, 'users', uid, 'completionHistory'), { cardId, title, type, completedAt: new Date().toISOString() }));
}

// Reset a completed playlist back to track 0
export async function resetPlaylist(uid, itemId) {
  return withTimeout(setDoc(doc(db, 'users', uid, 'dailyPath', itemId), { trackIndex: 0, completed: false }, { merge: true }));
}

// Dismiss a broadcast card — writes a marker so the hook can filter it out
export async function dismissBroadcast(uid, cardId) {
  return withTimeout(addDoc(pathRef(uid), { cardId, dismissed: true, order: -1, addedAt: new Date().toISOString() }));
}

// Swap the order of two path items (for drag-to-reorder)
export async function swapPathOrder(uid, idA, orderA, idB, orderB) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid, 'dailyPath', idA), { order: orderB }, { merge: true });
  batch.set(doc(db, 'users', uid, 'dailyPath', idB), { order: orderA }, { merge: true });
  return batch.commit();
}

// Write a permanent streak day record keyed by date — safe to call multiple times (idempotent).
// Survives journal entry deletion since it lives in a separate collection.
export async function recordStreakDay(uid) {
  const date = new Date().toISOString().slice(0, 10);
  return withTimeout(setDoc(doc(db, 'users', uid, 'streakDays', date), { date, recordedAt: new Date().toISOString() }, { merge: true }));
}

// Called at signup: copies all published cards with addOnSignup:true into the new user's dailyPath
export async function enrollSignupCards(uid) {
  const q = query(
    collection(db, 'content', 'libraryCards', 'items'),
    where('addOnSignup', '==', true),
    where('published', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((cardDoc, i) => {
    const ref = doc(collection(db, 'users', uid, 'dailyPath'));
    batch.set(ref, {
      cardId: cardDoc.id,
      order: cardDoc.data().broadcastOrder ?? i,
      addedAt: new Date().toISOString(),
      trackIndex: 0,
      completed: false,
    });
  });
  return batch.commit();
}
