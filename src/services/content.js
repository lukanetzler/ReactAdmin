import { collection, doc, addDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

const R2_WORKER_URL = import.meta.env.VITE_R2_WORKER_URL;
const R2_PUBLIC_BASE = 'https://media.prayvail.org';

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
// Uploads a file to Cloudflare R2 via the authenticated worker and returns
// the public media.prayvail.org URL. onProgress(0-100) fires as bytes transfer.
export function uploadFile(file, storagePath, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const key = storagePath;
      const workerUrl = `${R2_WORKER_URL}/upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`;

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', workerUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { url } = JSON.parse(xhr.responseText);
          resolve(url);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    } catch (e) {
      reject(e);
    }
  });
}

// Extracts the storage object path from a legacy Firebase Storage download URL.
// e.g. https://firebasestorage.googleapis.com/v0/b/BUCKET/o/library%2Fimages%2Ffile.jpg?...
//   → library/images/file.jpg
function firebaseStoragePathFromUrl(url) {
  try {
    const match = url.match(/\/o\/([^?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Deletes a file from whichever storage backend its URL points to.
// - media.prayvail.org URLs → Cloudflare R2 via worker
// - firebasestorage.googleapis.com URLs → Firebase Storage (legacy content)
export async function deleteStorageFile(url) {
  if (!url) return;
  try {
    if (url.startsWith(R2_PUBLIC_BASE)) {
      const key = url.slice(R2_PUBLIC_BASE.length + 1); // strip leading slash
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      await fetch(`${R2_WORKER_URL}/delete?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } else {
      // Legacy Firebase Storage URL
      const path = firebaseStoragePathFromUrl(url);
      if (!path) return;
      await deleteObject(ref(storage, path));
    }
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
