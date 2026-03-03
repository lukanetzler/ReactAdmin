import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function useCollection(path) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, ...path.split('/'));
    const unsub = onSnapshot(ref, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(`useContent listener error (${path}):`, err);
      setLoading(false);
    });
    return unsub;
  }, [path]);

  return { docs, loading };
}

// Returns all published path sessions, sorted by `order` then `day`
export function usePathSessions() {
  const { docs, loading } = useCollection('content/pathSessions/items');
  const sessions = docs
    .filter(d => d.published)
    .sort((a, b) => (a.order ?? a.day ?? 0) - (b.order ?? b.day ?? 0));
  return { sessions, loading };
}

// Returns all published library cards, optionally filtered by category
export function useLibraryCards(category) {
  const { docs, loading } = useCollection('content/libraryCards/items');
  const cards = docs
    .filter(d => d.published && (category ? d.category === category : true))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { cards, loading };
}

// Returns all categories sorted by order — used in both admin and library
export function useCategories() {
  const { docs, loading } = useCollection('content/categories/items');
  const categories = [...docs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { categories, loading };
}

// Returns ALL docs (published or not) — for admin use
export function useAllPathSessions() {
  const { docs, loading } = useCollection('content/pathSessions/items');
  const sessions = [...docs].sort((a, b) => (a.order ?? a.day ?? 0) - (b.order ?? b.day ?? 0));
  return { sessions, loading };
}

export function useAllLibraryCards() {
  const { docs, loading } = useCollection('content/libraryCards/items');
  const cards = [...docs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { cards, loading };
}
