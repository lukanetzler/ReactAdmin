import React, { useState, useRef, useEffect } from 'react';
import meditationTrack from '../assets/Day One - With Archer.mp3';
import { getDailyVerse } from '../data/getDailyVerse';
import {
  Compass,
  Gamepad2,
  ShoppingBag,
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
} from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.png';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TRACK_TITLE = 'Day One - With Archer';
const FEELING_OPTIONS = ['Peaceful', 'Grateful', 'Anxious', 'Hopeful', 'Tired', 'Joyful', 'Unsettled', 'Calm'];

const PATH_CARD_COLORS = ['#E9DCC9', '#D9C9B5', '#D4A373', '#C4B5A0', '#8E9775', '#B0A898'];
const PATH_SESSIONS = (() => {
  const titles = [
    'With Archer', 'Morning Stillness', 'Surrender', 'In His Presence', 'Letting Go',
    'The Quiet Place', 'Gratitude', 'Breathing With God', 'Finding Peace', 'Trust & Release',
    "The Lord's Prayer", 'Anchored', 'Light in the Dark', 'Midpoint', 'Sacred Pause',
    'Forgiveness', 'Walking by Faith', 'Still Waters', 'Renewed Mind', 'Contentment',
    'Three Weeks Strong', 'The Shepherd', 'Abiding', 'Abundant Life', 'Come to Me',
    'Deep Roots', 'He Is Faithful', 'Peace That Passes', 'Dwelling Place', 'The Way Forward',
  ];
  const durations = [8,10,9,8,11,10,9,8,10,11,12,9,10,8,9,11,10,9,11,8,10,12,9,10,11,8,10,9,12,15];
  return titles.map((title, i) => ({ day: i + 1, title, duration: `${durations[i]} min`, wired: i === 0 }));
})();

const PrevailHome = ({ userName = 'Friend', hasAccount = false, onUpdateName }) => {
  const dailyVerse = getDailyVerse();

  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState('dashboard');
  const [showFlameModal, setShowFlameModal] = useState(false);

  // Account state
  const [nameInput, setNameInput] = useState(userName);
  const [notifDailyVerse, setNotifDailyVerse] = useState(true);
  const [notifReflection, setNotifReflection] = useState(true);
  const [notifNewContent, setNotifNewContent] = useState(false);

  // Core loop state
  const [preFeelingWord, setPreFeelingWord] = useState('');
  const [postFeelingWord, setPostFeelingWord] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);
  const [meditatedToday, setMeditatedToday] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTime, setTrackTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(meditationTrack);
    audioRef.current = audio;
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
  }, []);

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
  const [journaledToday, setJournaledToday] = useState(false);
  const [feelingInput, setFeelingInput] = useState('');

  // Calendar state
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [journalMode, setJournalMode] = useState('new'); // 'new' | 'add' | 'edit'
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);

  const today = new Date();
  const hour = today.getHours();
  const timeGreeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const todayISO = today.toISOString().split('T')[0];
  const dateString = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const streak = (() => {
    const datesWithEntries = new Set(journalEntries.map(e => e.dateISO));
    let count = 0;
    const d = new Date(today);
    if (!datesWithEntries.has(todayISO)) d.setDate(d.getDate() - 1);
    while (true) {
      const iso = d.toISOString().split('T')[0];
      if (!datesWithEntries.has(iso)) break;
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
    .sort((a, b) => a.id - b.id);

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
    setView('journal');
  };

  const openAdd = () => {
    setPreFeelingWord('');
    setPostFeelingWord('');
    setJournalText('');
    setEditingEntryId(null);
    setJournalMode('add');
    setView('journal');
  };

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

  // ── Meditation ─────────────────────────────────────────
  if (view === 'meditation') {
    return (
      <div className="flex flex-col h-screen bg-[#EDE8DF] text-[#433422] font-sans animate-view-enter">

        {/* Top nav */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <button
            onClick={() => { audioRef.current?.pause(); audioRef.current && (audioRef.current.currentTime = 0); setIsPlaying(false); setView('dashboard'); }}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">NOW PLAYING</span>
          <div className="w-10" />
        </div>

        {/* Player card */}
        <div className="mx-6 bg-white rounded-[32px] px-7 pt-7 pb-8 shadow-sm flex flex-col gap-5">

          {/* Track info */}
          <div>
            <h2 className="text-2xl font-serif">Day One - With Archer</h2>
          </div>

          {/* Album art placeholder */}
          <div className="w-full aspect-video rounded-2xl bg-[#F0EBE3]" />

          {/* Progress */}
          <div>
            <div className="relative w-full h-1.5 bg-[#433422]/8 rounded-full mb-2.5">
              <div
                className="absolute top-0 left-0 h-full bg-[#D4A373] rounded-full"
                style={{ width: `${trackDuration ? (trackTime / trackDuration) * 100 : 0}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-[#D4A373] rounded-full shadow-md"
                style={{ left: `${trackDuration ? (trackTime / trackDuration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#433422]/40 font-mono">
              <span>{formatTime(trackTime)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => skip(-15)}
              className="flex flex-col items-center gap-1 p-2 text-[#433422]/40 active:text-[#433422] transition-colors"
            >
              <SkipBack size={22} />
              <span className="text-[9px] font-bold tracking-wide">15s</span>
            </button>
            <button
              onClick={togglePlay}
              className="bg-[#433422] rounded-full flex items-center justify-center text-[#FDF9F3] shadow-xl shadow-[#433422]/20 active:scale-95 transition-transform"
              style={{ width: 72, height: 72 }}
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
        <div className="px-6 mt-auto pb-12 pt-4">
          <button
            onClick={() => { audioRef.current?.pause(); audioRef.current && (audioRef.current.currentTime = 0); setIsPlaying(false); setMeditatedToday(true); setView('post-checkin'); }}
            className="w-full py-4 rounded-[20px] font-serif text-base border border-[#433422]/15 text-[#433422]/50 bg-white/40"
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

          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setPostFeelingWord(feelingInput);
                setFeelingInput('');
                setJournalMode('new');
                setView('journal');
              }}
              disabled={!feelingInput.trim()}
              className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3 disabled:opacity-30 transition-opacity"
            >
              Record a reflection <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { setFeelingInput(''); setView('dashboard'); }}
              className="w-full py-4 text-[#433422]/40 text-sm"
            >
              Skip
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

    const journalTitle = isEditMode ? 'Edit Reflection' : isAddMode ? 'New Reflection' : "Today's Reflection";
    const saveLabel = isEditMode ? 'Save Changes' : 'Save Entry';

    const entryDateISO = isEditMode
      ? (journalEntries.find(e => e.id === editingEntryId)?.dateISO || todayISO)
      : isAddMode
      ? selectedDate.toISOString().split('T')[0]
      : todayISO;

    const entryDateDisplay = isEditMode
      ? (journalEntries.find(e => e.id === editingEntryId)?.dateDisplay || dateString)
      : isAddMode
      ? selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      : dateString;

    const handleBack = () => {
      if (isNewMode) {
        setView('post-checkin');
      } else {
        setJournalMode('new');
        setEditingEntryId(null);
        setView('calendar-log');
      }
    };

    const handleSave = () => {
      if (isEditMode) {
        setJournalEntries(prev => prev.map(e =>
          e.id === editingEntryId
            ? { ...e, feelingBefore: preFeelingWord, feelingAfter: postFeelingWord, reflection: journalText }
            : e
        ));
      } else {
        const newEntry = {
          id: Date.now(),
          dateISO: entryDateISO,
          dateDisplay: entryDateDisplay,
          feelingBefore: preFeelingWord,
          feelingAfter: postFeelingWord,
          reflection: journalText,
        };
        setJournalEntries(prev => [newEntry, ...prev]);
        if (entryDateISO === todayISO) setJournaledToday(true);
      }
      setJournalMode('new');
      setEditingEntryId(null);
      setJournalText('');
      if (isNewMode) {
        setView('dashboard');
      } else {
        setView('calendar-log');
      }
    };

    return (
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12 animate-view-enter">
        <div className="flex items-center justify-between mb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-[#433422]/40">
            <ArrowLeft size={18} />
          </button>
          <div className="text-right">
            <p className="text-xs font-bold tracking-widest text-[#433422]/40 uppercase">{journalTitle}</p>
            <p className="text-sm text-[#433422]/60 mt-0.5">{entryDateDisplay}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 uppercase mb-2">Feeling before</p>
            <input
              type="text"
              value={preFeelingWord}
              onChange={e => setPreFeelingWord(e.target.value)}
              placeholder="a word..."
              className="w-full bg-white rounded-[16px] p-3 border border-[#E9DCC9] text-[#433422] font-serif text-sm focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 uppercase mb-2">Feeling after</p>
            <input
              type="text"
              value={postFeelingWord}
              onChange={e => setPostFeelingWord(e.target.value)}
              placeholder="a word..."
              className="w-full bg-white rounded-[16px] p-3 border border-[#E9DCC9] text-[#433422] font-serif text-sm focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20"
            />
          </div>
        </div>

        <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 uppercase mb-3">Reflected</p>
        <textarea
          value={journalText}
          onChange={e => setJournalText(e.target.value)}
          placeholder="Write what's on your heart..."
          className="flex-1 w-full bg-white rounded-[24px] p-6 border border-[#E9DCC9] text-[#433422] font-sans text-base leading-relaxed resize-none focus:outline-none focus:border-[#D4A373] transition-colors placeholder:text-[#433422]/20 mb-6"
        />

        <button
          onClick={handleSave}
          className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[24px] font-serif text-lg flex items-center justify-center gap-3"
        >
          {saveLabel} <ArrowRight size={18} />
        </button>
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
                        onClick={() => setJournalEntries(prev => prev.filter(e => e.id !== entry.id))}
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
  if (view === 'account') {
    const notifRows = [
      { label: 'Daily Verse', desc: 'Morning verse to start your day', state: notifDailyVerse, set: setNotifDailyVerse },
      { label: 'Reflection Reminder', desc: 'Gentle nudge to journal each evening', state: notifReflection, set: setNotifReflection },
      { label: 'New Sessions', desc: 'When new guided sessions are added', state: notifNewContent, set: setNotifNewContent },
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
                onClick={() => onUpdateName?.(nameInput.trim())}
                className="mt-4 px-6 py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold tracking-wide"
              >
                Save
              </button>
            )}
          </div>

          {/* No-account explanation */}
          {!hasAccount && (
            <div className="bg-[#433422] text-[#FDF9F3] rounded-[28px] p-6">
              <p className="text-[10px] tracking-[0.3em] font-bold opacity-40 mb-3">NO ACCOUNT</p>
              <h3 className="text-xl font-serif mb-3">Save your journey.</h3>
              <p className="text-sm opacity-60 leading-relaxed mb-5">
                A free account syncs your reflections across devices, protects your streak if you lose your phone, and unlocks future features as they arrive.
              </p>
              <button className="w-full py-3.5 bg-[#D4A373] text-white rounded-[20px] font-bold text-sm tracking-[0.15em]">
                Create Account
              </button>
            </div>
          )}

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

          {/* Notifications */}
          <div className="bg-white rounded-[28px] p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <Bell size={14} className="text-[#433422]/40" />
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">NOTIFICATIONS</p>
            </div>
            <div className="space-y-5">
              {notifRows.map(({ label, desc, state, set }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#433422]">{label}</p>
                    <p className="text-xs text-[#433422]/40 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => set(s => !s)}
                    className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${state ? 'bg-[#D4A373]' : 'bg-[#433422]/15'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${state ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sign out — only if has account */}
          {hasAccount && (
            <button className="w-full py-4 text-sm font-bold text-[#433422]/30 tracking-widest">
              SIGN OUT
            </button>
          )}

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
    const gospelSessions = [
      { title: 'The Beatitudes', label: 'GOSPEL', duration: '12 min', color: '#D4C5B2', coming: true },
      { title: 'Walking on Water', label: 'GOSPEL', duration: '10 min', color: '#C4B5A0', coming: true },
      { title: 'The Prodigal Son', label: 'GOSPEL', duration: '14 min', color: '#D9C9B5', coming: true },
      { blank: true },
    ];
    const mindSessions = [
      { title: 'Anxiety & Faith', label: 'PSYCHOEDUCATION', duration: '11 min', color: '#8E9775', coming: true },
      { title: 'Grief and Grace', label: 'PSYCHOEDUCATION', duration: '13 min', color: '#B0A898', coming: true },
      { blank: true },
      { blank: true },
    ];
    const extendedSessions = [
      { title: 'The Desert Fathers', label: 'EXTENDED', duration: '25 min', color: '#D4A373', coming: true },
      { title: 'Night Prayer', label: 'EXTENDED', duration: '20 min', color: '#C4A882', coming: true },
      { blank: true },
      { blank: true },
    ];

    return (
      <div className="bg-[#FDF9F3] text-[#433422] font-sans min-h-screen">
        <div className="animate-view-enter">

        <header className="relative h-[26vh] bg-[#E9DCC9] flex items-end px-8 pb-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/50 mb-1">SANCTUARY</p>
            <h1 className="text-3xl font-serif">Resources</h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <svg viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
              <path d="M0,50 L0,28 C80,8 160,42 240,22 C300,6 360,38 400,26 L400,50 Z" fill="#FDF9F3" />
            </svg>
          </div>
        </header>

        <main className="pt-4 pb-32 space-y-10">

          {/* 30-Day Path */}
          <section>
            <div className="px-8 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">FEATURED</p>
                <h2 className="text-xl font-serif">The 30-Day Path</h2>
              </div>
              <span className="text-[10px] font-bold text-[#433422]/30">1 / 30</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pl-8 pr-6 pb-1">
              {PATH_SESSIONS.map((session) => {
                const color = PATH_CARD_COLORS[(session.day - 1) % PATH_CARD_COLORS.length];
                return (
                  <button
                    key={session.day}
                    onClick={() => session.wired && setView('pre-checkin')}
                    className={`flex-shrink-0 w-[130px] rounded-[22px] overflow-hidden text-left shadow-sm ${session.wired ? 'active:scale-95 transition-transform' : ''}`}
                  >
                    <div className="h-[96px] relative flex flex-col justify-between p-3.5" style={{ backgroundColor: color }}>
                      <span className="text-[8px] font-bold tracking-widest text-[#433422]/50">DAY {session.day}</span>
                      {session.wired ? (
                        <div className="self-end w-6 h-6 rounded-full bg-[#433422] flex items-center justify-center">
                          <Play size={9} fill="currentColor" className="text-[#FDF9F3] ml-0.5" />
                        </div>
                      ) : (
                        <div className="self-end w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">
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

          {/* Gospel Themes */}
          <section className="px-8">
            <div className="mb-4">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">SERIES</p>
              <h2 className="text-xl font-serif">Gospel Themes</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {gospelSessions.map((s, i) => <ResourceCard key={i} {...s} />)}
            </div>
          </section>

          {/* Mind & Faith */}
          <section className="px-8">
            <div className="mb-4">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">WELLBEING</p>
              <h2 className="text-xl font-serif">Mind & Faith</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mindSessions.map((s, i) => <ResourceCard key={i} {...s} />)}
            </div>
          </section>

          {/* Extended Sessions */}
          <section className="px-8">
            <div className="mb-4">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">DEEP DIVE</p>
              <h2 className="text-xl font-serif">Extended Sessions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {extendedSessions.map((s, i) => <ResourceCard key={i} {...s} />)}
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
            <NavIcon icon={<Wheat />} active={true} onClick={() => {}} />
            <NavIcon icon={<Compass />} active={false} onClick={() => { setActiveTab('compass'); setView('explore'); }} />
          </div>
        </nav>

      </div>
    );
  }

  // ── Explore ─────────────────────────────────────────────
  if (view === 'explore') {
    const games = [
      { title: 'Bible Trivia', label: 'KNOWLEDGE', desc: 'Test your scripture knowledge', color: '#D4C5B2' },
      { title: 'Verse Memory', label: 'MEMORY', desc: 'Commit the Word to heart', color: '#C4B5A0' },
      { title: 'Faith Quiz', label: 'DAILY', desc: 'One question, every day', color: '#8E9775' },
      { title: 'Word of Life', label: 'WORD GAME', desc: 'Scripture word puzzles', color: '#D9C9B5' },
    ];
    const storeItems = [
      { title: 'Prayvail Journal', label: 'STATIONERY', duration: '90-day guided journal', color: '#E9DCC9', coming: true },
      { title: 'Supporter Tee', label: 'APPAREL', duration: 'Wear the mission', color: '#D4A373', coming: true },
      { title: 'Support the Mission', label: 'DONATION', duration: 'Help us grow', color: '#B0A898', coming: true },
      { blank: true },
    ];

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

            {/* Minigames */}
            <section className="px-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">COMING SOON</p>
                  <h2 className="text-xl font-serif">Minigames</h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] flex items-center justify-center">
                  <Gamepad2 size={17} className="text-[#D4A373]" />
                </div>
              </div>
              <div className="space-y-3">
                {games.map((game, i) => (
                  <div key={i} className="bg-white rounded-[24px] p-5 border border-[#E9DCC9] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: game.color }}>
                      <Lock size={14} className="text-[#433422]/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold tracking-widest text-[#433422]/35 mb-0.5">{game.label}</p>
                      <p className="text-sm font-serif text-[#433422]">{game.title}</p>
                      <p className="text-[10px] text-[#433422]/40 mt-0.5">{game.desc}</p>
                    </div>
                    <span className="text-[8px] font-bold tracking-widest text-[#433422]/30 bg-[#F4EFE6] px-2.5 py-1.5 rounded-full flex-shrink-0">SOON</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Support Store */}
            <section className="px-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">SUPPORT</p>
                  <h2 className="text-xl font-serif">Store</h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] flex items-center justify-center">
                  <ShoppingBag size={17} className="text-[#D4A373]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {storeItems.map((s, i) => <ResourceCard key={i} {...s} />)}
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

        {/* Your Path Today */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-serif">Your Path Today</h3>
            <span className="text-xs font-bold text-[#433422]/30">
              {(meditatedToday ? 1 : 0) + (journaledToday ? 1 : 0)} / 2
            </span>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-[9px] top-5 bottom-5 border-l-2 border-dashed border-[#E9DCC9]" />

            <div className="space-y-4">
              {/* Step 1: Meditate */}
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                  meditatedToday ? 'bg-[#D4A373] border-[#D4A373]' : 'bg-[#FDF9F3] border-[#D4A373]/40'
                }`}>
                  {meditatedToday && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div
                  onClick={() => setView('pre-checkin')}
                  className="flex-1 bg-white rounded-[24px] px-5 py-4 border border-[#E9DCC9] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F9F4EE] flex items-center justify-center">
                      <Headphones size={18} className="text-[#D4A373]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#8E9775] block">MEDITATION</span>
                      <h4 className="text-sm font-serif">{TRACK_TITLE}</h4>
                      <p className="text-[10px] text-gray-400">{trackDuration ? `${Math.ceil(trackDuration / 60)} mins` : '...'}</p>
                    </div>
                  </div>
                  {meditatedToday ? (
                    <span className="text-[10px] font-bold text-[#8E9775] bg-[#F0F4EC] px-3 py-1 rounded-full">Done</span>
                  ) : (
                    <ChevronRight size={16} className="text-[#433422]/20" />
                  )}
                </div>
              </div>

              {/* Step 2: Reflect */}
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                  journaledToday ? 'bg-[#D4A373] border-[#D4A373]' : 'bg-[#FDF9F3] border-[#D4A373]/40'
                }`}>
                  {journaledToday && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div
                  onClick={() => meditatedToday && setView('journal')}
                  className={`flex-1 bg-white rounded-[24px] px-5 py-4 border border-[#E9DCC9] flex items-center justify-between transition-transform ${
                    meditatedToday ? 'cursor-pointer active:scale-[0.98]' : 'opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F9F4EE] flex items-center justify-center">
                      <PenLine size={18} className="text-[#8E9775]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#8E9775] block">REFLECT</span>
                      <h4 className="text-sm font-serif">Record today's reflection</h4>
                      {journaledToday && journalEntries.find(e => e.dateISO === todayISO) && (
                        <p className="text-[10px] text-[#D4A373]">
                          {journalEntries.find(e => e.dateISO === todayISO).feelingBefore} → {journalEntries.find(e => e.dateISO === todayISO).feelingAfter}
                        </p>
                      )}
                    </div>
                  </div>
                  {journaledToday ? (
                    <span className="text-[10px] font-bold text-[#8E9775] bg-[#F0F4EC] px-3 py-1 rounded-full">Done</span>
                  ) : (
                    <ChevronRight size={16} className="text-[#433422]/20" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

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

    </div>
  );
};

const ResourceCard = ({ title, label, duration, color = '#E9DCC9', blank = false, coming = false }) => {
  if (blank) {
    return (
      <div className="rounded-[20px] border-2 border-dashed border-[#E9DCC9] flex items-center justify-center" style={{ minHeight: 148 }}>
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#E9DCC9] flex items-center justify-center">
          <span className="text-[#433422]/20 text-xl leading-none font-light">+</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-[20px] overflow-hidden bg-white border border-[#E9DCC9]/80">
      <div className="h-[88px] relative p-3.5" style={{ backgroundColor: color }}>
        {coming && (
          <div className="absolute bottom-3 left-3.5">
            <span className="text-[8px] font-bold tracking-widest text-[#433422]/60 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full">SOON</span>
          </div>
        )}
      </div>
      <div className="px-3.5 py-3">
        {label && <p className="text-[8px] font-bold tracking-widest text-[#433422]/35 mb-1">{label}</p>}
        <p className="text-[11px] font-serif text-[#433422] leading-snug">{title}</p>
        <p className="text-[9px] text-[#433422]/40 mt-0.5 font-bold">{duration}</p>
      </div>
    </div>
  );
};

const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 transition-all duration-300 ${active ? 'text-[#D4A373]' : 'text-gray-300 hover:text-gray-500'}`}
  >
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 1.5 })}
  </button>
);

export default PrevailHome;
