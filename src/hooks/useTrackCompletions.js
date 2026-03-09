import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Returns all permanently recorded track completions for a given card.
// Works even if the card has been removed from the user's daily path.
export function useTrackCompletions(uid, cardId) {
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
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
