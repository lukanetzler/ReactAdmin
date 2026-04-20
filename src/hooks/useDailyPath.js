import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import * as localStore from '../services/localStore';

export function useDailyPath(uid) {
  const [personalItems, setPersonalItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [dismissedCardIds, setDismissedCardIds] = useState(new Set());
  const [broadcastItems, setBroadcastItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Personal path listener
  useEffect(() => {
    if (!uid) {
      // Guest mode: read from localStorage
      const update = () => {
        const data = localStore.getDailyPath();
        const dismissed = data.filter(i => i.dismissed);
        const active = data.filter(i => !i.dismissed && !i.archived);
        const archived = data.filter(i => i.archived).sort((a, b) => (b.completedAt || '') > (a.completedAt || '') ? 1 : -1);
        active.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setPersonalItems(active);
        setArchivedItems(archived);
        setDismissedCardIds(new Set(dismissed.map(i => i.cardId)));
        setLoading(false);
      };
      update();
      return localStore.subscribe('pv_guest_dailyPath', update);
    }

    const ref = collection(db, 'users', uid, 'dailyPath');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const dismissed = data.filter(i => i.dismissed);
      const active = data.filter(i => !i.dismissed && !i.archived);
      const archived = data.filter(i => i.archived).sort((a, b) => (b.completedAt || '') > (a.completedAt || '') ? 1 : -1);
      active.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPersonalItems(active);
      setArchivedItems(archived);
      setDismissedCardIds(new Set(dismissed.map(i => i.cardId)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  // Broadcast listener — user-agnostic, always from Firestore
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

  const filteredBroadcasts = broadcastItems.filter(b => !dismissedCardIds.has(b.cardId));
  const items = [...filteredBroadcasts, ...personalItems];

  return { items, archivedItems, loading };
}
