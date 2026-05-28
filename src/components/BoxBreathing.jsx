import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

const PHASES = [
  { label: 'BREATHE IN SLOWLY', instruction: 'Inhale...',        scale: 1.20, isHold: false },
  { label: 'HOLD YOUR BREATH',  instruction: 'Hold your breath', scale: 1.20, isHold: true  },
  { label: 'RELEASE SLOWLY',    instruction: 'Exhale...',        scale: 1,    isHold: false },
  { label: 'REST AND HOLD',     instruction: 'Rest...',          scale: 1,    isHold: true  },
];

const BREATH_TRANSITION = 'transform 4000ms ease-in-out';

const TUTORIAL_STEPS = [
  { count: '4', label: 'INHALE', detail: 'Breathe in slowly through your nose for 4 counts.' },
  { count: '4', label: 'HOLD',   detail: 'Hold your breath gently at the top for 4 counts.' },
  { count: '4', label: 'EXHALE', detail: 'Release slowly through your mouth for 4 counts.' },
  { count: '4', label: 'REST',   detail: 'Rest at the bottom — empty and still — for 4 counts.' },
];

export default function BoxBreathing({ onBack, user }) {
  const [stage, setStage] = useState('tutorial'); // 'tutorial' | 'countdown' | 'exercise' | 'done'
  const [tutorialStep, setTutorialStep] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [ready, setReady] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);
  const tickRef = useRef(0);
  const startTimeRef = useRef(null);

  // Countdown before exercise
  useEffect(() => {
    if (stage !== 'countdown') return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          setStage('exercise');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  // Exercise interval
  useEffect(() => {
    if (stage !== 'exercise') return;
    startTimeRef.current = Date.now();
    tickRef.current = 0;
    const paintDelay = setTimeout(() => setReady(true), 80);
    intervalRef.current = setInterval(() => {
      const t = ++tickRef.current;
      const newPhase = Math.floor(t / 4) % 4;
      setPhase(newPhase);
      setCount(t % 4 === 0 ? 4 : 4 - (t % 4));
      // A full cycle completes every 16 ticks (4 phases × 4 counts)
      if (t % 16 === 0) setCyclesCompleted(c => c + 1);
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
    const reflection = [
      '🌬️ Box Breathing Session',
      '',
      `Cycles completed: ${cyclesCompleted}`,
      `Duration: ${durationLabel}`,
    ].join('\n');

    try {
      await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection });
    } catch (_) {}
    setSaving(false);
    setStage('done');
  };

  const cur = PHASES[phase];
  const activeScale = ready ? cur.scale : 1;

  // ── Tutorial ──────────────────────────────────────────────
  if (stage === 'tutorial') {
    const step = TUTORIAL_STEPS[tutorialStep];
    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
    return (
      <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">

          <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
            <button
              onClick={onBack}
              className="absolute top-10 left-6 p-1 text-[#433422]/35"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">How it works</p>
            <h1 className="text-3xl font-serif leading-tight">
              Box<br /><em className="italic text-[#D4A373]">Breathing</em>
            </h1>
            <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
              style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
          </div>

          <div className="flex flex-col items-center px-7 pt-10 pb-8">
            {/* Step dots */}
            <div className="flex gap-1.5 mb-8">
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-300"
                  style={{ width: i === tutorialStep ? 24 : 8, background: i <= tutorialStep ? '#D4A373' : '#E9DCC9' }} />
              ))}
            </div>

            {/* Phase preview circle */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(145deg, #D4A373 0%, #c8874a 100%)', boxShadow: '0 4px 24px rgba(212,163,115,0.25)' }}>
              <span className="text-4xl font-serif text-[#FDF9F3]">{step.count}</span>
            </div>

            <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">{step.label}</p>
            <p className="text-sm text-[#433422]/60 text-center leading-relaxed max-w-[220px] mb-10">
              {step.detail}
            </p>

            <button
              onClick={() => {
                if (isLast) { setStage('countdown'); } else { setTutorialStep(i => i + 1); }
              }}
              className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest active:scale-[0.98] transition-transform"
            >
              {isLast ? "I'M READY" : 'NEXT'}
            </button>
            {tutorialStep > 0 && (
              <button onClick={() => setTutorialStep(i => i - 1)}
                className="mt-3 text-[10px] font-bold tracking-widest text-[#433422]/30">
                BACK
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown ─────────────────────────────────────────────
  if (stage === 'countdown') {
    return (
      <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">
          <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">Prayvail</p>
            <h1 className="text-3xl font-serif leading-tight">
              Box<br /><em className="italic text-[#D4A373]">Breathing</em>
            </h1>
            <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
              style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
          </div>
          <div className="flex flex-col items-center px-7 pt-10 pb-12">
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#433422]/30 uppercase mb-8">Starting in</p>
            <div className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(145deg, #D4A373 0%, #c8874a 100%)', boxShadow: '0 4px 32px rgba(212,163,115,0.28)' }}>
              <span key={countdown} className="text-6xl font-serif text-[#FDF9F3] animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                {countdown}
              </span>
            </div>
            <p className="text-sm font-serif text-[#433422]/40">Settle in and breathe naturally</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">
          <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">Prayvail</p>
            <h1 className="text-3xl font-serif leading-tight">
              Well<br /><em className="italic text-[#D4A373]">Done.</em>
            </h1>
            <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
              style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
          </div>
          <div className="flex flex-col items-center px-8 pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-[#8E9775]/10 rounded-full flex items-center justify-center mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            {cyclesCompleted > 0 && (
              <p className="text-[10px] font-bold tracking-widest text-[#D4A373] uppercase mb-3">
                {cyclesCompleted} {cyclesCompleted === 1 ? 'cycle' : 'cycles'} complete
              </p>
            )}
            <p className="text-sm text-[#433422]/50 leading-relaxed mb-8 max-w-[220px]">
              "Peace I leave with you; my peace I give you." — John 14:27
            </p>
            <button onClick={onBack} className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest">
              RETURN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exercise ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">

        <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
          <button
            onClick={() => { clearInterval(intervalRef.current); onBack(); }}
            className="absolute top-10 left-6 p-1 text-[#433422]/35"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">Prayvail</p>
          <h1 className="text-3xl font-serif leading-tight">
            Box<br /><em className="italic text-[#D4A373]">Breathing</em>
          </h1>
          <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
            style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
        </div>

        <div className="flex flex-col items-center px-7 pt-10 pb-8">
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-7 min-h-[14px]">
            {cur.label}
          </p>

          <div className="relative flex items-center justify-center mb-7" style={{ width: 220, height: 220 }}>
            <div
              className={cur.isHold ? 'absolute inset-0 rounded-full border border-[#D4A373]/18 animate-[holdPulseOuter_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full border border-[#D4A373]/18'}
              style={{ transform: `scale(${0.88 * activeScale})`, transition: BREATH_TRANSITION }}
            />
            <div
              className={cur.isHold ? 'absolute inset-0 rounded-full border border-[#D4A373]/30 animate-[holdPulseInner_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full border border-[#D4A373]/30'}
              style={{ transform: `scale(${0.72 * activeScale})`, transition: BREATH_TRANSITION }}
            />
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 144, height: 144,
                background: 'linear-gradient(145deg, #D4A373 0%, #c8874a 100%)',
                boxShadow: '0 4px 32px rgba(212,163,115,0.28)',
                transform: `scale(${activeScale})`,
                transition: BREATH_TRANSITION,
              }}
            >
              <span key={count} className="text-5xl font-serif text-[#FDF9F3] animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                {count}
              </span>
            </div>
          </div>

          <p className="text-2xl font-serif text-[#433422] mb-1">{cur.instruction}</p>
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#433422]/30 mb-8">
            {cur.isHold ? 'hold steady' : 'follow the rhythm'}
          </p>

          <button
            onClick={handleEnd}
            disabled={saving}
            className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'END SESSION'}
          </button>
        </div>
      </div>
    </div>
  );
}
