import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useJournalEntries(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setEntries([]); setLoading(false); return; }

    const q = query(
      collection(db, 'users', uid, 'journalEntries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { entries, loading };
}
