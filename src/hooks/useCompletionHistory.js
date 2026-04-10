import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import * as localStore from '../services/localStore';

export function useCompletionHistory(uid) {
  const [completedCardIds, setCompletedCardIds] = useState(new Set());
  const [completionDates, setCompletionDates] = useState(new Set());

  useEffect(() => {
    if (!uid) {
      const update = () => {
        const data = localStore.getCompletionHistory();
        setCompletedCardIds(new Set(data.map(d => d.cardId)));
        setCompletionDates(new Set(
          data.filter(d => d.completedAt).map(d => d.completedAt.slice(0, 10))
        ));
      };
      update();
      return localStore.subscribe('pv_guest_completionHistory', update);
    }

    const unsub = onSnapshot(
      collection(db, 'users', uid, 'completionHistory'),
      (snap) => {
        setCompletedCardIds(new Set(snap.docs.map(d => d.data().cardId)));
        setCompletionDates(new Set(
          snap.docs.filter(d => d.data().completedAt).map(d => d.data().completedAt.slice(0, 10))
        ));
      },
      () => {}
    );
    return unsub;
  }, [uid]);

  return { completedCardIds, completionDates };
}
