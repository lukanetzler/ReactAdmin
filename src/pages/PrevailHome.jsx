import React, { useState, useRef, useEffect } from 'react';
import ResourceCard from '../components/ResourceCard';
import BoxBreathing from '../components/BoxBreathing';
import GroundingExercise from '../components/GroundingExercise';
import FishingSim from '../components/FishingSim';
import { signOut, verifyBeforeUpdateEmail, updatePassword, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { usePathSessions, useLibraryCards, useCategories } from '../hooks/useContent';
import { useDailyPath } from '../hooks/useDailyPath';
import { addJournalEntry, updateJournalEntry, deleteJournalEntry } from '../services/journal';
import { updateUserProfile } from '../services/userProfile';
import { addToPath, removeFromPath, completeTrackForDay, dismissBroadcast, completePathItem, recordCompletion, recordStreakDay } from '../services/dailyPath';
import { useTrackCompletions } from '../hooks/useTrackCompletions';
import { useCompletionHistory } from '../hooks/useCompletionHistory';
import { useStreakDays } from '../hooks/useStreakDays';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import meditationTrack from '../assets/Day One - With Archer.mp3';
import { getDailyVerse } from '../data/getDailyVerse';
import {
  Compass,
  User,
  Home,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  Wheat,
  Flame,
  ChevronRight,
  Headphones,
  ArrowRight,
  ArrowLeft,
  PenLine,
  Trash2,
  Plus,
  Crown,
  Lock,
  Bell,
  Share2,
  List,
  X,
} from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.png';
import { motion, AnimatePresence } from 'framer-motion';

const pathContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const pathItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TRACK_TITLE = 'Day One - With Archer';
const FEELING_OPTIONS = ['Peaceful', 'Grateful', 'Anxious', 'Hopeful', 'Tired', 'Joyful', 'Unsettled', 'Calm'];

const PATH_CARD_COLORS = ['#E9DCC9', '#D9C9B5', '#D4A373', '#C4B5A0', '#8E9775', '#B0A898'];

const PrevailHome = ({ user, guestName, profile, profileUnsubRef, onOpenAdmin, onGoToAuth, onGoToSignUp }) => {
  const dailyVerse = getDailyVerse();

  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState('dashboard');
  const [showFlameModal, setShowFlameModal] = useState(false);

  // Dynamic content from Firestore
  const { sessions: pathSessions } = usePathSessions();
  const { categories } = useCategories();
  const { cards: allCards } = useLibraryCards();

  const isGuest = !user || user.isAnonymous;
  const userName = profile?.name || user?.displayName || guestName || 'Friend';

  // Account state (derived from profile)
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  useEffect(() => { setNameInput(profile?.name || user?.displayName || ''); }, [profile, user]);
  const notifDailyVerse = profile?.notifDailyVerse ?? true;
  const notifReflection = profile?.notifReflection ?? true;

  // Email/password change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState({ text: '', isError: false });
  const [emailChanging, setEmailChanging] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalError, setJournalError] = useState('');

  // Daily path
  const { items: pathItems, archivedItems } = useDailyPath(user?.uid);
  const activeModule = pathItems.find(i => !i._broadcast) ?? null;
  const activeModuleCard = activeModule ? allCards.find(c => c.id === activeModule.cardId) ?? null : null;
  const { completedCardIds: completedHistory, completionDates } = useCompletionHistory(user?.uid);
  const streakDays = useStreakDays(user?.uid);
  const [completedCardIds, setCompletedCardIds] = useState(new Set());
  const [activeSession, setActiveSession] = useState(null); // { title, audioUrl, imageUrl?, cardId?, pathItemId?, isPlaylistTrack?, trackIndex?, totalTracks?, skipCheckin? }
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeDetailCard, setActiveDetailCard] = useState(null);
  const [libraryDetailCard, setLibraryDetailCard] = useState(null);
  const trackCompletions = useTrackCompletions(user?.uid, (libraryDetailCard || activeDetailCard)?.id);
  const [detailPathItem, setDetailPathItem] = useState(null); // path item context when popup opened from daily path
  const [activeReadingSession, setActiveReadingSession] = useState(null); // { card, reading, trackIndex, totalReadings, pathItemId }
  const [actionSheetCard, setActionSheetCard] = useState(null);
  const [supporterLockCard, setSupporterLockCard] = useState(null);
  const [pathToast, setPathToast] = useState(null); // { message, id }
  const [togglingCardIds, setTogglingCardIds] = useState(new Set());
  const [viewingModuleId, setViewingModuleId] = useState(null);
  const [pendingCelebration, setPendingCelebration] = useState(false);

  const showPathToast = (message) => {
    const id = Date.now();
    setPathToast({ message, id });
    setTimeout(() => setPathToast(t => t?.id === id ? null : t), 2200);
  };

  const handleEmailChange = async () => {
    setEmailMsg({ text: '', isError: false });
    setEmailChanging(true);
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      setEmailMsg({ text: `Verification sent to ${newEmail}. Click the link in your inbox to confirm.`, isError: false });
      setNewEmail('');
      setShowEmailForm(false);
    } catch (err) {
      const msg = err.code === 'auth/requires-recent-login' ? 'Please sign out and sign back in before changing your email.'
        : err.code === 'auth/email-already-in-use' ? 'This email is already in use.'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : 'Something went wrong. Please try again.';
      setEmailMsg({ text: msg, isError: true });
    } finally {
      setEmailChanging(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg({ text: '', isError: false });
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', isError: true });
      return;
    }
    setPasswordChanging(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMsg({ text: 'Password updated successfully.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Current password is incorrect.'
        : err.code === 'auth/weak-password' ? 'New password must be at least 6 characters.'
        : 'Something went wrong. Please try again.';
      setPasswordMsg({ text: msg, isError: true });
    } finally {
      setPasswordChanging(false);
    }
  };

  // Journal entries from Firestore
  const { entries: journalEntries } = useJournalEntries(user?.uid);

  // Core loop state
  const [preFeelingWord, setPreFeelingWord] = useState('');
  const [postFeelingWord, setPostFeelingWord] = useState('');
  const [journalText, setJournalText] = useState('');
  const [meditatedToday, setMeditatedToday] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTime, setTrackTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const swipeStartX = useRef(null);

  useEffect(() => {
    const url = activeSession?.audioUrl || meditationTrack;
    const audio = new Audio(url);
    audioRef.current = audio;
    setTrackTime(0);
    setTrackDuration(0);
    setIsPlaying(false);
    const onTimeUpdate = () => setTrackTime(audio.currentTime);
    const onLoadedMetadata = () => setTrackDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [activeSession]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(p => !p);
  };

  const skip = (secs) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(trackDuration, audio.currentTime + secs));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const isUserSupporter = profile?.role === 'supporter' || profile?.role === 'admin';

  const handleCardTap = (card) => {
    if (card.tier === 'supporter' && !isUserSupporter) {
      setSupporterLockCard(card);
      setView('supporter-lock');
      return;
    }
    setLibraryDetailCard(card);
  };

  const onCompleteSession = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);

    if (activeSession?.isPlaylistTrack && activeSession?.pathItemId) {
      const isLast = activeSession.trackIndex >= activeSession.totalTracks - 1;
      const nextIndex = activeSession.trackIndex + 1;
      completeTrackForDay(user.uid, {
        itemId: activeSession.pathItemId,
        cardId: activeSession.cardId,
        cardTitle: activeSession.cardTitle || activeSession.title,
        trackIndex: activeSession.trackIndex,
        trackTitle: activeSession.title,
        nextIndex: isLast ? activeSession.trackIndex : nextIndex,
        isLast,
      }).catch(() => {});
      if (isLast) setPendingCelebration(true);
    } else if (activeSession?.cardId && activeSession?.pathItemId) {
      completePathItem(user.uid, activeSession.pathItemId).catch(() => {});
      recordCompletion(user.uid, activeSession.cardId, activeSession.title, 'single').catch(() => {});
    }

    if (activeSession?.cardId) {
      setCompletedCardIds(s => new Set([...s, activeSession.cardId]));
    }
    if (activeSession?.skipCheckin) {
      setView('dashboard');
      setActiveTab('home');
    } else {
      setMeditatedToday(true);
      setView('post-checkin');
    }
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState('');

  const generateShareCard = (verse) => new Promise((resolve) => {
    const SIZE = 1080;
    const PAD = 88;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const wrapText = (text, x, startY, maxW, lineH, maxLines) => {
      const words = text.split(' ');
      let line = '';
      let y = startY;
      let lines = 0;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
          if (lines === maxLines - 1) { ctx.fillText(line.trimEnd() + '…', x, y); return y + lineH; }
          ctx.fillText(line.trimEnd(), x, y);
          line = word + ' ';
          y += lineH;
          lines++;
        } else { line = test; }
      }
      if (line.trim()) ctx.fillText(line.trimEnd(), x, y);
      return y + lineH;
    };

    // Background
    ctx.fillStyle = '#433422';
    roundRect(0, 0, SIZE, SIZE, 0);
    ctx.fill();

    // Decorative circles
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.arc(SIZE + 60, -60, 360, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(212,163,115,0.08)';
    ctx.beginPath(); ctx.arc(-60, SIZE + 60, 300, 0, Math.PI * 2); ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(212,163,115,0.85)';
    ctx.font = 'bold 26px Arial, sans-serif';
    try { ctx.letterSpacing = '0.28em'; } catch (_) {}
    ctx.fillText('DAILY BREAD', PAD, 148);
    try { ctx.letterSpacing = '0'; } catch (_) {}

    // Verse
    ctx.fillStyle = '#FDF9F3';
    ctx.font = 'italic 52px Georgia, serif';
    const verseY = wrapText(`"${verse.text}"`, PAD, 248, SIZE - PAD * 2, 74, 7);

    // Reference
    ctx.fillStyle = 'rgba(253,249,243,0.5)';
    ctx.font = '30px Georgia, serif';
    ctx.fillText(verse.ref, PAD, Math.min(verseY + 32, 820));

    // Divider
    ctx.strokeStyle = 'rgba(253,249,243,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 890); ctx.lineTo(SIZE - PAD, 890); ctx.stroke();

    // Logo + branding
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath(); ctx.arc(PAD + 30, 944, 30, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, PAD, 914, 60, 60);
      ctx.restore();

      ctx.fillStyle = 'rgba(253,249,243,0.80)';
      ctx.font = 'bold 34px Arial, sans-serif';
      try { ctx.letterSpacing = '0.18em'; } catch (_) {}
      ctx.fillText('PRAYVAIL', PAD + 76, 948);
      try { ctx.letterSpacing = '0'; } catch (_) {}

      ctx.fillStyle = 'rgba(253,249,243,0.38)';
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText('Find your sanctuary', PAD + 76, 978);

      resolve(canvas);
    };
    img.onerror = () => {
      ctx.fillStyle = 'rgba(253,249,243,0.80)';
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.fillText('PRAYVAIL', PAD, 948);
      resolve(canvas);
    };
    img.src = prayvailLogo;
  });

  const handleAmen = async () => {
    const canvas = await generateShareCard(dailyVerse);
    setShareImageUrl(canvas.toDataURL('image/png'));
    setShowShareModal(true);
  };

  const handleShare = async () => {
    try {
      const res = await fetch(shareImageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'prayvail-verse.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${dailyVerse.ref} — Prayvail` });
      } else {
        const a = document.createElement('a');
        a.href = shareImageUrl; a.download = 'prayvail-verse.png'; a.click();
      }
    } catch (_) {}
  };
  const journaledToday = journalEntries.some(e => e.dateISO === new Date().toISOString().split('T')[0]);
  const [feelingInput, setFeelingInput] = useState('');

  // Calendar state
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [journalMode, setJournalMode] = useState('new'); // 'new' | 'add' | 'edit'
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [journalStep, setJournalStep] = useState(0); // 0 = word card, 1 = reflection card
  const [journalSlideDir, setJournalSlideDir] = useState(1); // 1 = forward, -1 = backward
  const [touchStartX, setTouchStartX] = useState(null);

  const today = new Date();
  const hour = today.getHours();
  const timeGreeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const todayISO = today.toISOString().split('T')[0];
  const dateString = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  // True when every non-dismissed path item has been completed for today
  const isPathDoneToday = pathItems.length > 0 && pathItems
    .filter(i => !i.dismissed)
    .every(i => !!i.completed || i.completedToday === todayISO);

  // Streak = consecutive days with a permanent streakDays record.
  // Written when the user completes their reflection, survives journal entry deletion.
  const streak = (() => {
    let count = 0;
    const d = new Date(today);
    if (!streakDays.has(todayISO)) d.setDate(d.getDate() - 1);
    while (true) {
      const iso = d.toISOString().split('T')[0];
      if (!streakDays.has(iso)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (5 - i));
    return d;
  });

  // Week strip computation
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });

  const selectedDateISO = selectedDate.toISOString().split('T')[0];
  const dayEntries = journalEntries
    .filter(e => e.dateISO === selectedDateISO)
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return aTime - bTime;
    });

  const shiftWeek = (direction) => {
    const next = weekOffset + direction;
    if (next > 0) return;
    setWeekOffset(next);
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + direction * 7);
      return d > today ? new Date(today) : d;
    });
  };

  const handleWeekSwipe = (endX) => {
    if (touchStartX === null) return;
    const diff = touchStartX - endX;
    if (Math.abs(diff) > 50) {
      const direction = diff > 0 ? -1 : 1;
      shiftWeek(direction);
    }
    setTouchStartX(null);
  };

  const openEdit = (entry) => {
    setPreFeelingWord(entry.feelingBefore || '');
    setPostFeelingWord(entry.feelingAfter || '');
    setJournalText(entry.reflection || '');
    setEditingEntryId(entry.id);
    setJournalMode('edit');
    setJournalStep(0);
    setView('journal');
  };

  const openAdd = () => {
    setPreFeelingWord('');
    setPostFeelingWord('');
    setJournalText('');
    setEditingEntryId(null);
    setJournalMode('add');
    setJournalStep(0);
    setView('journal');
  };

  // Shared modals rendered in both dashboard and resources views
  const renderSharedModals = () => (
    <>
      {activeDetailCard && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setActiveDetailCard(null); setDetailPathItem(null); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
            <div className="w-full max-w-sm max-h-[85vh] bg-[#FDF9F3] rounded-[24px] flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
              <div className="flex flex-shrink-0" style={{ minHeight: '7rem' }}>
                <div className="w-28 self-stretch flex-shrink-0 relative overflow-hidden rounded-tl-[24px]" style={{ backgroundColor: activeDetailCard.color || '#E9DCC9' }}>
                  {activeDetailCard.imageUrl && <img src={activeDetailCard.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="flex-1 px-4 py-4 flex flex-col justify-between min-w-0">
                  <div>
                    {activeDetailCard.label && <p className="text-[9px] font-bold tracking-widest text-[#433422]/40 mb-1">{activeDetailCard.label}</p>}
                    <h2 className="text-base font-serif text-[#433422] leading-snug">{activeDetailCard.title}</h2>
                    {activeDetailCard.duration && <p className="text-[10px] text-[#433422]/40 mt-1">{activeDetailCard.duration}</p>}
                    {activeDetailCard.type === 'playlist' && <p className="text-[10px] text-[#433422]/40 mt-0.5">{activeDetailCard.tracks?.length ?? 0} tracks</p>}
                    {activeDetailCard.type === 'article' && (activeDetailCard.tracks?.length ?? 0) > 0 && <p className="text-[10px] text-[#433422]/40 mt-0.5">{activeDetailCard.tracks.length} readings</p>}
                  </div>
                  {(() => {
                    const existingItems = pathItems.filter(i => i.cardId === activeDetailCard.id);
                    const isInPath = existingItems.length > 0;
                    return (
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          onClick={async () => {
                            if (isInPath) { await Promise.all(existingItems.map(item => removeFromPath(user.uid, item.id))); showPathToast('Removed from your path'); }
                            else if (activeModule) { showPathToast('Finish your current module first'); }
                            else { await addToPath(user.uid, activeDetailCard.id, pathItems.length); showPathToast('Added to your path'); }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${isInPath ? 'bg-[#D4A373] text-white' : 'bg-[#E9DCC9]/80 text-[#433422]/70 hover:bg-[#E9DCC9]'}`}
                        >
                          {isInPath ? <><div className="w-2 h-0.5 bg-white rounded-full" /><span>In Path</span></> : <><Plus size={10} /><span>Add to Path</span></>}
                        </button>
                        <button onClick={() => { setActiveDetailCard(null); setDetailPathItem(null); }} className="w-7 h-7 rounded-full bg-[#E9DCC9]/80 flex items-center justify-center flex-shrink-0">
                          <X size={13} className="text-[#433422]/60" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto border-t border-[#E9DCC9]">
                {activeDetailCard.description && <p className="text-[#433422]/70 text-sm leading-relaxed whitespace-pre-wrap px-5 py-4">{activeDetailCard.description}</p>}
                {activeDetailCard.type === 'playlist' && (
                  <div className="px-4 pb-5 space-y-2">
                    {(activeDetailCard.tracks || []).map((track, i) => {
                      const pathIdx = detailPathItem?.trackIndex ?? 0;
                      const allDone = !!detailPathItem?.completed;
                      const trackRecord = trackCompletions.find(tc => tc.trackIndex === i);
                      const isDone = !!trackRecord || (detailPathItem && (allDone || i < pathIdx));
                      const isCurrent = detailPathItem && !allDone && i === pathIdx;
                      const completedDate = trackRecord?.completedAt
                        ? new Date(trackRecord.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : null;
                      return (
                        <button key={i}
                          onClick={() => { setActiveSession({ title: track.title, audioUrl: track.audioUrl, ...(isCurrent ? { cardId: activeDetailCard.id, cardTitle: activeDetailCard.title, pathItemId: detailPathItem.id, isPlaylistTrack: true, trackIndex: i, totalTracks: activeDetailCard.tracks.length } : {}), skipCheckin: true }); setActiveDetailCard(null); setDetailPathItem(null); setView('meditation'); }}
                          className={`w-full flex items-center gap-3 rounded-[16px] px-4 py-3 border text-left active:scale-[0.98] transition-transform ${isCurrent ? 'bg-[#FFFBF5] border-[#D4A373]/50' : 'bg-white border-[#E9DCC9]'}`}>
                          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden relative ${isDone ? 'bg-[#8E9775]/15' : isCurrent ? 'bg-[#D4A373]/15' : 'bg-[#F4EFE6]'}`}>
                            {track.imageUrl ? <img src={track.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : isDone ? <span className="text-[#8E9775] text-base leading-none">✓</span> : <Play size={12} fill="currentColor" className="text-[#D4A373]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[9px] font-bold tracking-widest mb-0.5 ${isDone ? 'text-[#8E9775]' : isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/40'}`}>{isDone ? 'DONE' : isCurrent ? 'TODAY' : `TRACK ${i + 1}`}</p>
                            <p className={`text-sm font-serif truncate ${isDone ? 'text-[#433422]/40' : 'text-[#433422]'}`}>{track.title}</p>
                            {completedDate && <p className="text-[9px] text-[#8E9775]/70">{completedDate}</p>}
                          </div>
                          {isDone ? <span className="text-[9px] font-bold text-[#8E9775] bg-[#8E9775]/10 px-2 py-0.5 rounded-full flex-shrink-0">Done</span> : isCurrent ? <span className="text-[9px] font-bold text-[#D4A373] bg-[#D4A373]/10 px-2 py-0.5 rounded-full flex-shrink-0">Play</span> : <p className="text-[10px] text-[#433422]/40 flex-shrink-0">{track.duration}</p>}
                        </button>
                      );
                    })}
                    {(!activeDetailCard.tracks || activeDetailCard.tracks.length === 0) && <p className="text-center text-[#433422]/30 text-sm py-4">No tracks yet.</p>}
                  </div>
                )}
                {activeDetailCard.type === 'article' && (activeDetailCard.tracks?.length ?? 0) > 0 && (
                  <div className="px-4 pb-5 space-y-2">
                    {activeDetailCard.tracks.map((reading, i) => {
                      const pathIdx = detailPathItem?.trackIndex ?? 0;
                      const allDone = !!detailPathItem?.completed;
                      const trackRecord = trackCompletions.find(tc => tc.trackIndex === i);
                      const isDone = !!trackRecord || (detailPathItem && (allDone || i < pathIdx));
                      const isCurrent = detailPathItem && !allDone && i === pathIdx;
                      const completedDate = trackRecord?.completedAt
                        ? new Date(trackRecord.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : null;
                      return (
                        <button key={i}
                          onClick={() => setActiveReadingSession({ card: activeDetailCard, reading, trackIndex: i, totalReadings: activeDetailCard.tracks.length, pathItemId: isCurrent ? detailPathItem.id : null })}
                          className={`w-full flex items-center gap-3 rounded-[16px] px-4 py-3 border text-left active:scale-[0.98] transition-transform ${isCurrent ? 'bg-[#FFFBF5] border-[#D4A373]/50' : 'bg-white border-[#E9DCC9]'}`}>
                          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-[#8E9775]/15' : isCurrent ? 'bg-[#D4A373]/15' : 'bg-[#F4EFE6]'}`}>
                            {isDone ? <span className="text-[#8E9775] text-base leading-none">✓</span> : <List size={13} className={isCurrent ? 'text-[#D4A373]' : 'text-[#8E9775]'} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[9px] font-bold tracking-widest mb-0.5 ${isDone ? 'text-[#8E9775]' : isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/40'}`}>{isDone ? 'READ' : isCurrent ? 'TODAY' : `READING ${i + 1}`}</p>
                            <p className={`text-sm font-serif truncate ${isDone ? 'text-[#433422]/40' : 'text-[#433422]'}`}>{reading.title}</p>
                            {completedDate && <p className="text-[9px] text-[#8E9775]/70">{completedDate}</p>}
                          </div>
                          {isDone ? <span className="text-[9px] font-bold text-[#8E9775] bg-[#8E9775]/10 px-2 py-0.5 rounded-full flex-shrink-0">Done</span> : <ChevronRight size={14} className={`flex-shrink-0 ${isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/30'}`} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {activeDetailCard.type === 'single' && (
                <div className="px-5 pb-5 pt-3 border-t border-[#E9DCC9] flex-shrink-0">
                  <button onClick={() => { setActiveSession({ title: activeDetailCard.title, audioUrl: activeDetailCard.audioUrl, skipCheckin: true }); setActiveDetailCard(null); setView('meditation'); }} className="w-full py-3 bg-[#433422] text-[#FDF9F3] rounded-[16px] text-sm font-bold flex items-center justify-center gap-2">
                    <Play size={14} fill="currentColor" /> Play
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {activeReadingSession && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#FDF9F3' }}>
          {/* Coloured hero header */}
          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: activeReadingSession.card.color || '#D4A373', minHeight: '28vh' }}
          >
            {activeReadingSession.card.imageUrl && (
              <img src={activeReadingSession.card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
            {/* Soft arch transition at the bottom */}
            <div
              className="absolute bottom-0 left-[-10%] right-[-10%] h-10"
              style={{ backgroundColor: '#FDF9F3', borderTopLeftRadius: '100% 100%', borderTopRightRadius: '100% 100%' }}
            />
            {/* Close pill */}
            <button
              onClick={() => setActiveReadingSession(null)}
              className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.20)' }}
            >
              <X size={16} className="text-white" />
            </button>
            {/* Series label + reading title */}
            <div className="absolute bottom-10 left-6 right-16">
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/60 mb-1">
                {activeReadingSession.card.title.toUpperCase()} · READING {activeReadingSession.trackIndex + 1} OF {activeReadingSession.totalReadings}
              </p>
              <h2 className="text-2xl font-serif text-white leading-snug">
                {activeReadingSession.reading.title || activeReadingSession.card.title}
              </h2>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
            {activeReadingSession.reading.content
              ? <p className="text-[#433422]/80 text-base leading-[1.85] font-serif whitespace-pre-wrap">{activeReadingSession.reading.content}</p>
              : <p className="text-[#433422]/30 text-sm text-center py-16">No content yet.</p>
            }
          </div>

          {/* Footer CTA */}
          <div className="flex-shrink-0 px-6 pb-10 pt-4" style={{ borderTop: '1px solid #E9DCC9' }}>
            {activeReadingSession.pathItemId ? (
              <button onClick={() => {
                const isLast = activeReadingSession.trackIndex + 1 >= activeReadingSession.totalReadings;
                const nextIndex = activeReadingSession.trackIndex + 1;
                completeTrackForDay(user.uid, {
                  itemId: activeReadingSession.pathItemId,
                  cardId: activeReadingSession.card.id,
                  cardTitle: activeReadingSession.card.title,
                  trackIndex: activeReadingSession.trackIndex,
                  trackTitle: activeReadingSession.reading.title,
                  nextIndex: isLast ? activeReadingSession.trackIndex : nextIndex,
                  isLast,
                }).catch(() => {});
                setActiveReadingSession(null);
                if (isLast) {
                  setPendingCelebration(true);
                  setMeditatedToday(true);
                  setView('post-checkin');
                }
              }} className="w-full py-4 rounded-[20px] text-sm font-bold tracking-widest" style={{ backgroundColor: '#433422', color: '#FDF9F3' }}>
                MARK AS READ
              </button>
            ) : (
              <button onClick={() => setActiveReadingSession(null)} className="w-full py-4 rounded-[20px] text-sm font-bold tracking-widest" style={{ backgroundColor: '#F4EFE6', color: '#433422' }}>
                CLOSE
              </button>
            )}
          </div>
        </div>
      )}
      {pathToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] pointer-events-none animate-fade-in-up">
          <div className="bg-[#433422] text-[#FDF9F3] text-[11px] font-bold tracking-widest px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">{pathToast.message.toUpperCase()}</div>
        </div>
      )}
      {/* Library card snap-scroll view */}
      {libraryDetailCard && (() => {
        const card = libraryDetailCard;
        const isPlaylist = card.type === 'playlist';
        const isArticle = card.type === 'article';
        const isArticleSeries = isArticle && (card.tracks?.length ?? 0) > 0;
        const isSequential = isPlaylist || isArticleSeries;
        const isSingleAudio = !isSequential && !isArticle;
        const isSingleArticle = isArticle && !isArticleSeries;

        const existingItems = pathItems.filter(i => i.cardId === card.id);
        const isInPath = existingItems.length > 0;
        const pathItem = pathItems.find(i => i.cardId === card.id);
        const trackIdx = pathItem?.trackIndex ?? 0;
        const allTracksComplete = isSequential && !!pathItem?.completed;
        const todayStr = new Date().toISOString().slice(0, 10);
        // User already completed their track/reading for today on this sequential card
        const doneToday = isSequential && !!pathItem && pathItem.completedToday === todayStr && !allTracksComplete;

        const TypeIcon = isPlaylist ? List : isArticle ? PenLine : Headphones;

        return (
          <div className="fixed inset-0 z-[60] flex flex-col bg-[#FDF9F3] font-sans text-[#433422] animate-view-enter">
            {/* Colored arch tint */}
            <div
              className="absolute top-0 left-0 right-0 h-36 pointer-events-none overflow-hidden"
              style={{ backgroundColor: (card.color || '#D4A373') + '18' }}
            >
              <div
                className="absolute bottom-0 left-[-20%] right-[-20%] h-24 bg-[#FDF9F3]"
                style={{ borderTopLeftRadius: '100% 100%', borderTopRightRadius: '100% 100%' }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 pt-14 px-8 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setLibraryDetailCard(null)}
                className="p-3 rounded-full bg-[#F4EFE6] hover:bg-[#D4A373]/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-center max-w-[55%]">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#433422]/50">
                  {card.label || (isPlaylist ? 'PLAYLIST' : isArticle ? 'READING' : 'LISTEN')}
                </span>
                <p className="text-sm font-serif truncate">{card.title}</p>
              </div>
              <div className="w-12 h-12" />
            </div>

            {/* Add to Path button */}
            <div className="h-4 flex-shrink-0" />
            <div className="relative z-10 px-8 mb-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (isInPath) {
                    await Promise.all(existingItems.map(i => removeFromPath(user.uid, i.id)));
                    showPathToast('Removed from your path');
                  } else {
                    if (card.tier === 'supporter' && !isUserSupporter) {
                      setLibraryDetailCard(null);
                      setSupporterLockCard(card);
                      setView('supporter-lock');
                      return;
                    }
                    if (activeModule) { showPathToast('Finish your current module first'); return; }
                    const extra = isPathDoneToday ? { completedToday: todayISO } : {};
                    await addToPath(user.uid, card.id, pathItems.length, extra);
                    showPathToast('Added to your path');
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-[20px] text-xs font-bold tracking-[0.15em] uppercase transition-colors ${
                  isInPath
                    ? 'bg-[#F4EFE6] text-[#433422]/50'
                    : card.tier === 'supporter' && !isUserSupporter
                    ? 'bg-[#F4EFE6] text-[#433422]/40'
                    : 'bg-[#D4A373] text-white'
                }`}
              >
                {isInPath
                  ? <><div className="w-3 h-0.5 bg-[#433422]/40 rounded-full" /><span>In Path</span></>
                  : card.tier === 'supporter' && !isUserSupporter
                  ? <><Crown size={13} /><span>Supporter Only</span></>
                  : <><Plus size={13} /><span>Add to Path</span></>}
              </motion.button>
            </div>

            {/* Horizontal snap scroll */}
            <div
              className="flex-1 overflow-x-auto overflow-y-hidden mt-2 flex items-center no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing"
              onMouseDown={e => {
                const el = e.currentTarget;
                el.dataset.dragging = 'true';
                el.dataset.startX = e.pageX - el.offsetLeft;
                el.dataset.scrollLeft = el.scrollLeft;
              }}
              onMouseLeave={e => { e.currentTarget.dataset.dragging = 'false'; }}
              onMouseUp={e => { e.currentTarget.dataset.dragging = 'false'; }}
              onMouseMove={e => {
                const el = e.currentTarget;
                if (el.dataset.dragging !== 'true') return;
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                el.scrollLeft = parseInt(el.dataset.scrollLeft) + (parseInt(el.dataset.startX) - x);
              }}
            >
              <div className="min-w-[10vw] flex-shrink-0" />

              {/* Cover card */}
              <div
                className="w-[80vw] aspect-square rounded-[48px] flex flex-col justify-between p-9 relative overflow-hidden flex-shrink-0 mx-4 snap-center snap-always"
                style={{ backgroundColor: card.color || '#D4A373' }}
              >
                {card.imageUrl && <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute top-6 left-6 opacity-10 scale-[3] origin-top-left text-white pointer-events-none">
                  <TypeIcon size={40} />
                </div>

                {/* Cover bottom info */}
                <div className="relative z-10">
                  <p className="text-[10px] font-bold tracking-[0.4em] text-white/60 mb-3 uppercase">{card.label || ''}</p>
                  <h2 className="text-3xl font-serif text-white leading-tight">{card.title}</h2>
                  {isSequential && (
                    <p className="text-white/50 text-xs mt-2">{card.tracks?.length ?? 0} {isPlaylist ? 'tracks' : 'readings'}</p>
                  )}
                  <div className="mt-6 flex items-center gap-3 text-white/40">
                    <div className="h-px w-8 bg-white/40" />
                    <span className="text-[10px] tracking-widest uppercase">{isSequential ? 'Swipe to explore' : 'Swipe to begin'}</span>
                  </div>
                </div>
              </div>

              {/* Single audio card */}
              {isSingleAudio && (
                <div
                  className="w-[80vw] aspect-square bg-[#F4EFE6] rounded-[48px] p-9 flex flex-col justify-between flex-shrink-0 mx-4 snap-center snap-always cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => {
                    setActiveSession({ title: card.title, audioUrl: card.audioUrl, cardId: card.id, skipCheckin: true });
                    setLibraryDetailCard(null);
                    setView('meditation');
                  }}
                >
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.4em] text-[#433422]/40 uppercase">LISTEN</span>
                    <h3 className="text-3xl mt-6 font-serif leading-tight">{card.title}</h3>
                    {card.duration && <p className="text-sm text-[#433422]/50 mt-3">{card.duration}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#433422]/40 italic">Tap to play</p>
                    <div className="w-16 h-16 rounded-full bg-[#433422] flex items-center justify-center">
                      <Play size={26} fill="white" className="text-white ml-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Single article (no tracks) */}
              {isSingleArticle && (
                <div className="w-[80vw] aspect-square bg-[#F4EFE6] rounded-[48px] p-9 flex flex-col flex-shrink-0 mx-4 snap-center snap-always">
                  <span className="text-[10px] font-bold tracking-[0.4em] text-[#433422]/40 uppercase">ARTICLE</span>
                  <p className="mt-6 text-sm text-[#433422]/70 leading-relaxed overflow-y-auto">{card.description || ''}</p>
                </div>
              )}

              {/* Playlist tracks */}
              {isPlaylist && (card.tracks || []).map((track, i) => {
                const trackRecord = trackCompletions.find(tc => tc.trackIndex === i);
                const isDone = !!trackRecord || (pathItem && (allTracksComplete || i < trackIdx));
                const isLockedToday = doneToday && i === trackIdx; // today's track already done
                const isCurrent = pathItem && !allTracksComplete && i === trackIdx && !isLockedToday;
                const isLocked = !pathItem || (!isDone && !isCurrent && !isLockedToday && i > trackIdx);
                const canPlay = isCurrent;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!canPlay) return;
                      setActiveSession({
                        title: track.title,
                        audioUrl: track.audioUrl,
                        cardId: card.id, cardTitle: card.title, pathItemId: pathItem.id, isPlaylistTrack: true, trackIndex: i, totalTracks: card.tracks.length,
                        skipCheckin: true,
                      });
                      setLibraryDetailCard(null);
                      setView('meditation');
                    }}
                    className={`w-[80vw] aspect-square rounded-[48px] p-9 flex flex-col justify-between flex-shrink-0 mx-4 snap-center snap-always transition-transform ${canPlay ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'} ${isDone ? 'bg-[#EEF1EA]' : isLockedToday ? 'bg-[#F4EFE6]' : 'bg-[#F4EFE6]'}`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${isDone ? 'text-[#8E9775]' : isLockedToday ? 'text-[#D4A373]/60' : isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/30'}`}>
                        {isDone ? 'DONE' : isLockedToday ? 'COME BACK TOMORROW' : isCurrent ? 'UP NEXT' : `TRACK ${i + 1}`}
                      </span>
                      <h3 className={`text-3xl mt-6 font-serif leading-tight ${(isLocked || isLockedToday) && !isDone ? 'opacity-40' : ''}`}>{track.title}</h3>
                      {track.duration && <p className="text-sm text-[#433422]/50 mt-3">{track.duration}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#433422]/40 italic">
                        {isDone ? 'Completed' : isLockedToday ? 'Available tomorrow' : canPlay ? 'Tap to play' : ''}
                      </p>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDone ? 'bg-[#8E9775]/20' : isLockedToday ? 'bg-[#F4EFE6] border-2 border-[#D4A373]/20' : isLocked ? 'bg-[#F0EBE3]' : 'bg-[#433422]'}`}>
                        {isDone
                          ? <span className="text-[#8E9775] text-xl">✓</span>
                          : isLockedToday
                          ? <Lock size={20} className="text-[#D4A373]/50" />
                          : isLocked
                          ? <Lock size={20} className="text-[#433422]/20" />
                          : <Play size={26} fill="white" className="text-white ml-1" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Article series readings */}
              {isArticleSeries && card.tracks.map((reading, i) => {
                const trackRecord = trackCompletions.find(tc => tc.trackIndex === i);
                const isDone = !!trackRecord || (pathItem && (allTracksComplete || i < trackIdx));
                const isLockedToday = doneToday && i === trackIdx;
                const isCurrent = pathItem && !allTracksComplete && i === trackIdx && !isLockedToday;
                const isLocked = !pathItem || (!isDone && !isCurrent && !isLockedToday && i > trackIdx);
                const canRead = isCurrent;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!canRead) return;
                      setActiveReadingSession({ card, reading, trackIndex: i, totalReadings: card.tracks.length, pathItemId: pathItem.id });
                      setLibraryDetailCard(null);
                    }}
                    className={`w-[80vw] aspect-square rounded-[48px] p-9 flex flex-col justify-between flex-shrink-0 mx-4 snap-center snap-always transition-transform ${canRead ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'} ${isDone ? 'bg-[#EEF1EA]' : 'bg-[#F4EFE6]'}`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold tracking-[0.4em] uppercase ${isDone ? 'text-[#8E9775]' : isLockedToday ? 'text-[#D4A373]/60' : isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/30'}`}>
                        {isDone ? 'READ' : isLockedToday ? 'COME BACK TOMORROW' : isCurrent ? 'TODAY' : `READING ${i + 1}`}
                      </span>
                      <h3 className={`text-3xl mt-6 font-serif leading-tight ${(isLocked || isLockedToday) && !isDone ? 'opacity-40' : ''}`}>{reading.title}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#433422]/40 italic">
                        {isDone ? 'Completed' : isLockedToday ? 'Available tomorrow' : canRead ? 'Tap to read' : ''}
                      </p>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDone ? 'bg-[#8E9775]/20' : isLockedToday ? 'bg-[#F4EFE6] border-2 border-[#D4A373]/20' : isLocked ? 'bg-[#F0EBE3]' : 'bg-[#433422]'}`}>
                        {isDone
                          ? <span className="text-[#8E9775] text-xl">✓</span>
                          : isLockedToday
                          ? <Lock size={20} className="text-[#D4A373]/50" />
                          : isLocked
                          ? <Lock size={20} className="text-[#433422]/20" />
                          : <ChevronRight size={28} className="text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="min-w-[10vw] flex-shrink-0" />
            </div>

            {/* Footer description */}
            {card.description && (
              <div className="pb-12 px-12 text-center flex items-center justify-center flex-shrink-0" style={{ minHeight: 72 }}>
                <p className="text-sm italic text-[#433422]/40 max-w-xs mx-auto leading-relaxed line-clamp-2">{card.description}</p>
              </div>
            )}
            {!card.description && <div className="h-12 flex-shrink-0" />}
          </div>
        );
      })()}
    </>
  );

  // ── Supporter Lock ─────────────────────────────────────
  if (view === 'supporter-lock') {
    const card = supporterLockCard;
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF9F3] text-[#433422] font-sans animate-view-enter">
        <div className="h-[28vh] flex flex-col justify-end px-8 pb-8 relative overflow-hidden" style={{ backgroundColor: card?.color || '#E9DCC9', opacity: 0.85 }}>
          <button onClick={() => setView('resources')} className="flex items-center gap-2 text-[#433422]/50 mb-6 pt-14">
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
          <p className="text-[9px] tracking-widest font-bold text-[#433422]/50 mb-1">SUPPORTER CONTENT</p>
          <h1 className="text-2xl font-serif">{card?.title}</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#D4A373]/15 flex items-center justify-center">
            <Lock size={24} className="text-[#D4A373]" />
          </div>
          <div>
            <h2 className="text-xl font-serif mb-2">Supporter Content</h2>
            <p className="text-sm text-[#433422]/50 leading-relaxed">This content is exclusively for Prayvail Supporters. Support the mission to unlock.</p>
          </div>
          <button
            onClick={() => { setView('account'); setActiveTab('user'); }}
            className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-base"
          >
            Go to Supporter
          </button>
          <button onClick={() => setView('resources')} className="text-sm text-[#433422]/40">Go back</button>
        </div>
      </div>
    );
  }

  // ── Pre-Checkin ────────────────────────────────────────
  if (view === 'pre-checkin') {
    return (
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12 animate-view-enter">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-[#433422]/40 mb-12">
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex-1 flex flex-col">
          <h2 className="text-4xl font-serif mb-1">How do you feel</h2>
          <h2 className="text-4xl font-serif mb-10">right now?</h2>

          <input
            type="text"
            value={feelingInput}
            onChange={e => setFeelingInput(e.target.value)}
            placeholder="a word..."
            className="w-full bg-transparent border-b-2 border-[#E9DCC9] pb-3 text-xl font-serif focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20 mb-6"
          />

          <div className="flex flex-wrap gap-2 mb-auto">
            {FEELING_OPTIONS.map(word => (
              <button
                key={word}
                onClick={() => setFeelingInput(word)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  feelingInput === word
                    ? 'bg-[#D4A373] text-white border-[#D4A373]'
                    : 'bg-white border-[#E9DCC9] text-[#433422]/60'
                }`}
              >
                {word}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setPreFeelingWord(feelingInput);
              setFeelingInput('');
              setView('meditation');
            }}
            disabled={!feelingInput.trim()}
            className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3 disabled:opacity-30 transition-opacity"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── Completion Celebration ─────────────────────────────
  if (view === 'completion-celebration') {
    const seriesTitle = activeSession?.cardTitle || activeSession?.title;
    return (
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans items-center justify-center px-8 animate-view-enter">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

          {/* Icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#D4A373]/15 flex items-center justify-center">
              <div className="w-12 h-7 border-b-[3px] border-l-[3px] border-[#D4A373] transform -rotate-45 translate-y-[-5px]" />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#D4A373]/10 blur-xl" />
          </div>

          {/* Text */}
          <div>
            <p className="text-[10px] tracking-[0.4em] font-bold text-[#433422]/40 mb-3">MODULE COMPLETE</p>
            <h2 className="text-4xl font-serif mb-4 leading-tight">You finished it.</h2>
            <p className="text-[#433422]/55 text-sm leading-relaxed max-w-xs mx-auto">
              <span className="font-semibold text-[#433422]">{seriesTitle}</span> is now part of your journey. You can look back on it anytime.
            </p>
          </div>

          {/* Scripture-style flourish */}
          <div className="flex items-center gap-3 text-[#433422]/25">
            <div className="h-px w-10 bg-[#433422]/20" />
            <span className="text-[9px] tracking-[0.3em] font-bold uppercase">Every step of faith counts</span>
            <div className="h-px w-10 bg-[#433422]/20" />
          </div>

          {/* Action */}
          <button
            onClick={() => { setActiveSession(null); setView('dashboard'); setActiveTab('home'); }}
            className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[20px] font-serif text-base"
          >
            Return to My Path
          </button>
        </div>
      </div>
    );
  }

  // ── Meditation ─────────────────────────────────────────
  if (view === 'meditation') {
    const progress = trackDuration ? (trackTime / trackDuration) * 100 : 0;
    const seekTo = (clientX) => {
      if (!trackDuration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (audioRef.current) audioRef.current.currentTime = ratio * trackDuration;
    };

    return (
      <div className="flex flex-col h-screen font-sans animate-view-enter" style={{ backgroundColor: '#FDF9F3' }}>

        {/* Top nav */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <button
            onClick={() => { audioRef.current?.pause(); audioRef.current && (audioRef.current.currentTime = 0); setIsPlaying(false); setView('dashboard'); }}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" size={18} color="#433422" />
          </button>
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">MEDITATION</span>
          <div className="w-10" />
        </div>

        {/* Fire scene — embers.md */}
        <div className="flex-1 relative flex justify-center items-end overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FDF9F3 0%, #E8E2D5 100%)' }}>

          {/* Forest silhouette */}
          <svg className="absolute pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none"
            style={{ bottom: 40, width: '110%', height: 120, fill: '#433422', opacity: 0.08 }}>
            <path d="M0,100 L0,80 L20,60 L40,85 L60,40 L80,90 L100,55 L120,80 L150,30 L180,90 L210,50 L250,95 L280,45 L320,85 L350,20 L400,90 L450,40 L500,95 L550,35 L600,85 L650,25 L700,90 L750,45 L800,95 L850,30 L900,85 L950,40 L1000,90 L1000,100 Z" />
          </svg>

          {/* Fire glow */}
          <div className="absolute pointer-events-none" style={{
            bottom: 30, width: 240, height: 180,
            background: 'radial-gradient(circle, #D4A373 0%, transparent 70%)',
            filter: 'blur(10px)',
            opacity: isPlaying ? 0.1 : 0,
            transition: 'opacity 2s ease',
          }} />

          {/* Campfire container */}
          <div style={{ position: 'relative', zIndex: 4, marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg viewBox="0 0 100 120" style={{ width: 110, height: 140, filter: 'drop-shadow(0 0 10px rgba(212,163,115,0.15))' }}>
              <g fill="#433422" opacity="1">
                <rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(-10 50 108.5)" />
                <rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(15 50 108.5)" />
                <circle cx="50" cy="108.5" r="5" />
              </g>
              <path fill="#D4A373" d="M50,110 C32,110 28,92 50,48 C72,92 68,110 50,110 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 3.5s ease-in-out infinite' : 'none',
              }} />
              <path fill="#F4EFE6" d="M50,108 C40,108 34,98 50,65 C66,98 60,108 50,108 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 2.6s ease-in-out infinite' : 'none',
              }} />
              <path fill="#FFF9E6" d="M50,106 C44,106 40,102 50,80 C60,102 56,106 50,106 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 1.8s ease-in-out infinite' : 'none',
              }} />
            </svg>
          </div>
        </div>

        {/* Bottom controls — arched horizon */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '100% 40px',
          borderTopRightRadius: '100% 40px',
          marginTop: -30,
          paddingTop: 44,
          paddingBottom: 32,
          paddingLeft: 24,
          paddingRight: 24,
          boxShadow: '0 -4px 24px rgba(67,52,34,0.04)',
        }}>
          <div className="space-y-4">

            {/* Title */}
            <div className="text-center">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/35 mb-1">
                {activeSession?.cardTitle || 'NOW PLAYING'}
              </p>
              <h2 className="text-2xl font-serif leading-snug text-[#433422]">
                {activeSession?.title || TRACK_TITLE}
              </h2>
              <div className="mt-2 mx-auto w-10 h-px bg-[#D4A373]/60" />
            </div>

            {/* Progress bar */}
            <div>
              <div
                ref={progressRef}
                className="relative w-full h-7 flex items-center cursor-pointer"
                onClick={e => seekTo(e.clientX)}
                onTouchStart={e => seekTo(e.touches[0].clientX)}
                onTouchMove={e => { e.preventDefault(); seekTo(e.touches[0].clientX); }}
              >
                <div className="absolute w-full h-1 rounded-full overflow-hidden bg-[#433422]/12">
                  <div className="h-full bg-[#D4A373] rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#D4A373] rounded-full shadow-md"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono -mt-1 text-[#433422]/40">
                <span>{formatTime(trackTime)}</span>
                <span>{formatTime(trackDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4">
              <button
                onClick={() => skip(-15)}
                className="flex flex-col items-center gap-1 p-2 text-[#433422]/40 active:text-[#433422] transition-colors"
              >
                <SkipBack size={22} />
                <span className="text-[9px] font-bold tracking-wide">15s</span>
              </button>
              <button
                onClick={togglePlay}
                className="rounded-full flex items-center justify-center text-[#FDF9F3] active:scale-95 transition-transform"
                style={{ width: 72, height: 72, backgroundColor: '#D4A373', boxShadow: '0 8px 32px rgba(212,163,115,0.4)' }}
              >
                {isPlaying
                  ? <Pause fill="currentColor" size={26} />
                  : <Play fill="currentColor" size={26} className="ml-1" />}
              </button>
              <button
                onClick={() => skip(15)}
                className="flex flex-col items-center gap-1 p-2 text-[#433422]/40 active:text-[#433422] transition-colors"
              >
                <SkipForward size={22} />
                <span className="text-[9px] font-bold tracking-wide">15s</span>
              </button>
            </div>

          </div>

          {/* Complete */}
          <button
            onClick={onCompleteSession}
            className="w-full py-4 mt-3 rounded-[20px] font-serif text-base border border-[#433422]/15 text-[#433422]/50 bg-white/40"
          >
            Complete Session
          </button>
        </div>

      </div>
    );
  }

  // ── Post-Checkin ───────────────────────────────────────
  if (view === 'post-checkin') {
    return (
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12 animate-view-enter">
        <div className="flex-1 flex flex-col items-center justify-between">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4A373]/30">
            <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
          </div>

          <div className="w-full">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#D4A373] mb-4 text-center">WELL DONE</p>
            <h2 className="text-4xl font-serif mb-10 text-center">How do you feel<br />now?</h2>

            <input
              type="text"
              value={feelingInput}
              onChange={e => setFeelingInput(e.target.value)}
              placeholder="a word..."
              className="w-full bg-transparent border-b-2 border-[#E9DCC9] pb-3 text-xl font-serif focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20 mb-6"
            />

            <div className="flex flex-wrap gap-2 justify-center">
              {FEELING_OPTIONS.map(word => (
                <button
                  key={word}
                  onClick={() => setFeelingInput(word)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    feelingInput === word
                      ? 'bg-[#D4A373] text-white border-[#D4A373]'
                      : 'bg-white border-[#E9DCC9] text-[#433422]/60'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={() => {
                setPostFeelingWord(feelingInput);
                setFeelingInput('');
                setJournalMode('new');
                setJournalSlideDir(1);
                setJournalStep(1);
                setView('journal');
              }}
              className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Journal (new / add / edit) ─────────────────────────
  if (view === 'journal') {
    const isEditMode = journalMode === 'edit';
    const isAddMode = journalMode === 'add';
    const isNewMode = journalMode === 'new';

    const entryDateISO = isEditMode
      ? (journalEntries.find(e => e.id === editingEntryId)?.dateISO || todayISO)
      : isAddMode ? selectedDate.toISOString().split('T')[0]
      : todayISO;

    const entryDateDisplay = isEditMode
      ? (journalEntries.find(e => e.id === editingEntryId)?.dateDisplay || dateString)
      : isAddMode
      ? selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      : dateString;

    const goBack = () => {
      if (journalStep === 1) {
        if (isNewMode) { setView('post-checkin'); return; }
        setJournalSlideDir(-1);
        setJournalStep(0);
        return;
      }
      setJournalText('');
      setJournalError('');
      setJournalStep(0);
      if (isNewMode) { setJournalMode('new'); setView('dashboard'); }
      else { setJournalMode('new'); setEditingEntryId(null); setView('calendar-log'); }
    };

    const goToReflection = () => {
      setJournalSlideDir(1);
      setJournalStep(1);
    };

    const handleSave = async () => {
      setJournalSaving(true);
      setJournalError('');
      try {
        if (isEditMode) {
          await updateJournalEntry(user.uid, editingEntryId, {
            feelingBefore: preFeelingWord,
            feelingAfter: postFeelingWord,
            reflection: journalText,
          });
        } else {
          await addJournalEntry(user.uid, {
            dateISO: entryDateISO,
            dateDisplay: entryDateDisplay,
            feelingAfter: postFeelingWord,
            reflection: journalText,
            ...(isNewMode && activeSession?.title ? { meditationTitle: activeSession.title } : {}),
          });
        }
        setJournalMode('new');
        setEditingEntryId(null);
        setJournalText('');
        setJournalStep(0);
        if (isNewMode) {
          recordStreakDay(user.uid).catch(() => {});
          if (pendingCelebration) { setPendingCelebration(false); setView('completion-celebration'); }
          else { setView('dashboard'); }
        } else { setView('calendar-log'); }
      } catch {
        setJournalError('Could not save. Please try again.');
      } finally {
        setJournalSaving(false);
      }
    };

    const WORD_SUGGESTIONS = [
      'Grateful', 'Peaceful', 'Hopeful', 'Joyful', 'Blessed',
      'Tired', 'Heavy', 'Anxious', 'Restless', 'Overwhelmed',
      'Grounded', 'Clear', 'Uncertain', 'Renewed',
    ];

    const slideVariants = {
      enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    return (
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans overflow-hidden animate-view-enter">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-12 pb-4 flex-shrink-0">
          <button onClick={goBack} className="w-9 h-9 rounded-full bg-[#F4EFE6] flex items-center justify-center">
            <ArrowLeft size={16} className="text-[#433422]/60" />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-[#433422]/40 uppercase">
              {isEditMode ? 'Edit Reflection' : isAddMode ? 'New Reflection' : "Today's Reflection"}
            </p>
            <p className="text-xs text-[#433422]/50 mt-0.5">{entryDateDisplay}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pb-6 flex-shrink-0">
          <motion.div animate={{ width: journalStep === 0 ? 28 : 10, backgroundColor: journalStep === 0 ? '#D4A373' : '#E9DCC9' }} transition={{ duration: 0.3 }} className="h-1.5 rounded-full" />
          <motion.div animate={{ width: journalStep === 1 ? 28 : 10, backgroundColor: journalStep === 1 ? '#D4A373' : '#E9DCC9' }} transition={{ duration: 0.3 }} className="h-1.5 rounded-full" />
        </div>

        {/* Sliding cards */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={journalSlideDir} mode="wait">

            {journalStep === 0 ? (
              <motion.div
                key="journal-step-0"
                custom={journalSlideDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute inset-0 flex flex-col px-8 pb-8"
              >
                <h2 className="text-2xl font-serif text-[#433422] mb-1">How would you summarise today?</h2>
                <p className="text-sm text-[#433422]/40 mb-7">Choose a word or write your own</p>

                <input
                  type="text"
                  value={preFeelingWord}
                  onChange={e => setPreFeelingWord(e.target.value)}
                  placeholder="one word…"
                  maxLength={32}
                  className="w-full bg-white rounded-[20px] px-5 py-4 border border-[#E9DCC9] text-[#433422] font-serif text-2xl text-center focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20 mb-6"
                />

                <div className="flex flex-wrap gap-2 mb-auto">
                  {WORD_SUGGESTIONS.map(word => (
                    <motion.button
                      key={word}
                      onClick={() => setPreFeelingWord(word)}
                      whileTap={{ scale: 0.94 }}
                      className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${preFeelingWord === word ? 'bg-[#D4A373] border-[#D4A373] text-white' : 'bg-white border-[#E9DCC9] text-[#433422]/60 hover:border-[#D4A373]/50'}`}
                    >{word}</motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={goToReflection}
                  disabled={!preFeelingWord.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3 disabled:opacity-25 mt-8"
                >
                  Continue <ArrowRight size={18} />
                </motion.button>
              </motion.div>

            ) : (
              <motion.div
                key="journal-step-1"
                custom={journalSlideDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute inset-0 flex flex-col px-8 pb-8"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-serif text-[#433422]">What's on your heart?</h2>
                </div>
                <p className="text-sm text-[#433422]/40 mb-5">Write freely</p>

                <textarea
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  placeholder="Write what's on your heart..."
                  className="flex-1 w-full bg-white rounded-[24px] p-6 border border-[#E9DCC9] text-[#433422] font-sans text-base leading-relaxed resize-none focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20 mb-4"
                  style={{ fontFamily: 'inherit' }}
                />

                {journalError && <p className="text-[#D4A373] text-xs font-bold text-center mb-2">{journalError}</p>}

                <motion.button
                  onClick={handleSave}
                  disabled={journalSaving}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {journalSaving ? 'Saving…' : isEditMode ? 'Save Changes' : journalText.trim() ? 'Complete' : 'Continue'} {!journalSaving && <ArrowRight size={18} />}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Calendar Log ───────────────────────────────────────
  if (view === 'calendar-log') {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const weekLabel = firstDay.getMonth() === lastDay.getMonth()
      ? firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : `${firstDay.toLocaleDateString('en-GB', { month: 'short' })} – ${lastDay.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;

    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">
        <header className="relative h-[26vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">CALENDAR</p>
            <h1 className="text-3xl font-serif">Reflections</h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
              <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
            </svg>
          </div>
        </header>

        {/* Day entries */}
        <main className="px-8 pt-6 pb-32">
          {/* Week strip */}
          <div
            className="mb-6"
            onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={e => handleWeekSwipe(e.changedTouches[0].clientX)}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => shiftWeek(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#433422]/40 transition-colors"
              >
                <ChevronRight className="rotate-180" size={18} />
              </button>
              <span className="text-[11px] font-bold text-[#433422]/50 tracking-wide">{weekLabel}</span>
              <button
                onClick={() => shiftWeek(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${weekOffset >= 0 ? 'text-[#433422]/15 cursor-default' : 'text-[#433422]/40'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex gap-1.5">
              {weekDays.map((d, i) => {
                const iso = d.toISOString().split('T')[0];
                const isSelected = iso === selectedDateISO;
                const isToday = iso === todayISO;
                const isFuture = iso > todayISO;
                const hasEntries = journalEntries.some(e => e.dateISO === iso);
                return (
                  <button
                    key={i}
                    onClick={() => !isFuture && setSelectedDate(d)}
                    className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
                      isFuture
                        ? 'bg-[#EDE8DF] text-[#433422]/20 cursor-default'
                        : isSelected
                        ? 'bg-[#433422] text-white'
                        : isToday
                        ? 'bg-[#D4A373]/25 text-[#433422]'
                        : 'bg-[#E9DCC9] text-[#433422]/60'
                    }`}
                  >
                    <span className="text-[9px] font-bold mb-1">{DAY_LABELS[d.getDay()]}</span>
                    <span className="text-sm font-bold">{d.getDate()}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      hasEntries ? (isSelected ? 'bg-white/60' : 'bg-[#D4A373]') : 'bg-transparent'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#433422]/40 uppercase">
                {selectedDateISO === todayISO ? 'Today' : selectedDate.toLocaleDateString('en-GB', { weekday: 'long' })}
              </p>
              <p className="text-lg font-serif">{selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button
              onClick={openAdd}
              className="w-10 h-10 bg-[#433422] rounded-full flex items-center justify-center text-[#FDF9F3] shadow-md active:scale-95 transition-transform"
            >
              <Plus size={18} />
            </button>
          </div>

          {dayEntries.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-lg text-[#433422]/30 mb-1">No reflections yet.</p>
              <p className="text-xs text-[#433422]/20">Tap + to add one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayEntries.map((entry, i) => (
                <div key={entry.id} className="bg-white rounded-[28px] p-6 border border-[#E9DCC9]">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] tracking-widest font-bold text-[#433422]/30 uppercase">
                      {dayEntries.length > 1 ? `Session ${i + 1}` : 'Reflection'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(entry)}
                        className="w-8 h-8 rounded-full bg-[#F9F4EE] flex items-center justify-center text-[#433422]/40 hover:text-[#433422] transition-colors"
                      >
                        <PenLine size={14} />
                      </button>
                      <button
                        onClick={() => deleteJournalEntry(user.uid, entry.id)}
                        className="w-8 h-8 rounded-full bg-[#F9F4EE] flex items-center justify-center text-[#433422]/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {entry.feelingBefore && (
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-[#433422]/40 w-20 flex-shrink-0">Feeling:</span>
                        <span className="text-sm text-[#433422]">{entry.feelingBefore}</span>
                      </div>
                    )}
                    {entry.feelingAfter && (
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-[#433422]/40 w-20 flex-shrink-0">Feeling:</span>
                        <span className="text-sm text-[#433422]">{entry.feelingAfter}</span>
                      </div>
                    )}
                    {entry.reflection && (
                      <div className="flex gap-3 pt-1">
                        <span className="text-xs font-bold text-[#433422]/40 w-20 flex-shrink-0">Reflected:</span>
                        <span className="text-sm text-[#433422] leading-relaxed">{entry.reflection}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        </div>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={false} onClick={() => { setActiveTab('user'); setView('account'); }} />
            <NavIcon icon={<Calendar />} active={true} onClick={() => {}} />
            <button
              onClick={() => { setActiveTab('home'); setView('dashboard'); }}
              className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <NavIcon icon={<Wheat />} active={activeTab === 'wheat'} onClick={() => { setActiveTab('wheat'); setView('resources'); }} />
            <NavIcon icon={<Compass />} active={false} onClick={() => { setActiveTab('compass'); setView('explore'); }} />
          </div>
        </nav>
      </div>
    );
  }

  // ── Account ────────────────────────────────────────────
  if (view === 'account' && isGuest) {
    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">

          <header className="relative h-[22vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">PROFILE</p>
              <h1 className="text-3xl font-serif">Your Sanctuary</h1>
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
              <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
                <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
              </svg>
            </div>
          </header>

          <main className="px-6 pt-4 pb-32 space-y-4">

            {/* Name */}
            <div className="bg-white rounded-[28px] p-6">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40 mb-4">YOUR NAME</p>
              <p className="text-2xl font-serif text-[#433422] pb-2 border-b border-[#E9DCC9]">
                {userName}
              </p>
            </div>

            {/* Data safety warning */}
            <div className="bg-[#D4A373]/10 rounded-[28px] p-5 flex gap-4 items-start border border-[#D4A373]/20">
              <div className="w-9 h-9 rounded-xl bg-[#D4A373]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={15} className="text-[#D4A373]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#433422] mb-1">Your data is device-only</p>
                <p className="text-xs text-[#433422]/60 leading-relaxed">
                  Your path, journal, and progress are saved on this device only. Create a free account to keep everything safe across all your devices.
                </p>
              </div>
            </div>

            {/* Sign up CTA */}
            <div className="bg-white rounded-[28px] p-6 space-y-3">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40 mb-1">YOUR JOURNEY</p>
              <p className="text-sm text-[#433422]/70 leading-relaxed">
                A free account keeps your sanctuary safe, synced, and with you wherever you go.
              </p>
              <button
                onClick={onGoToSignUp || onGoToAuth}
                className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[24px] text-sm font-bold tracking-widest"
              >
                CREATE FREE ACCOUNT
              </button>
              <button
                onClick={onGoToAuth}
                className="w-full py-3.5 text-sm font-bold text-[#433422]/50 tracking-widest border border-[#E9DCC9] rounded-[24px]"
              >
                SIGN IN
              </button>
            </div>

          </main>
        </div>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={true} onClick={() => {}} />
            <NavIcon icon={<Calendar />} active={false} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
            <NavIcon icon={<Home />} active={false} onClick={() => { setActiveTab('home'); setView('dashboard'); }} />
            <NavIcon icon={<Compass />} active={false} onClick={() => { setActiveTab('resources'); setView('resources'); }} />
            <NavIcon icon={<PenLine />} active={false} onClick={() => { setActiveTab('journal'); setView('journal'); }} />
          </div>
        </nav>
      </div>
    );
  }

  if (view === 'account') {
    const notifRows = [
      { label: 'Daily Verse', desc: 'Morning verse to start your day', state: notifDailyVerse, key: 'notifDailyVerse' },
      { label: 'Reflection Reminder', desc: 'Gentle nudge to journal each evening', state: notifReflection, key: 'notifReflection' },
    ];

    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">

        <header className="relative h-[22vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
          </div>

          <div className="relative z-10">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">ACCOUNT</p>
            <h1 className="text-3xl font-serif">Your Profile</h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
              <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
            </svg>
          </div>
        </header>

        <main className="px-6 pt-4 pb-32 space-y-4">

          {/* Supporter */}
          <div className="bg-[#F9F4EE] rounded-[28px] p-6 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-36 h-36 bg-[#D4A373]/10 rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4A373]/20 flex items-center justify-center flex-shrink-0">
                <Crown size={17} className="text-[#D4A373]" />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">SUPPORTER</p>
                <p className="font-serif text-[#433422] text-base">Become a Supporter</p>
              </div>
            </div>
            <p className="text-sm text-[#433422]/55 leading-relaxed mb-4">
              Support the mission and unlock premium sessions, deeper reflection tools, and exclusive content as the sanctuary grows.
            </p>
            <div className="flex items-center gap-2.5 py-3 px-4 bg-[#433422]/6 rounded-[16px]">
              <Lock size={13} className="text-[#433422]/30" />
              <span className="text-[11px] font-bold text-[#433422]/30 tracking-widest">COMING SOON</span>
            </div>
          </div>

          {/* Name */}
          <div className="bg-white rounded-[28px] p-6">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40 mb-4">YOUR NAME</p>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="w-full text-2xl font-serif bg-transparent border-b border-[#E9DCC9] pb-2 focus:outline-none focus:border-[#D4A373] transition-colors caret-[#D4A373]"
              placeholder="Your name..."
            />
            {nameInput.trim().length > 0 && nameInput.trim() !== userName && (
              <button
                onClick={async () => {
                  setNameSaving(true);
                  setNameError('');
                  try {
                    const trimmed = nameInput.trim();
                    await updateUserProfile(user.uid, { name: trimmed });
                    await updateProfile(user, { displayName: trimmed });
                  } catch {
                    setNameError('Could not save. Please try again.');
                  } finally {
                    setNameSaving(false);
                  }
                }}
                disabled={nameSaving}
                className="mt-4 px-6 py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold tracking-wide disabled:opacity-50"
              >
                {nameSaving ? 'Saving...' : 'Save'}
              </button>
            )}
            {nameError && <p className="text-red-400 text-xs mt-2">{nameError}</p>}
          </div>

          {/* Email + Password side by side */}
          <div className="flex gap-3 items-start">
            {/* Email */}
            <div className="flex-1 bg-white rounded-[28px] p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">EMAIL</p>
                <button
                  onClick={() => { setShowEmailForm(f => !f); setEmailMsg({ text: '', isError: false }); setNewEmail(''); }}
                  className="text-[10px] font-bold tracking-widest text-[#D4A373]"
                >
                  {showEmailForm ? 'CANCEL' : 'CHANGE'}
                </button>
              </div>
              <p className="text-xs text-[#433422]/60 truncate mb-1">{user.email}</p>
              {showEmailForm && (
                <div className="space-y-2 mt-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="New email"
                    className="w-full bg-[#F4EFE6] rounded-[14px] px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 transition-all placeholder:text-[#433422]/30"
                  />
                  {emailMsg.text && (
                    <p className={`text-[10px] leading-relaxed ${emailMsg.isError ? 'text-red-400' : 'text-[#8E9775]'}`}>{emailMsg.text}</p>
                  )}
                  <button
                    onClick={handleEmailChange}
                    disabled={emailChanging || !newEmail.trim()}
                    className="w-full py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[16px] text-[10px] font-bold tracking-wide disabled:opacity-40"
                  >
                    {emailChanging ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              )}
              {!showEmailForm && emailMsg.text && (
                <p className={`text-[10px] mt-1 leading-relaxed ${emailMsg.isError ? 'text-red-400' : 'text-[#8E9775]'}`}>{emailMsg.text}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex-1 bg-white rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">PASSWORD</p>
                <button
                  onClick={() => { setShowPasswordForm(f => !f); setPasswordMsg({ text: '', isError: false }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="text-[10px] font-bold tracking-widest text-[#D4A373]"
                >
                  {showPasswordForm ? 'CANCEL' : 'CHANGE'}
                </button>
              </div>
              {!showPasswordForm && (
                <p className="text-xs text-[#433422]/40 mt-1">••••••••</p>
              )}
              {showPasswordForm && (
                <div className="space-y-2 mt-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Current"
                    className="w-full bg-[#F4EFE6] rounded-[14px] px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 transition-all placeholder:text-[#433422]/30"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New"
                    className="w-full bg-[#F4EFE6] rounded-[14px] px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 transition-all placeholder:text-[#433422]/30"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    className="w-full bg-[#F4EFE6] rounded-[14px] px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 transition-all placeholder:text-[#433422]/30"
                  />
                  {passwordMsg.text && (
                    <p className={`text-[10px] leading-relaxed ${passwordMsg.isError ? 'text-red-400' : 'text-[#8E9775]'}`}>{passwordMsg.text}</p>
                  )}
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[16px] text-[10px] font-bold tracking-wide disabled:opacity-40"
                  >
                    {passwordChanging ? 'Updating...' : 'Update'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-[28px] p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <Bell size={14} className="text-[#433422]/40" />
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">NOTIFICATIONS</p>
            </div>
            <div className="space-y-5">
              {notifRows.map(({ label, desc, state, key }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#433422]">{label}</p>
                    <p className="text-xs text-[#433422]/40 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={async () => {
                      const newVal = !state;
                      await updateUserProfile(user.uid, { [key]: newVal });
                    }}
                    className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${state ? 'bg-[#D4A373]' : 'bg-[#433422]/15'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${state ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Dashboard */}
          {profile?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[24px] text-sm font-bold tracking-widest"
            >
              ADMIN DASHBOARD
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={() => signOut(auth)}
            className="w-full py-4 text-sm font-bold text-[#433422]/30 tracking-widests"
          >
            SIGN OUT
          </button>

          {/* Danger Zone */}
          <div className="bg-[#433422]/[0.04] rounded-[28px] p-6 border border-[#433422]/10">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/30 mb-2">DANGER ZONE</p>
            <p className="text-xs text-[#433422]/40 mb-4">This action is permanent and cannot be undone.</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold tracking-wide hover:opacity-80 transition-opacity"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#433422] font-bold">Enter your password to confirm deletion:</p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-white rounded-[16px] px-4 py-3 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none transition-colors"
                />
                {deleteError && <p className="text-[#D4A373] text-xs font-bold">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                    className="flex-1 py-2.5 bg-[#E9DCC9]/50 text-[#433422]/50 rounded-[16px] text-[10px] font-bold tracking-wide"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!deletePassword) { setDeleteError('Password is required.'); return; }
                      setDeleting(true);
                      setDeleteError('');
                      try {
                        // Re-authenticate
                        const credential = EmailAuthProvider.credential(user.email, deletePassword);
                        await reauthenticateWithCredential(auth.currentUser, credential);

                        // Unsubscribe Firestore listener before any deletes
                        if (profileUnsubRef.current) {
                          profileUnsubRef.current();
                          profileUnsubRef.current = null;
                        }

                        // Delete auth account first (this is what matters)
                        const uid = auth.currentUser.uid;
                        await deleteUser(auth.currentUser);

                        // Best-effort Firestore cleanup after auth deletion
                        try { await deleteDoc(doc(db, 'users', uid)); } catch {}
                      } catch (err) {
                        console.error('Delete account error:', err);
                        setDeleting(false);
                        const code = err?.code || '';
                        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                          setDeleteError('Incorrect password.');
                        } else if (code === 'auth/too-many-requests') {
                          setDeleteError('Too many attempts. Please try again later.');
                        } else {
                          setDeleteError('Could not delete account. Please sign out, sign back in, and try again.');
                        }
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[16px] text-[10px] font-bold tracking-wide disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
        </div>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={true} onClick={() => {}} />
            <NavIcon icon={<Calendar />} active={false} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
            <button
              onClick={() => { setActiveTab('home'); setView('dashboard'); }}
              className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <NavIcon icon={<Wheat />} active={activeTab === 'wheat'} onClick={() => { setActiveTab('wheat'); setView('resources'); }} />
            <NavIcon icon={<Compass />} active={false} onClick={() => { setActiveTab('compass'); setView('explore'); }} />
          </div>
        </nav>

      </div>
    );
  }

  // ── Resources ───────────────────────────────────────────
  if (view === 'resources') {

    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">

        <header className="relative h-[26vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">SANCTUARY</p>
            <h1 className="text-3xl font-serif">Build your path</h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
              <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
            </svg>
          </div>
        </header>

        <main className="pt-4 pb-32 space-y-10">

          {/* 30-Day Path */}
          {pathSessions.length > 0 && (
            <section>
              <div className="px-8 flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">FEATURED</p>
                  <h2 className="text-xl font-serif">The 30-Day Path</h2>
                </div>
                <span className="text-[10px] font-bold text-[#433422]/30">1 / {pathSessions.length}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pl-8 pr-6 pb-1">
                {pathSessions.map((session) => {
                  const color = PATH_CARD_COLORS[(( session.day || 1) - 1) % PATH_CARD_COLORS.length];
                  const isWired = !!session.audioUrl;
                  return (
                    <button
                      key={session.id}
                      onClick={() => { if (!isWired) return; setActiveSession({ title: session.title || `Day ${session.day}`, audioUrl: session.audioUrl }); setView('meditation'); }}
                      className={`flex-shrink-0 w-[130px] rounded-[22px] overflow-hidden text-left shadow-sm ${isWired ? 'active:scale-95 transition-transform' : ''}`}
                    >
                      <div className="h-[96px] relative flex flex-col justify-between p-3.5" style={{ backgroundColor: color }}>
                        <Headphones size={18} className="absolute bottom-10 right-3.5 text-[#433422]/20" />
                        <span className="relative text-[8px] font-bold tracking-widest text-[#433422]/50">DAY {session.day}</span>
                        {isWired ? (
                          <div className="relative self-end w-6 h-6 rounded-full bg-[#433422] flex items-center justify-center">
                            <Play size={9} fill="currentColor" className="text-[#FDF9F3] ml-0.5" />
                          </div>
                        ) : (
                          <div className="relative self-end w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">
                            <Lock size={9} className="text-[#433422]/40" />
                          </div>
                        )}
                      </div>
                      <div className="bg-white px-3.5 pt-2.5 pb-3">
                        <p className="text-[11px] font-serif text-[#433422] leading-tight">{session.title}</p>
                        <p className="text-[9px] text-[#433422]/40 font-bold mt-0.5">{session.duration}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Dynamic library categories */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            return categories.map(cat => {
              const catCards = allCards.filter(c => c.category === cat.value);
              if (catCards.length === 0) return null;
              return (
                <section key={cat.id || cat.value} className="px-8">
                  <div className="mb-4">
                    <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">{cat.sectionTag || 'SERIES'}</p>
                    <h2 className="text-xl font-serif">{cat.name}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {catCards.map((s) => {
                      const existingItems = pathItems.filter(i => i.cardId === s.id);
                      const isInPath = existingItems.length > 0;
                      const pathItem = existingItems[0];
                      const isSequential = s.type === 'playlist' || (s.type === 'article' && (s.tracks?.length ?? 0) > 0);
                      const isLockedToday = isSequential && !!pathItem && pathItem.completedToday === todayStr && !pathItem.completed;
                      return (
                        <ResourceCard
                          key={s.id}
                          {...s}
                          inPath={isInPath}
                          completed={completedHistory.has(s.id)}
                          lockedToday={isLockedToday}
                          onClick={() => handleCardTap(s)}
                          onLongPress={() => setActionSheetCard(s)}
                          onContextMenu={(e) => { e.preventDefault(); setActionSheetCard(s); }}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            });
          })()}

          {/* Empty state */}
          {pathSessions.length === 0 && allCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <p className="text-[#433422]/30 text-sm">Content coming soon.</p>
            </div>
          )}

        </main>
        </div>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={false} onClick={() => { setActiveTab('user'); setView('account'); }} />
            <NavIcon icon={<Calendar />} active={false} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
            <button
              onClick={() => { setActiveTab('home'); setView('dashboard'); }}
              className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <NavIcon icon={<Wheat />} active={true} onClick={() => {}} />
            <NavIcon icon={<Compass />} active={false} onClick={() => { setActiveTab('compass'); setView('explore'); }} />
          </div>
        </nav>

        {/* Action sheet — long-press to add/remove from path */}
        {actionSheetCard && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setActionSheetCard(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDF9F3] rounded-t-[28px] px-6 pb-10 pt-5 animate-sheet-enter">
              <div className="w-10 h-1 bg-[#433422]/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ backgroundColor: actionSheetCard.color || '#E9DCC9' }} />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold tracking-widest text-[#433422]/40">{actionSheetCard.label || 'CONTENT'}</p>
                  <p className="font-serif text-[#433422] text-base leading-snug truncate">{actionSheetCard.title}</p>
                </div>
              </div>
              {(() => {
                const existingItems = pathItems.filter(i => i.cardId === actionSheetCard.id);
                const isSupporter = actionSheetCard.tier === 'supporter' && !isUserSupporter;
                return existingItems.length > 0 ? (
                  <button
                    onClick={async () => {
                      await Promise.all(existingItems.map(item => removeFromPath(user.uid, item.id)));
                      showPathToast('Removed from your path');
                      setActionSheetCard(null);
                    }}
                    className="w-full py-4 bg-[#433422]/10 text-[#433422] rounded-[24px] font-serif text-base"
                  >
                    Remove from My Path
                  </button>
                ) : isSupporter ? (
                  <div className="w-full py-4 bg-[#F4EFE6] rounded-[24px] text-center">
                    <p className="text-sm font-serif text-[#433422]/50">Supporter only content</p>
                    <button
                      onClick={() => { setActionSheetCard(null); setActiveTab('user'); setView('account'); }}
                      className="text-[10px] font-bold tracking-widest text-[#D4A373] mt-1"
                    >
                      BECOME A SUPPORTER
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (activeModule) { showPathToast('Finish your current module first'); setActionSheetCard(null); return; }
                      const extra = isPathDoneToday ? { completedToday: todayISO } : {};
                      await addToPath(user.uid, actionSheetCard.id, pathItems.length, extra);
                      showPathToast('Added to your path');
                      setActionSheetCard(null);
                    }}
                    className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-base"
                  >
                    {isPathDoneToday ? 'Add to Path (available tomorrow)' : 'Add to My Path'}
                  </button>
                );
              })()}
            </div>
          </>
        )}

        {renderSharedModals()}

      </div>
    );
  }

  // ── Box Breathing ──────────────────────────────────────
  if (view === 'breathe') {
    return <BoxBreathing onBack={() => setView('explore')} />;
  }

  // ── Grounding Exercise ─────────────────────────────────
  if (view === 'ground') {
    return <GroundingExercise onBack={() => setView('explore')} user={user} />;
  }

  // ── Calm Fishing ───────────────────────────────────────
  if (view === 'fishing') {
    return <FishingSim onBack={() => setView('explore')} />;
  }

  // ── Explore ─────────────────────────────────────────────
  if (view === 'explore') {
    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">

          <header className="relative h-[26vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">DISCOVER</p>
              <h1 className="text-3xl font-serif">Explore</h1>
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
              <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
                <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
              </svg>
            </div>
          </header>

          <main className="pt-4 pb-32 space-y-10">

            {/* Wellness */}
            <section className="px-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">A MOMENT OF STILLNESS</p>
                  <h2 className="text-xl font-serif">Breathe & Ground</h2>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setView('breathe')}
                  className="w-full bg-white rounded-[24px] p-5 border border-[#E9DCC9] flex items-center gap-4 text-left hover:border-[#D4A373] transition-colors"
                >
                  <div className="w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center bg-[#D4A373]/10">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold tracking-widest text-[#D4A373] mb-0.5">BREATH WORK</p>
                    <p className="text-sm font-serif text-[#433422]">Box Breathing</p>
                    <p className="text-[10px] text-[#433422]/40 mt-0.5">4-count inhale, hold, exhale, hold</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#433422" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#433422]/20 flex-shrink-0">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>

                <button
                  onClick={() => setView('ground')}
                  className="w-full bg-white rounded-[24px] p-5 border border-[#E9DCC9] flex items-center gap-4 text-left hover:border-[#8E9775] transition-colors"
                >
                  <div className="w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center bg-[#8E9775]/10">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold tracking-widest text-[#8E9775] mb-0.5">GROUNDING</p>
                    <p className="text-sm font-serif text-[#433422]">5-4-3-2-1 Senses</p>
                    <p className="text-[10px] text-[#433422]/40 mt-0.5">Anchor yourself in the present moment</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#433422" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#433422]/20 flex-shrink-0">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>

                <button
                  onClick={() => setView('fishing')}
                  className="w-full bg-white rounded-[24px] p-5 border border-[#E9DCC9] flex items-center gap-4 text-left hover:border-[#5b8fa8] transition-colors"
                >
                  <div className="w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center bg-[#5b8fa8]/10">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b8fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 5v8a4 4 0 0 1-4 4H6"/><path d="m6 17-3 3 3 3"/><path d="M21 3h-6"/><path d="M21 3v6"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold tracking-widest text-[#5b8fa8] mb-0.5">MINDFUL GAME</p>
                    <p className="text-sm font-serif text-[#433422]">Calm Fishing</p>
                    <p className="text-[10px] text-[#433422]/40 mt-0.5">Breathe, wait, and be still</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#433422" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#433422]/20 flex-shrink-0">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </section>

          </main>
        </div>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={false} onClick={() => { setActiveTab('user'); setView('account'); }} />
            <NavIcon icon={<Calendar />} active={false} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
            <button
              onClick={() => { setActiveTab('home'); setView('dashboard'); }}
              className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <NavIcon icon={<Wheat />} active={false} onClick={() => { setActiveTab('wheat'); setView('resources'); }} />
            <NavIcon icon={<Compass />} active={true} onClick={() => {}} />
          </div>
        </nav>

      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────
  return (
    <div className="bg-[#FDF9F3] text-[#433422] font-sans">
      <div className="animate-view-enter">

      <header className="relative h-[35vh]">
        <div className="absolute inset-0 bg-[#E9DCC9] overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60 pointer-events-none" />
        </div>

        <div className="relative z-10 px-8 pt-12">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/60 bg-white/80 flex-shrink-0">
              <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
            </div>

            <div className="text-right">
              <p className="text-[10px] tracking-[0.2em] font-bold text-[#433422]/40 uppercase">{userName}'s</p>
              <p className="text-base font-serif text-[#433422]/70">Sanctuary</p>
            </div>
          </div>

          <h1 className="text-4xl font-serif mb-2">{timeGreeting} Reflection</h1>
          <p className="text-sm text-[#433422]/60 font-medium">Rest in His presence today.</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-30">
          <svg viewBox="0 0 400 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16">
            <path d="M0,80 L0,60 L40,35 L65,50 L105,15 L140,45 L170,8 L205,50 L240,22 L270,52 L305,35 L335,55 L370,45 L400,60 L400,80 Z" fill="#FDF9F3" />
          </svg>
        </div>
      </header>

      <main className="px-8 pt-10 relative z-20 space-y-8 pb-32">

        {/* Verse + Streak row */}
        <section className="flex gap-3 items-stretch">
          {/* Verse Card */}
          <div className="flex-[3] bg-[#433422] text-[#FDF9F3] p-7 rounded-[32px] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full" />
            <div>
              <p className="text-[10px] tracking-[0.3em] font-bold opacity-50 mb-4">DAILY BREAD</p>
              <h3 className="text-lg font-serif italic leading-relaxed mb-4">
                "{dailyVerse.text}"
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium opacity-60">{dailyVerse.ref}</span>
              <button
                onClick={handleAmen}
                className="flex items-center gap-1.5 text-xs font-medium text-[#D4A373]/80"
              >
                Amen <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Streak Card */}
          <button
            onClick={() => setShowFlameModal(true)}
            className="flex-[2] bg-[#F4EFE6] rounded-[32px] flex flex-col items-center justify-center gap-2 py-6"
          >
            <div className="w-11 h-11 rounded-full bg-[#D4A373]/20 flex items-center justify-center">
              <Flame size={20} className="text-[#D4A373]" />
            </div>
            <span className="text-3xl font-serif text-[#433422]">{streak}</span>
            <span className="text-[9px] font-bold tracking-widest text-[#433422]/40 uppercase">Day Streak</span>
          </button>
        </section>

        {/* Your Journey */}
        {(() => {
          // Build ordered module list: oldest archived first, then active
          const archivedModules = archivedItems
            .map(item => { const card = allCards.find(c => c.id === item.cardId); return card ? { card, item } : null; })
            .filter(Boolean)
            .reverse(); // completedAt desc → reverse to oldest-first for display
          const hasActive = !!activeModule && !!activeModuleCard;
          const allModules = [
            ...archivedModules,
            ...(hasActive ? [{ card: activeModuleCard, item: activeModule }] : []),
          ];

          // Determine which module is being viewed
          const viewingEntry = viewingModuleId
            ? allModules.find(m => m.item.id === viewingModuleId)
            : allModules[allModules.length - 1] ?? null;
          const isViewingActive = !viewingModuleId || (hasActive && viewingModuleId === activeModule.id);
          const vCard = viewingEntry?.card ?? null;
          const vItem = viewingEntry?.item ?? null;

          const tracks = vCard?.tracks ?? [];
          const trackIndex = vItem?.trackIndex ?? 0;
          const isArchived = !!vItem?.archived;
          const allComplete = isArchived || !!vItem?.completed;
          const doneToday = !allComplete && vItem?.completedToday === todayISO;
          const completedTrackCount = allComplete ? tracks.length : trackIndex;
          const totalSteps = tracks.length;
          const completedSteps = completedTrackCount;

          const STEP_H = 190;
          const trackSteps = tracks.map((track, i) => {
            const isDone = allComplete || i < trackIndex;
            const isCurrent = isViewingActive && !allComplete && !doneToday && i === trackIndex;
            const isLocked = !isDone && !isCurrent;
            return { type: 'track', track, i, isDone, isCurrent, isLocked };
          });
          const allSteps = [...trackSteps];
          const totalHeight = allSteps.length * STEP_H + 20;
          const vbH = allSteps.length * 220;

          const buildPathD = (n) => {
            if (n <= 0) return 'M 50 0 L 50 220';
            let d = `M 50 0 Q 35 110 50 220`;
            for (let i = 1; i < n; i++) d += ` T 50 ${(i + 1) * 220}`;
            return d;
          };
          const svgPathD = buildPathD(allSteps.length);
          const approxPathLen = vbH * 1.15;

          return (
            <section>
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif">Your Journey</h3>
              </div>

              {/* Module selector — always visible */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-0.5">
                {allModules.length === 0 ? (
                  <button
                    onClick={() => { setActiveTab('wheat'); setView('resources'); }}
                    className="flex-1 bg-white rounded-[24px] px-5 py-4 border border-dashed border-[#E9DCC9] flex items-center justify-between"
                  >
                    <span className="text-sm text-[#433422]/30">Add a module from the Library to begin</span>
                    <ChevronRight size={16} className="text-[#433422]/20" />
                  </button>
                ) : allModules.map(({ card, item }) => {
                  const isActive = !item.archived;
                  const isSelected = viewingEntry?.item.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setViewingModuleId(isActive ? null : item.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-colors ${
                        isSelected
                          ? 'bg-[#D4A373] text-white'
                          : 'bg-[#E9DCC9] text-[#433422] hover:bg-[#D9C9B5]'
                      }`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
                      {card.title}
                    </button>
                  );
                })}
              </div>

              {/* Module header card */}
              {vCard && (
                <div
                  className="rounded-[20px] p-4 mb-5 relative overflow-hidden"
                  style={{ backgroundColor: vCard.color || '#D4A373' }}
                >
                  {vCard.imageUrl && (
                    <img src={vCard.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                  )}
                  <div className="relative z-10">
                    {/* Liquid-glass text pill */}
                    <div
                      className="inline-block rounded-[14px] px-3 py-2.5"
                      style={{ backgroundColor: 'rgba(253,249,243,0.22)', backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)', boxShadow: 'inset 0 0 0 1px rgba(253,249,243,0.18)' }}
                    >
                      <p className="text-[9px] font-bold tracking-[0.3em] text-white/70 mb-1 uppercase">
                        {vCard.label || 'MODULE'} · {tracks.length} {tracks.length === 1 ? 'TRACK' : 'TRACKS'}
                        {isArchived && ' · COMPLETE'}
                      </p>
                      <h4 className="text-lg font-serif text-white leading-snug" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>{vCard.title}</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress bar for this module's steps */}
              {vCard && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex-1 h-1 bg-[#E9DCC9] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#D4A373] rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: totalSteps > 0 ? completedSteps / totalSteps : 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#433422]/30 tabular-nums">{completedSteps}/{totalSteps}</span>
                </div>
              )}

              {/* Stone path */}
              {vCard && (
                <div className="relative w-full overflow-hidden" style={{ height: totalHeight }}>
                  {/* SVG Meandering Stream */}
                  <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 100 ${vbH}`}
                    preserveAspectRatio="none"
                  >
                    <path d={svgPathD} fill="none" stroke="#D4A373" strokeWidth="8" strokeOpacity="0.08" strokeLinecap="round" />
                    <path
                      d={svgPathD}
                      fill="none"
                      stroke="#D4A373"
                      strokeWidth="10"
                      strokeDasharray={approxPathLen}
                      strokeDashoffset={approxPathLen - approxPathLen * (completedSteps / totalSteps)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out', opacity: 0.4 }}
                    />
                  </svg>

                  {/* Steps */}
                  <motion.div
                    className="relative flex flex-col"
                    variants={pathContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {allSteps.map((step, index) => {
                      const side = index % 2 === 0 ? 'left' : 'right';



                      // ── Track stone ──
                      const { track, i, isDone, isCurrent, isLocked } = step;
                      return (
                        <motion.div
                          key={i}
                          variants={pathItemVariants}
                          className="relative w-full flex items-center justify-center"
                          style={{ height: STEP_H }}
                        >
                          <div className={`relative flex flex-col items-center ${side === 'left' ? '-translate-x-14' : 'translate-x-14'} transition-opacity duration-500 ${isDone ? 'opacity-55' : 'opacity-100'}`}>
                            {/* Glow ring for current stone */}
                            {isCurrent && (
                              <div className="absolute w-16 h-16 rounded-full animate-pulse pointer-events-none" style={{ boxShadow: '0 0 0 6px rgba(212,163,115,0.2), 0 0 0 14px rgba(212,163,115,0.07)' }} />
                            )}
                            <motion.button
                              onClick={() => {
                                if (isLocked) return;
                                const isArticle = vCard.type === 'article';
                                if (isArticle) {
                                  setActiveReadingSession({ card: vCard, reading: track, trackIndex: i, totalReadings: tracks.length, pathItemId: isCurrent ? vItem.id : null });
                                } else {
                                  setActiveSession({
                                    title: track.title,
                                    audioUrl: track.audioUrl,
                                    cardId: vCard.id,
                                    cardTitle: vCard.title,
                                    ...(isCurrent ? { pathItemId: vItem.id, isPlaylistTrack: true, trackIndex: i, totalTracks: tracks.length } : { skipCheckin: true }),
                                  });
                                  setView('meditation');
                                }
                              }}
                              animate={{
                                backgroundColor: isDone ? '#D4A373' : isCurrent ? '#FDF9F3' : '#F4EFE6',
                              }}
                              transition={{ duration: 0.4 }}
                              whileTap={!isLocked ? { scale: 0.88 } : undefined}
                              className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-md border flex-shrink-0 ${
                                isDone
                                  ? 'border-[#D4A373] text-white cursor-pointer active:opacity-80'
                                  : isCurrent
                                  ? 'border-[#D4A373] text-[#D4A373] cursor-pointer'
                                  : 'border-[#E9DCC9] text-[#433422]/20 cursor-default'
                              }`}
                            >
                              {isDone
                                ? <span className="text-white text-lg leading-none">✓</span>
                                : isCurrent
                                ? <Play size={18} fill="currentColor" className="ml-0.5" />
                                : <Lock size={14} strokeWidth={1.5} />}
                            </motion.button>

                            {/* Label */}
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-16 text-left' : 'right-16 text-right'}`}
                              style={{ maxWidth: 130 }}
                            >
                              <p className={`text-[9px] font-bold uppercase tracking-[0.3em] mb-0.5 ${
                                isDone ? 'text-[#8E9775]' : isCurrent ? 'text-[#D4A373]' : 'text-[#433422]/20'
                              }`}>
                                {isDone ? 'DONE' : isCurrent ? 'TODAY' : `DAY ${i + 1}`}
                              </p>
                              <h3 className={`text-sm font-serif leading-snug ${
                                isDone ? 'text-[#433422]/40' : isLocked ? 'text-[#433422]/20' : 'text-[#433422]'
                              }`}>
                                {isLocked ? '• • •' : track.title}
                              </h3>
                              {isDone && doneToday && i === trackIndex - 1 && (
                                <span className="text-[9px] font-bold text-[#8E9775] bg-[#F0F4EC] px-2 py-0.5 rounded-full inline-block mt-1">Today</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {/* CTA to begin next module — only shown when there's history but no active module */}
              {!hasActive && allModules.length > 0 && (
                <div
                  className="flex items-center gap-4 cursor-pointer mt-2"
                  onClick={() => { setActiveTab('wheat'); setView('resources'); }}
                >
                  <div className="flex-1 bg-white rounded-[24px] px-5 py-4 border border-dashed border-[#E9DCC9] flex items-center justify-between">
                    <span className="text-sm text-[#433422]/30">Begin your next module</span>
                    <ChevronRight size={16} className="text-[#433422]/20" />
                  </div>
                </div>
              )}
            </section>
          );
        })()}

      </main>
      </div>

      {/* Floating Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
        <div className="flex items-center justify-between">
          <NavIcon icon={<User />} active={activeTab === 'user'} onClick={() => { setActiveTab('user'); setView('account'); }} />
          <NavIcon icon={<Calendar />} active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
          <button
            onClick={() => { setActiveTab('home'); setView('dashboard'); }}
            className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
          >
            <Home size={20} strokeWidth={2} />
          </button>
          <NavIcon icon={<Wheat />} active={activeTab === 'wheat'} onClick={() => { setActiveTab('wheat'); setView('resources'); }} />
          <NavIcon icon={<Compass />} active={activeTab === 'compass'} onClick={() => { setActiveTab('compass'); setView('explore'); }} />
        </div>
      </nav>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#FDF9F3] rounded-t-[40px] px-6 pt-7 pb-12">
            <div className="w-10 h-1 bg-[#433422]/15 rounded-full mx-auto mb-6" />
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40 text-center mb-5">SHARE VERSE</p>

            <div className="w-[70%] mx-auto aspect-square rounded-[24px] overflow-hidden mb-6 shadow-lg shadow-[#433422]/15">
              <img src={shareImageUrl} alt="Verse card" className="w-full h-full object-cover" />
            </div>

            <div className="w-[70%] mx-auto space-y-3">
              <button
                onClick={handleShare}
                className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[20px] font-serif text-base flex items-center justify-center gap-2.5"
              >
                <Share2 size={18} /> Share
              </button>
              <button
                onClick={() => { setShowShareModal(false); setView('dashboard'); setActiveTab('home'); }}
                className="w-full py-4 text-[#433422]/40 text-sm font-medium tracking-wide"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Flame modal */}
      {showFlameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowFlameModal(false)}
        >
          <div
            className="bg-[#FDF9F3] rounded-[40px] p-10 w-full max-w-sm relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFlameModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#E9DCC9] flex items-center justify-center text-[#433422]/50 text-lg leading-none"
            >
              ×
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4A373]/15 flex items-center justify-center mb-6">
                <Flame size={30} className="text-[#D4A373]" />
              </div>
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#D4A373] mb-3">DAILY FLAME</p>
              <h3 className="text-3xl font-serif mb-4">Keep the flame alive.</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Your Daily Flame reflects your commitment to stillness. Return to Prayvail and reflect each day to keep it burning. Miss a day and it resets, but the flame is always ready to be rekindled.
              </p>
              <div className="flex items-center gap-3 bg-[#F4EFE6] px-6 py-4 rounded-[24px]">
                <Flame size={18} className="text-[#D4A373]" />
                <span className="font-serif text-[#433422]">{streak} day streak</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderSharedModals()}

    </div>
  );
};

// ResourceCard is imported from src/components/ResourceCard.jsx
const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 transition-all duration-300 ${active ? 'text-[#D4A373]' : 'text-gray-300 hover:text-gray-500'}`}
  >
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 1.5 })}
  </button>
);

export default PrevailHome;
