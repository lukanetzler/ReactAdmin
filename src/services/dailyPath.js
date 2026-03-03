import { collection, addDoc, deleteDoc, doc, setDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
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

export async function addToPath(uid, cardId, currentCount) {
  return withTimeout(addDoc(pathRef(uid), {
    cardId,
    order: currentCount,
    addedAt: new Date().toISOString(),
    trackIndex: 0,
    completed: false,
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
