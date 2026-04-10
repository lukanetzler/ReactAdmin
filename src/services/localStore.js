// Thin localStorage layer for guest (unauthenticated) users.
// Mirrors the Firestore subcollection structure so all hooks can be
// used identically regardless of whether the user is signed in.

const KEYS = {
  profile: 'pv_guest_profile',
  dailyPath: 'pv_guest_dailyPath',
  completionHistory: 'pv_guest_completionHistory',
  trackCompletions: 'pv_guest_trackCompletions',
  journalEntries: 'pv_guest_journalEntries',
  streakDays: 'pv_guest_streakDays',
};

function genId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function get(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('pv_store', { detail: key }));
}

/** Subscribe to changes on a specific key. Returns an unsubscribe fn. */
export function subscribe(key, cb) {
  const handler = e => { if (e.detail === key) cb(get(key)); };
  window.addEventListener('pv_store', handler);
  return () => window.removeEventListener('pv_store', handler);
}

export function hasGuestData() {
  return (
    (get(KEYS.dailyPath) || []).length > 0 ||
    (get(KEYS.completionHistory) || []).length > 0 ||
    (get(KEYS.journalEntries) || []).length > 0 ||
    (get(KEYS.streakDays) || []).length > 0
  );
}

export function clearGuestData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function getGuestProfile() {
  return get(KEYS.profile) || { name: '', notifDailyVerse: true, notifReflection: true };
}

export function setGuestProfile(data) {
  set(KEYS.profile, { ...getGuestProfile(), ...data });
}

// ── Daily path ───────────────────────────────────────────────────────────────

export function getDailyPath() { return get(KEYS.dailyPath) || []; }

export function localAddToPath(item) {
  const newItem = { id: genId(), ...item };
  set(KEYS.dailyPath, [...getDailyPath(), newItem]);
  return newItem;
}

export function localUpdatePathItem(id, data) {
  set(KEYS.dailyPath, getDailyPath().map(i => i.id === id ? { ...i, ...data } : i));
}

export function localRemovePathItem(id) {
  set(KEYS.dailyPath, getDailyPath().filter(i => i.id !== id));
}

// ── Completion history ────────────────────────────────────────────────────────

export function getCompletionHistory() { return get(KEYS.completionHistory) || []; }

export function localAddCompletionHistory(item) {
  set(KEYS.completionHistory, [...getCompletionHistory(), { id: genId(), ...item }]);
}

// ── Track completions ─────────────────────────────────────────────────────────

export function getTrackCompletions() { return get(KEYS.trackCompletions) || []; }

export function localAddTrackCompletion(item) {
  set(KEYS.trackCompletions, [...getTrackCompletions(), { id: genId(), ...item }]);
}

// ── Journal entries ───────────────────────────────────────────────────────────

export function getJournalEntries() { return get(KEYS.journalEntries) || []; }

export function localAddJournalEntry(data) {
  const entry = { id: genId(), ...data, createdAt: new Date().toISOString() };
  set(KEYS.journalEntries, [...getJournalEntries(), entry]);
  return entry;
}

export function localUpdateJournalEntry(id, data) {
  set(KEYS.journalEntries, getJournalEntries().map(e => e.id === id ? { ...e, ...data } : e));
}

export function localDeleteJournalEntry(id) {
  set(KEYS.journalEntries, getJournalEntries().filter(e => e.id !== id));
}

// ── Streak days ───────────────────────────────────────────────────────────────

export function getStreakDays() { return get(KEYS.streakDays) || []; }

export function localAddStreakDay(date) {
  const days = getStreakDays();
  if (!days.includes(date)) set(KEYS.streakDays, [...days, date]);
}
