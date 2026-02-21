import React, { useState, useRef, useEffect } from 'react';
import meditationTrack from '../assets/Day One - With Archer.mp3';
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
  Wind,
  ArrowRight,
  ArrowLeft,
  PenLine,
  Trash2,
  Plus,
} from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.png';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FEELING_OPTIONS = ['Peaceful', 'Grateful', 'Anxious', 'Hopeful', 'Tired', 'Joyful', 'Unsettled', 'Calm'];

const PrevailHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState('dashboard');
  const [showFlameModal, setShowFlameModal] = useState(false);

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
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12">
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
      <div className="flex flex-col h-screen bg-[#EDE8DF] text-[#433422] font-sans">

        {/* Top nav */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <button
            onClick={() => setView('dashboard')}
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
            onClick={() => { setMeditatedToday(true); setView('post-checkin'); }}
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
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12">
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
      <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans px-8 py-12">
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

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
          <div className="flex items-center justify-between">
            <NavIcon icon={<User />} active={false} onClick={() => {}} />
            <NavIcon icon={<Calendar />} active={true} onClick={() => {}} />
            <button
              onClick={() => { setActiveTab('home'); setView('dashboard'); }}
              className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
            >
              <Home size={20} strokeWidth={2} />
            </button>
            <NavIcon icon={<Wheat />} active={false} onClick={() => {}} />
            <NavIcon icon={<Compass />} active={false} onClick={() => {}} />
          </div>
        </nav>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────
  return (
    <div className="bg-[#FDF9F3] text-[#433422] font-sans">

      <header className="relative h-[35vh]">
        <div className="absolute inset-0 bg-[#E9DCC9] overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FFF3E0] rounded-full blur-3xl opacity-60 pointer-events-none" />
        </div>

        <div className="relative z-10 px-8 pt-12">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/60 bg-white/80 flex-shrink-0">
              <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
            </div>

            <div className="flex items-end gap-2">
              {days.map((d, i) => {
                const isToday = i === days.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isToday ? 'bg-[#D4A373] text-white' : 'bg-white/40 text-[#433422]/60'
                    }`}>
                      {d.getDate()}
                    </div>
                    <span className="text-[8px] font-bold text-[#433422]/40">
                      {DAY_LABELS[d.getDay()]}
                    </span>
                  </div>
                );
              })}

              <div className="w-px h-8 bg-[#433422]/20 mx-1 self-center" />

              <button onClick={() => setShowFlameModal(true)} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-[#D4A373]/20 flex items-center justify-center">
                  <Flame size={13} className="text-[#D4A373]" />
                </div>
                <span className="text-[8px] font-bold text-[#433422]/40">{streak}</span>
              </button>
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

        {/* Verse Card */}
        <section>
          <div className="bg-[#433422] text-[#FDF9F3] p-10 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full" />
            <p className="text-[10px] tracking-[0.3em] font-bold opacity-50 mb-6">WISDOM</p>
            <h3 className="text-2xl font-serif italic leading-relaxed mb-6">
              "He leads me beside quiet waters, he refreshes my soul."
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium opacity-70">Psalm 23:2-3</span>
              <button
                onClick={() => setView('pre-checkin')}
                className="flex items-center gap-2 text-sm font-medium text-[#D4A373]/80 hover:text-[#D4A373] transition-colors"
              >
                Amen <ArrowRight size={16} />
              </button>
            </div>
          </div>
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
                      <Wind size={18} className="text-[#D4A373]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#8E9775] block">STILLNESS</span>
                      <h4 className="text-sm font-serif">Deep Breath Prayer</h4>
                      <p className="text-[10px] text-gray-400">8 mins</p>
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

      {/* Floating Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[32px] py-4 px-8 border border-[#E9DCC9] shadow-2xl z-50">
        <div className="flex items-center justify-between">
          <NavIcon icon={<User />} active={activeTab === 'user'} onClick={() => setActiveTab('user')} />
          <NavIcon icon={<Calendar />} active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setView('calendar-log'); }} />
          <button
            onClick={() => { setActiveTab('home'); setView('dashboard'); }}
            className="w-14 h-14 bg-[#D4A373] rounded-full -mt-10 border-[6px] border-[#FDF9F3] flex items-center justify-center text-white shadow-lg"
          >
            <Home size={20} strokeWidth={2} />
          </button>
          <NavIcon icon={<Wheat />} active={activeTab === 'wheat'} onClick={() => setActiveTab('wheat')} />
          <NavIcon icon={<Compass />} active={activeTab === 'compass'} onClick={() => setActiveTab('compass')} />
        </div>
      </nav>

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

const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 transition-all duration-300 ${active ? 'text-[#D4A373]' : 'text-gray-300 hover:text-gray-500'}`}
  >
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 1.5 })}
  </button>
);

export default PrevailHome;
