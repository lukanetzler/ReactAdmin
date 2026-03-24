import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Returns a Set of date strings ('YYYY-MM-DD') for each day the user completed their path.
export function useStreakDays(uid) {
  const [days, setDays] = useState(new Set());

  useEffect(() => {
    if (!uid) { setDays(new Set()); return; }
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'streakDays'),
      (snap) => setDays(new Set(snap.docs.map(d => d.id))),
      () => {}
    );
    return unsub;
  }, [uid]);

  return days;
}
