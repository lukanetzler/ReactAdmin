import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import * as localStore from '../services/localStore';

export function useJournalEntries(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      const update = () => {
        const data = [...localStore.getJournalEntries()];
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setEntries(data);
        setLoading(false);
      };
      update();
      return localStore.subscribe('pv_guest_journalEntries', update);
    }

    const ref = collection(db, 'users', uid, 'journalEntries');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setEntries(data);
      setLoading(false);
    }, (err) => {
      console.error('Journal listener error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { entries, loading };
}
