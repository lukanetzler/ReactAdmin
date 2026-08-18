import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

// Four sides of the breath. The orb carries the instruction: it swells on the way in,
// stays full through the hold, settles on the way out, and rests. Warm on the way in,
// grounded on the way out, so the eye reads the turn without reading a word.
const PHASES = [
  { word: 'Breathe in',  cue: 'Let the air fill you, slowly',  scale: 1.14, fill: 100, warm: true,  hold: false },
  { word: 'Hold',        cue: 'Stay here, gently',             scale: 1.14, fill: 100, warm: true,  hold: true  },
  { word: 'Breathe out', cue: 'Let it go, just as slowly',     scale: 1.00, fill: 0,   warm: false, hold: false },
  { word: 'Rest',        cue: 'Empty, and still',              scale: 1.00, fill: 0,   warm: false, hold: true  },
];

const WARM = '#D4A373'; // Terracotta Grace — the breath arriving
const COOL = '#8E9775'; // Sage Peace — the breath leaving

// Seconds per side of the box. Everything below is derived from this, so the whole
// practice can be slowed or quickened from one place.
const COUNT = 5;
const PHASE_MS = COUNT * 1000;

const BREATH_TRANSITION = `transform ${PHASE_MS}ms ease-in-out`;
const BG = 'linear-gradient(180deg, #FDF9F3 0%, #F4EFE6 100%)';

export default function BoxBreathing({ onBack, user }) {
  const [stage, setStage] = useState('invitation'); // 'invitation' | 'breathing' | 'close'
  const [phase, setPhase] = useState(0);
  const [phaseSeq, setPhaseSeq] = useState(0); // remounts the arc so its sweep restarts
  const [ready, setReady] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);
  const tickRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (stage !== 'breathing') return;
    startTimeRef.current = Date.now();
    tickRef.current = 0;
    setPhase(0);
    setPhaseSeq(0);
    // A beat before the first scale so the orb eases open rather than snapping.
    const paintDelay = setTimeout(() => setReady(true), 80);
    intervalRef.current = setInterval(() => {
      const t = ++tickRef.current;
      setPhase(Math.floor(t / COUNT) % 4);
      if (t % COUNT === 0) setPhaseSeq(s => s + 1);
      if (t % (COUNT * 4) === 0) setCyclesCompleted(c => c + 1);
    }, 1000);
    return () => { clearTimeout(paintDelay); clearInterval(intervalRef.current); setReady(false); };
  }, [stage]);

  const handleEnd = async () => {
    clearInterval(intervalRef.current);
    const durationSecs = Math.round((Date.now() - (startTimeRef.current ?? Date.now())) / 1000);
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    setSaving(true);
    const today = new Date();
    const dateISO = today.toISOString().split('T')[0];
    const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    // Format is parsed by the calendar log — keep the labels as they are.
    const reflection = ['🌬️ Box Breathing Session', '', `Cycles completed: ${cyclesCompleted}`, `Duration: ${durationLabel}`].join('\n');
    try { await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection }); } catch { /* journal is best-effort */ }
    setSaving(false);
    setStage('close');
  };

  const cur = PHASES[phase];
  const tone = cur.warm ? WARM : COOL;
  const activeScale = ready ? cur.scale : 1;
  const activeFill = ready ? cur.fill : 0;

  // ── Invitation ────────────────────────────────────────────
  // Deliberately still. Nothing here animates on a cycle, so it is never mistaken
  // for the practice already being underway.
  if (stage === 'invitation') {
    return (
      <div className="fixed inset-0 flex flex-col font-sans overflow-y-auto" style={{ background: BG }}>
        <div className="pt-14 px-6 flex-shrink-0">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
            <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-4"
            style={{ opacity: 0, animation: 'fade-in 0.7s ease-out 0.1s forwards' }}>
            Box Breathing
          </p>

          <h1 className="text-4xl font-serif text-[#433422] leading-tight mb-7"
            style={{ opacity: 0, animation: 'fade-in 0.8s ease-out 0.25s forwards' }}>
            Breathe<br /><em className="italic text-[#D4A373]">with me.</em>
          </h1>

          {/* A single resting orb. Slow, shallow, clearly idle. */}
          <div className="relative flex items-center justify-center mb-8" style={{ width: 180, height: 180, opacity: 0, animation: 'fade-in 1s ease-out 0.4s forwards' }}>
            <div className="absolute rounded-full"
              style={{ width: 180, height: 180, border: '1px solid rgba(212,163,115,0.16)' }} />
            <div className="rounded-full"
              style={{
                width: 116, height: 116,
                background: 'radial-gradient(circle at 38% 38%, #D4A373, #D4A373cc)',
                boxShadow: '0 6px 34px rgba(212,163,115,0.26)',
                animation: 'restingBreath 6s ease-in-out infinite',
              }} />
          </div>

          <p className="text-base font-serif text-[#433422]/60 leading-relaxed mb-3"
            style={{ maxWidth: 280, opacity: 0, animation: 'fade-in 0.8s ease-out 0.55s forwards' }}>
            In for five. Hold for five.<br />Out for five. Rest for five.
          </p>
          <p className="text-sm text-[#433422]/40 leading-relaxed"
            style={{ maxWidth: 280, opacity: 0, animation: 'fade-in 0.8s ease-out 0.65s forwards' }}>
            Follow the circle. There is nothing to count and nothing to get right.
          </p>

          <div className="flex flex-col items-center mt-9"
            style={{ opacity: 0, animation: 'fade-in 0.9s ease-out 0.8s forwards' }}>
            <div style={{ width: 28, height: 1, backgroundColor: 'rgba(212,163,115,0.45)' }} />
            <p className="mt-4 text-sm font-serif italic text-[#433422]/45 leading-relaxed" style={{ maxWidth: 260 }}>
              &ldquo;The breath of the Almighty gives me life.&rdquo;
            </p>
            <p className="mt-2 text-[9px] font-bold tracking-[0.28em] uppercase text-[#433422]/25">Job 33:4</p>
          </div>
        </div>

        <div className="px-8 pb-14 flex-shrink-0"
          style={{ opacity: 0, animation: 'fade-in 0.8s ease-out 0.95s forwards' }}>
          <button onClick={() => setStage('breathing')}
            className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest active:scale-[0.98] transition-transform">
            BEGIN WHEN READY
          </button>
          <button onClick={onBack}
            className="w-full mt-3 py-2 text-[10px] font-bold tracking-widest text-[#433422]/25 uppercase">
            Not now
          </button>
        </div>
      </div>
    );
  }

  // ── Close ─────────────────────────────────────────────────
  if (stage === 'close') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center font-sans px-8" style={{ background: BG }}>
        <div className="relative flex items-center justify-center mb-8" style={{ width: 150, height: 150 }}>
          <div className="absolute rounded-full" style={{ width: 150, height: 150, border: '1px solid rgba(142,151,117,0.2)' }} />
          <div className="rounded-full"
            style={{
              width: 96, height: 96,
              background: 'radial-gradient(circle at 38% 38%, #8E9775, #8E9775cc)',
              boxShadow: '0 6px 30px rgba(142,151,117,0.24)',
              animation: 'restingBreath 6s ease-in-out infinite',
            }} />
        </div>

        {cyclesCompleted > 0 && (
          <p className="text-[10px] font-bold tracking-[0.3em] text-[#D4A373] uppercase mb-4">
            {cyclesCompleted} {cyclesCompleted === 1 ? 'round' : 'rounds'} of breath
          </p>
        )}

        <h2 className="text-3xl font-serif text-[#433422] text-center mb-5 leading-snug">
          Carry this<br /><em className="italic text-[#D4A373]">with you.</em>
        </h2>

        <p className="text-sm font-serif italic text-[#433422]/45 text-center leading-relaxed mb-12 max-w-[270px]">
          &ldquo;Peace I leave with you; my peace I give you.&rdquo; (John 14:27)
        </p>

        <button onClick={onBack}
          className="w-full max-w-[320px] py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest active:scale-[0.98] transition-transform">
          RETURN
        </button>
      </div>
    );
  }

  // ── Breathing ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col font-sans" style={{ background: BG }}>
      <div className="pt-14 px-6 flex-shrink-0">
        <button onClick={() => { clearInterval(intervalRef.current); onBack(); }}
          className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
          <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>

          {/* A soft ring that swells with the breath. No edge racing anywhere. */}
          <div className="absolute rounded-full"
            style={{ width: 280, height: 280, border: `1px solid ${tone}1f`, transform: `scale(${0.74 * activeScale})`, transition: `${BREATH_TRANSITION}, border-color 1.2s ease` }} />

          {/* Holds get one slow bloom rather than a countdown: enough to know the
              practice is still with you, without asking you to measure anything. */}
          {cur.hold && (
            <div key={`bloom-${phaseSeq}`} className="absolute rounded-full"
              style={{ width: 196, height: 196, border: `1px solid ${tone}`, animation: `holdBloom ${COUNT}s ease-out forwards` }} />
          )}

          {/* The vessel. Light wells up from the base on the way in and drains on the
              way out, so the progress marker is a slow tide rather than a timer. */}
          <div className="relative rounded-full overflow-hidden"
            style={{
              width: 180, height: 180,
              transform: `scale(${activeScale})`,
              transition: BREATH_TRANSITION,
              boxShadow: `0 8px 56px ${tone}33`,
            }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 38% 38%, ${tone}5c, ${tone}38)`, transition: 'background 1.2s ease' }} />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: `${activeFill}%`,
              background: `linear-gradient(to top, ${tone} 0%, ${tone} calc(100% - 34px), ${tone}00 100%)`,
              transition: `height ${PHASE_MS}ms ease-in-out, background 1.2s ease`,
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.26), transparent 58%)' }} />
          </div>
        </div>

        <div className="text-center mt-12 px-8" style={{ minHeight: 74 }}>
          <p key={`word-${phaseSeq}`} className="text-2xl font-serif text-[#433422] mb-1.5"
            style={{ opacity: 0, animation: 'fade-in 0.9s ease-out forwards' }}>
            {cur.word}
          </p>
          <p key={`cue-${phaseSeq}`} className="text-sm font-serif italic text-[#433422]/40"
            style={{ opacity: 0, animation: 'fade-in 1.1s ease-out 0.15s forwards' }}>
            {cur.cue}
          </p>
        </div>
      </div>

      <div className="px-8 pb-14 flex-shrink-0">
        <button onClick={handleEnd} disabled={saving}
          className="w-full py-4 text-[10px] font-bold tracking-widest uppercase text-[#433422]/35 rounded-[24px] border border-[#433422]/10 disabled:opacity-50 active:scale-[0.98] transition-transform">
          {saving ? 'Saving…' : 'Finish when you are ready'}
        </button>
      </div>
    </div>
  );
}
