import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import * as localStore from '../services/localStore';

export function useTrackCompletions(uid, cardId) {
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
    if (!uid) {
      if (!cardId) { setCompletions([]); return; }
      const update = () => {
        const all = localStore.getTrackCompletions();
        setCompletions(
          all
            .filter(c => c.cardId === cardId)
            .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))
        );
      };
      update();
      return localStore.subscribe('pv_guest_trackCompletions', update);
    }

    if (!uid || !cardId) { setCompletions([]); return; }
    const q = query(
      collection(db, 'users', uid, 'trackCompletions'),
      where('cardId', '==', cardId),
      orderBy('completedAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setCompletions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [uid, cardId]);

  return completions;
}
