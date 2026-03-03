import { collection, doc, addDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    ),
  ]);
}

// ── Collections ───────────────────────────────────────────
const pathSessionsRef = () => collection(db, 'content', 'pathSessions', 'items');
const libraryCardsRef = () => collection(db, 'content', 'libraryCards', 'items');
const categoriesRef = () => collection(db, 'content', 'categories', 'items');

// ── File Upload ───────────────────────────────────────────
// Uploads a file to Firebase Storage and returns the download URL.
// onProgress(0-100) is called as the upload progresses.
export function uploadFile(file, storagePath, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

// Extracts the storage object path from a Firebase Storage download URL.
// e.g. https://firebasestorage.googleapis.com/v0/b/BUCKET/o/library%2Fimages%2Ffile.jpg?...
//   → library/images/file.jpg
function storagePathFromUrl(url) {
  try {
    const match = url.match(/\/o\/([^?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function deleteStorageFile(url) {
  try {
    const path = storagePathFromUrl(url);
    if (!path) return;
    await deleteObject(ref(storage, path));
  } catch {
    // File may not exist or is already deleted — ignore
  }
}

// ── Path Sessions ─────────────────────────────────────────
export async function savePathSession(data, id) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (id) {
    return withTimeout(setDoc(doc(db, 'content', 'pathSessions', 'items', id), payload, { merge: true }));
  }
  return withTimeout(addDoc(pathSessionsRef(), { ...payload, createdAt: new Date().toISOString() }));
}

export async function deletePathSession(id) {
  return withTimeout(deleteDoc(doc(db, 'content', 'pathSessions', 'items', id)));
}

export async function getPathSessions() {
  const snap = await withTimeout(getDocs(pathSessionsRef()));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Library Cards ─────────────────────────────────────────
export async function saveLibraryCard(data, id) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (id) {
    return withTimeout(setDoc(doc(db, 'content', 'libraryCards', 'items', id), payload, { merge: true }));
  }
  return withTimeout(addDoc(libraryCardsRef(), { ...payload, createdAt: new Date().toISOString() }));
}

export async function deleteLibraryCard(id, card) {
  // Delete all associated Storage files before removing the Firestore doc
  const urlsToDelete = [
    card?.imageUrl,
    card?.audioUrl,
    ...(card?.tracks || []).flatMap(t => [t.audioUrl, t.imageUrl]),
  ].filter(Boolean);

  await Promise.allSettled(urlsToDelete.map(url => deleteStorageFile(url)));
  return withTimeout(deleteDoc(doc(db, 'content', 'libraryCards', 'items', id)));
}

export async function getLibraryCards() {
  const snap = await withTimeout(getDocs(libraryCardsRef()));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Categories ─────────────────────────────────────────────
export async function saveCategory(data, id) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (id) {
    return withTimeout(setDoc(doc(db, 'content', 'categories', 'items', id), payload, { merge: true }));
  }
  return withTimeout(addDoc(categoriesRef(), { ...payload, createdAt: new Date().toISOString() }));
}

export async function deleteCategory(id) {
  return withTimeout(deleteDoc(doc(db, 'content', 'categories', 'items', id)));
}
