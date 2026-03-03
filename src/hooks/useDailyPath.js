import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export function useDailyPath(uid) {
  const [personalItems, setPersonalItems] = useState([]);
  const [dismissedCardIds, setDismissedCardIds] = useState(new Set());
  const [broadcastItems, setBroadcastItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Personal path listener — separates active items from dismiss markers
  useEffect(() => {
    if (!uid) { setPersonalItems([]); setDismissedCardIds(new Set()); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'dailyPath');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const dismissed = data.filter(i => i.dismissed);
      const active = data.filter(i => !i.dismissed);
      active.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPersonalItems(active);
      setDismissedCardIds(new Set(dismissed.map(i => i.cardId)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  // Broadcast listener — cards the admin pushed to all users
  useEffect(() => {
    const q = query(
      collection(db, 'content', 'libraryCards', 'items'),
      where('broadcastToAll', '==', true),
      where('published', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({
          id: `broadcast_${d.id}`,
          cardId: d.id,
          order: d.data().broadcastOrder ?? 0,
          addedAt: d.data().createdAt ?? '',
          trackIndex: 0,
          completed: false,
          _broadcast: true,
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setBroadcastItems(data);
    }, () => {});
    return unsub;
  }, []);

  // Broadcasts appear before personal items; dismissed ones are hidden
  const filteredBroadcasts = broadcastItems.filter(b => !dismissedCardIds.has(b.cardId));
  const items = [...filteredBroadcasts, ...personalItems];

  return { items, loading };
}
