import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, X, ChevronRight } from 'lucide-react';
import { useLibraryCards } from '../hooks/useContent';
import { addJournalEntry } from '../services/journal';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const BG = 'linear-gradient(180deg, #1a2418 0%, #0f1a0e 100%)';
const SAGE = '#8E9775';
const CREAM = '#E8D5B7';
const TEXT = '#FDF9F3';

export default function LifeBoxView({ onBack, user }) {
  const { cards, loading } = useLibraryCards('lifebox');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null); // { track, card }
  const [activeArticle, setActiveArticle] = useState(null); // { card }
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTime, setTrackTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const filteredCards = selectedCategory === 'all'
    ? cards
    : selectedCategory === 'audio'
      ? cards.filter(c => c.type !== 'article')
      : cards.filter(c => c.type === 'article');

  // Set up audio when track changes
  useEffect(() => {
    if (!activeTrack?.track?.audioUrl) return;
    const audio = new Audio(activeTrack.track.audioUrl);
    audioRef.current = audio;
    setTrackTime(0);
    setTrackDuration(0);
    setIsPlaying(false);

    audio.addEventListener('loadedmetadata', () => setTrackDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setTrackTime(audio.currentTime));
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [activeTrack?.track?.audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const skip = (secs) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + secs, trackDuration));
  };

  const seekTo = (clientX) => {
    if (!trackDuration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (audioRef.current) audioRef.current.currentTime = ratio * trackDuration;
  };

  const progress = trackDuration ? (trackTime / trackDuration) * 100 : 0;

  const saveToJournal = useCallback(async (title, cardTitle) => {
    setSaving(true);
    const today = new Date();
    const dateISO = today.toISOString().split('T')[0];
    const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const reflection = `📖 Life Box\n\n${title}\n${cardTitle}`;
    try {
      await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection });
    } catch (_) {}
    setSaving(false);
  }, [user]);

  const saveArticleToJournal = useCallback(async (cardTitle) => {
    setSaving(true);
    const today = new Date();
    const dateISO = today.toISOString().split('T')[0];
    const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const reflection = `📖 Life Box\n\nRead: ${cardTitle}`;
    try {
      await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection });
    } catch (_) {}
    setSaving(false);
  }, [user]);

  const onCompleteSession = async () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    await saveToJournal(activeTrack.track.title || activeTrack.card.title, activeTrack.card.title);
    setSessionDone(true);
  };

  const onMarkRead = async () => {
    await saveArticleToJournal(activeArticle.card.title);
    setActiveArticle(null);
    setSelectedCard(null);
  };

  const returnFromDone = () => {
    setSessionDone(false);
    setActiveTrack(null);
    setSelectedCard(null);
  };

  // ── Done screen ──────────────────────────────────────────
  if (sessionDone) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center font-sans" style={{ background: BG }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(142,151,117,0.12)', border: '1px solid rgba(142,151,117,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            <path d="M15 5l4 4"/>
          </svg>
        </div>
        <p className="text-[9px] font-bold tracking-[0.4em] mb-3" style={{ color: 'rgba(142,151,117,0.5)' }}>LIFE BOX</p>
        <h2 className="text-3xl font-serif text-center leading-snug mb-3" style={{ color: TEXT }}>
          Be still.
        </h2>
        <p className="text-sm text-center leading-relaxed mb-12 max-w-[260px]"
          style={{ color: 'rgba(232,213,183,0.45)' }}>
          "Be still, and know that I am God." — Psalm 46:10
        </p>
        <button onClick={returnFromDone}
          className="w-full max-w-[320px] py-5 rounded-[28px] font-bold text-[11px] tracking-widest"
          style={{ backgroundColor: 'rgba(142,151,117,0.15)', color: CREAM, border: `1px solid rgba(142,151,117,0.2)` }}>
          RETURN
        </button>
      </div>
    );
  }

  // ── Audio Player ─────────────────────────────────────────
  if (activeTrack) {
    return (
      <div className="fixed inset-0 flex flex-col font-sans" style={{ background: BG }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-14 pb-4">
          <button
            onClick={() => { audioRef.current?.pause(); setIsPlaying(false); setActiveTrack(null); }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(142,151,117,0.12)' }}>
            <ChevronRight className="rotate-180" size={18} color={CREAM} />
          </button>
          <span className="text-[10px] tracking-[0.3em] font-bold" style={{ color: 'rgba(142,151,117,0.5)' }}>LIFE BOX</span>
          <div className="w-10" />
        </div>

        {/* Campfire — center */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            {/* Ambient glow */}
            <div className="absolute rounded-full pointer-events-none" style={{
              bottom: 10, width: 180, height: 120,
              background: 'radial-gradient(circle, #6B8C5F 0%, transparent 70%)',
              filter: 'blur(10px)',
              opacity: isPlaying ? 0.15 : 0,
              transition: 'opacity 2s ease',
            }} />
            <svg viewBox="0 0 100 120" style={{ width: 100, height: 126, filter: 'drop-shadow(0 0 10px rgba(142,151,117,0.25))', position: 'relative', zIndex: 1 }}>
              <g fill="#1a2418" opacity="1">
                <rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(-10 50 108.5)" />
                <rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(15 50 108.5)" />
                <circle cx="50" cy="108.5" r="5" />
              </g>
              <path fill="#6B8C5F" d="M50,110 C32,110 28,92 50,48 C72,92 68,110 50,110 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 3.5s ease-in-out infinite' : 'none',
              }} />
              <path fill="#8E9775" d="M50,108 C40,108 34,98 50,65 C66,98 60,108 50,108 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 2.6s ease-in-out infinite' : 'none',
              }} />
              <path fill="#A8C898" d="M50,106 C44,106 40,102 50,80 C60,102 56,106 50,106 Z" style={{
                transformOrigin: 'bottom center', filter: 'blur(0.5px)',
                opacity: isPlaying ? 1 : 0, transition: 'opacity 1.5s ease',
                animation: isPlaying ? 'flame-flicker 1.8s ease-in-out infinite' : 'none',
              }} />
            </svg>
          </div>

          {/* Track title */}
          <div className="text-center px-8 mt-4">
            <p className="text-[10px] tracking-[0.3em] font-bold mb-1" style={{ color: 'rgba(142,151,117,0.5)' }}>
              {activeTrack.card.title}
            </p>
            <h2 className="text-2xl font-serif leading-snug" style={{ color: TEXT }}>
              {activeTrack.track.title || activeTrack.card.title}
            </h2>
            <div className="mt-3 mx-auto w-8 h-px" style={{ backgroundColor: 'rgba(142,151,117,0.3)' }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 px-6 pb-12 space-y-5">
          {/* Progress bar */}
          <div>
            <div
              ref={progressRef}
              className="relative w-full h-7 flex items-center cursor-pointer"
              onClick={e => seekTo(e.clientX)}
              onTouchStart={e => seekTo(e.touches[0].clientX)}
              onTouchMove={e => { e.preventDefault(); seekTo(e.touches[0].clientX); }}
            >
              <div className="absolute w-full h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(142,151,117,0.2)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: SAGE }} />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                style={{ left: `${progress}%`, backgroundColor: CREAM, boxShadow: `0 0 8px rgba(232,213,183,0.4)` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono -mt-1" style={{ color: 'rgba(142,151,117,0.45)' }}>
              <span>{formatTime(trackTime)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
          </div>

          {/* Playback buttons */}
          <div className="flex items-center justify-between px-4">
            <button onClick={() => skip(-15)}
              className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform"
              style={{ color: 'rgba(142,151,117,0.45)' }}>
              <SkipBack size={22} />
              <span className="text-[9px] font-bold tracking-wide">15s</span>
            </button>
            <button onClick={togglePlay}
              className="rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                width: 72, height: 72,
                backgroundColor: 'rgba(142,151,117,0.15)',
                border: `1px solid rgba(142,151,117,0.3)`,
                boxShadow: '0 0 30px rgba(142,151,117,0.15)',
                color: CREAM,
              }}>
              {isPlaying
                ? <Pause fill="currentColor" size={26} />
                : <Play fill="currentColor" size={26} className="ml-1" />}
            </button>
            <button onClick={() => skip(15)}
              className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform"
              style={{ color: 'rgba(142,151,117,0.45)' }}>
              <SkipForward size={22} />
              <span className="text-[9px] font-bold tracking-wide">15s</span>
            </button>
          </div>

          {/* Complete */}
          <button onClick={onCompleteSession} disabled={saving}
            className="w-full py-4 rounded-[20px] font-serif text-base disabled:opacity-50"
            style={{ backgroundColor: 'rgba(142,151,117,0.08)', border: `1px solid rgba(142,151,117,0.15)`, color: 'rgba(232,213,183,0.5)' }}>
            {saving ? 'Saving…' : 'Complete Session'}
          </button>
        </div>
      </div>
    );
  }

  // ── Article Reader ───────────────────────────────────────
  if (activeArticle) {
    const content = activeArticle.card.content || activeArticle.card.description || '';
    return (
      <div className="fixed inset-0 flex flex-col font-sans">
        {/* Forest green header */}
        <div className="flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: '#1a2418', minHeight: 160 }}>
          {activeArticle.card.imageUrl && (
            <img src={activeArticle.card.imageUrl} alt={activeArticle.card.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,36,24,0.5) 0%, #1a2418 100%)' }} />
          <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-6">
            <button onClick={() => setActiveArticle(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(142,151,117,0.2)' }}>
              <ArrowLeft size={18} color={CREAM} strokeWidth={1.5} />
            </button>
            <span className="text-[10px] tracking-[0.3em] font-bold" style={{ color: 'rgba(142,151,117,0.5)' }}>LIFE BOX</span>
            <div className="w-10" />
          </div>
          <div className="relative z-10 px-6 pb-6">
            {activeArticle.card.label && (
              <p className="text-[9px] font-bold tracking-widest mb-1" style={{ color: `rgba(142,151,117,0.7)` }}>
                {activeArticle.card.label}
              </p>
            )}
            <h1 className="text-2xl font-serif leading-tight" style={{ color: TEXT }}>{activeArticle.card.title}</h1>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ backgroundColor: '#FDF9F3' }}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#433422' }}>
            {content || 'Content coming soon.'}
          </p>
        </div>

        <div className="flex-shrink-0 px-6 pb-12 pt-4" style={{ backgroundColor: '#FDF9F3' }}>
          <button onClick={onMarkRead} disabled={saving}
            className="w-full py-5 rounded-[28px] font-bold text-[11px] tracking-widest disabled:opacity-50"
            style={{ backgroundColor: '#1a2418', color: CREAM }}>
            {saving ? 'SAVING…' : 'MARK AS READ'}
          </button>
        </div>
      </div>
    );
  }

  const isSingleTrack = selectedCard && (selectedCard.tracks || []).length <= 1;
  const firstTrack = selectedCard?.tracks?.[0];

  // ── Library view ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col font-sans" style={{ background: BG }}>

      {/* Header */}
      <div className="relative flex-shrink-0 px-6 pt-14 pb-10 overflow-hidden" style={{ backgroundColor: '#1a2418' }}>
        <div className="absolute top-[-30%] right-[-15%] w-64 h-64 rounded-full opacity-15"
          style={{ backgroundColor: '#8FAF80', filter: 'blur(40px)' }} />

        <button onClick={onBack}
          className="flex items-center gap-2 mb-6 relative z-10 px-4 py-2 rounded-full active:scale-[0.97] transition-transform"
          style={{ backgroundColor: 'rgba(74,94,66,0.35)', color: 'rgba(168,200,152,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(142,175,128,0.25)' }}>
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span className="text-sm font-medium">Explore</span>
        </button>
        <div className="relative z-10">
          <p className="text-[9px] font-bold tracking-[0.4em] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>LIFE BOX</p>
          <h1 className="text-3xl font-serif leading-tight" style={{ color: TEXT }}>
            Life's chapters,<br /><em className="italic" style={{ color: '#A8C898' }}>guided by faith.</em>
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 400 30" preserveAspectRatio="none" className="w-full h-7">
            <path d="M0,30 L0,18 C100,4 200,26 300,12 C350,4 380,22 400,16 L400,30 Z" fill="#1a2418" />
          </svg>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex-shrink-0 px-4 py-3 flex gap-2" style={{ borderBottom: '1px solid rgba(142,151,117,0.1)' }}>
        {[{ v: 'all', label: 'All' }, { v: 'audio', label: 'Audio' }, { v: 'article', label: 'Read' }].map(({ v, label }) => (
          <button key={v} onClick={() => setSelectedCategory(v)}
            className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all flex-shrink-0"
            style={{
              backgroundColor: selectedCategory === v ? SAGE : 'rgba(142,151,117,0.1)',
              color: selectedCategory === v ? TEXT : 'rgba(142,151,117,0.7)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-[20px] animate-pulse"
              style={{ backgroundColor: 'rgba(142,151,117,0.08)' }} />
          ))
        ) : filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p className="text-sm font-serif" style={{ color: 'rgba(142,151,117,0.4)' }}>
              Content coming soon.
            </p>
          </div>
        ) : (
          filteredCards.map(card => (
            <button key={card.id} onClick={() => setSelectedCard(card)}
              className="w-full text-left flex gap-4 rounded-[20px] p-4 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: 'rgba(142,151,117,0.08)', border: '1px solid rgba(142,151,117,0.12)' }}>
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.title}
                  className="w-16 h-16 rounded-[14px] object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: card.color || 'rgba(142,151,117,0.15)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-serif text-base leading-snug" style={{ color: TEXT }}>{card.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {card.label && (
                    <span className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(142,151,117,0.15)', color: 'rgba(142,151,117,0.8)' }}>
                      {card.label}
                    </span>
                  )}
                  <span className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: card.type === 'article' ? 'rgba(212,163,115,0.12)' : 'rgba(142,151,117,0.12)', color: card.type === 'article' ? '#D4A373' : SAGE }}>
                    {card.type === 'article' ? 'READ' : 'AUDIO'}
                  </span>
                  {card.duration && (
                    <span className="text-[9px]" style={{ color: 'rgba(232,213,183,0.4)' }}>{card.duration}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} color="rgba(142,151,117,0.35)" strokeWidth={1.5} className="flex-shrink-0 self-center" />
            </button>
          ))
        )}
      </div>

      {/* Card detail bottom sheet */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div key="sheet" className="fixed inset-0 z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCard(null)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-[32px] overflow-hidden"
              style={{ backgroundColor: '#FDF9F3' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mt-4 mb-1"
                style={{ backgroundColor: 'rgba(67,52,34,0.1)' }} />

              {/* Cover */}
              {selectedCard.imageUrl && (
                <div className="relative h-44 mx-4 mt-3 rounded-[20px] overflow-hidden">
                  <img src={selectedCard.imageUrl} alt={selectedCard.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,36,24,0.6) 0%, transparent 60%)' }} />
                </div>
              )}

              <div className="px-6 pt-4 flex items-start justify-between">
                <div>
                  {selectedCard.label && (
                    <p className="text-[9px] font-bold tracking-widest mb-1" style={{ color: 'rgba(142,151,117,0.7)' }}>
                      {selectedCard.label}
                    </p>
                  )}
                  <p className="text-xl font-serif" style={{ color: '#433422' }}>{selectedCard.title}</p>
                  {selectedCard.duration && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(67,52,34,0.4)' }}>{selectedCard.duration}</p>
                  )}
                </div>
                <button onClick={() => setSelectedCard(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: '#F4EFE6' }}>
                  <X size={14} color="#433422" strokeWidth={1.5} />
                </button>
              </div>

              {selectedCard.description && (
                <p className="px-6 mt-3 text-sm leading-relaxed" style={{ color: 'rgba(67,52,34,0.5)' }}>
                  {selectedCard.description}
                </p>
              )}

              <div className="px-6 pb-12 mt-5">
                {selectedCard.type === 'article' ? (
                  <button
                    onClick={() => setActiveArticle({ card: selectedCard })}
                    className="w-full py-5 rounded-[28px] font-bold text-[11px] tracking-widest"
                    style={{ backgroundColor: '#1a2418', color: CREAM }}>
                    BEGIN READING
                  </button>
                ) : isSingleTrack ? (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => setActiveTrack({ track: firstTrack || { title: selectedCard.title, audioUrl: selectedCard.audioUrl }, card: selectedCard })}
                      className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                      style={{
                        backgroundColor: 'rgba(142,151,117,0.12)',
                        border: `1px solid rgba(142,151,117,0.3)`,
                        boxShadow: '0 0 30px rgba(142,151,117,0.1)',
                        color: '#1a2418',
                      }}>
                      <Play fill="currentColor" size={28} className="ml-1" />
                    </button>
                    {firstTrack?.duration && (
                      <p className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(67,52,34,0.4)' }}>
                        {firstTrack.duration}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedCard.tracks || []).map((track, i) => (
                      <button key={i}
                        onClick={() => setActiveTrack({ track, card: selectedCard })}
                        className="w-full flex items-center gap-3 rounded-[16px] px-4 py-3 text-left active:scale-[0.99] transition-transform"
                        style={{ backgroundColor: '#F4EFE6', border: '1px solid #E9DCC9' }}>
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(142,151,117,0.15)' }}>
                          <Play size={12} fill={SAGE} color={SAGE} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-serif truncate" style={{ color: '#433422' }}>{track.title}</p>
                          {track.duration && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(67,52,34,0.4)' }}>{track.duration}</p>}
                        </div>
                        <ChevronRight size={14} color="rgba(67,52,34,0.3)" strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
