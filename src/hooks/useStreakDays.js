import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import * as localStore from '../services/localStore';

export function useStreakDays(uid) {
  const [days, setDays] = useState(new Set());

  useEffect(() => {
    if (!uid) {
      const update = () => setDays(new Set(localStore.getStreakDays()));
      update();
      return localStore.subscribe('pv_guest_streakDays', update);
    }

    const unsub = onSnapshot(
      collection(db, 'users', uid, 'streakDays'),
      (snap) => setDays(new Set(snap.docs.map(d => d.id))),
      () => {}
    );
    return unsub;
  }, [uid]);

  return days;
}
