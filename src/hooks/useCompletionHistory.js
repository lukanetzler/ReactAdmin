import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useCompletionHistory(uid) {
  const [completedCardIds, setCompletedCardIds] = useState(new Set());

  useEffect(() => {
    if (!uid) { setCompletedCardIds(new Set()); return; }
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'completionHistory'),
      (snap) => setCompletedCardIds(new Set(snap.docs.map(d => d.data().cardId))),
      () => {}
    );
    return unsub;
  }, [uid]);

  return completedCardIds;
}
