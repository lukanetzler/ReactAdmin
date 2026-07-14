import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

const PHASES = [
  { label: 'BREATHE IN',  cue: 'Inhale slowly through your nose',  scale: 1.20, isHold: false },
  { label: 'HOLD',        cue: 'Hold gently at the top',           scale: 1.20, isHold: true  },
  { label: 'BREATHE OUT', cue: 'Exhale slowly through your mouth', scale: 1,    isHold: false },
  { label: 'REST',        cue: 'Empty and still',                  scale: 1,    isHold: true  },
];

const PHASE_COLORS = ['#D4A373', '#C8944E', '#8E9775', '#6B7F5E'];

const BREATH_TRANSITION = 'transform 4000ms ease-in-out';

const BG = 'linear-gradient(180deg, #FDF9F3 0%, #F4EFE6 100%)';

export default function BoxBreathing({ onBack, user }) {
  const [stage, setStage] = useState('intro'); // 'intro' | 'countdown' | 'exercise' | 'done'
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [ready, setReady] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [saving, setSaving] = useState(false);

  const [demoPhase, setDemoPhase] = useState(0);
  const [demoCount, setDemoCount] = useState(4);
  const [demoReady, setDemoReady] = useState(false);

  const intervalRef = useRef(null);
  const tickRef = useRef(0);
  const startTimeRef = useRef(null);
  const demoTickRef = useRef(0);

  // Intro demo loop
  useEffect(() => {
    if (stage !== 'intro') return;
    const paint = setTimeout(() => setDemoReady(true), 120);
    demoTickRef.current = 0;
    const id = setInterval(() => {
      const t = ++demoTickRef.current;
      setDemoPhase(Math.floor(t / 4) % 4);
      setDemoCount(t % 4 === 0 ? 4 : 4 - (t % 4));
    }, 1000);
    return () => { clearTimeout(paint); clearInterval(id); setDemoReady(false); };
  }, [stage]);

  // Countdown
  useEffect(() => {
    if (stage !== 'countdown') return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); setStage('exercise'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  // Exercise
  useEffect(() => {
    if (stage !== 'exercise') return;
    startTimeRef.current = Date.now();
    tickRef.current = 0;
    const paintDelay = setTimeout(() => setReady(true), 80);
    intervalRef.current = setInterval(() => {
      const t = ++tickRef.current;
      setPhase(Math.floor(t / 4) % 4);
      setCount(t % 4 === 0 ? 4 : 4 - (t % 4));
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
    const reflection = ['🌬️ Box Breathing Session', '', `Cycles completed: ${cyclesCompleted}`, `Duration: ${durationLabel}`].join('\n');
    try { await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection }); } catch (_) {}
    setSaving(false);
    setStage('done');
  };

  const cur = PHASES[phase];
  const demoCur = PHASES[demoPhase];
  const activeScale = ready ? cur.scale : 1;
  const demoScale = demoReady ? demoCur.scale : 1;

  // ── Intro ─────────────────────────────────────────────────
  if (stage === 'intro') {
    return (
      <div className="fixed inset-0 flex flex-col font-sans overflow-y-auto" style={{ background: BG }}>
        <div className="pt-14 px-6 flex-shrink-0">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
            <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
          </button>
        </div>

        <div className="px-8 pt-5 pb-2 flex-shrink-0">
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-2"
            style={{ opacity: 0, animation: 'fade-in 0.6s ease-out 0.1s forwards' }}>
            Welcome to
          </p>
          <h1 className="text-4xl font-serif text-[#433422] leading-tight"
            style={{ opacity: 0, animation: 'fade-in 0.7s ease-out 0.2s forwards' }}>
            Box<br /><em className="italic text-[#D4A373]">Breathing</em>
          </h1>
          <p className="mt-3 text-sm text-[#433422]/50 leading-relaxed"
            style={{ maxWidth: 290, opacity: 0, animation: 'fade-in 0.7s ease-out 0.4s forwards' }}>
            A 4-count cycle used by therapists, athletes, and military training to calm the nervous system and return you to the present moment.
          </p>
        </div>

        <div className="flex flex-col items-center pt-8 pb-4 flex-shrink-0"
          style={{ opacity: 0, animation: 'fade-in 0.8s ease-out 0.5s forwards' }}>
          <p className="text-[9px] font-bold tracking-[0.35em] text-[#433422]/25 uppercase mb-6">Live Preview</p>

          <div className="relative flex items-center justify-center" style={{ width: 190, height: 190 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${PHASE_COLORS[demoPhase]}30`, transform: `scale(${0.9 * demoScale})`, transition: BREATH_TRANSITION }} />
            <div className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${PHASE_COLORS[demoPhase]}50`, transform: `scale(${0.74 * demoScale})`, transition: BREATH_TRANSITION }} />
            <div className="rounded-full flex items-center justify-center"
              style={{
                width: 120, height: 120,
                background: `radial-gradient(circle at 38% 38%, ${PHASE_COLORS[demoPhase]}, ${PHASE_COLORS[demoPhase]}cc)`,
                boxShadow: `0 6px 36px ${PHASE_COLORS[demoPhase]}40`,
                transform: `scale(${demoScale})`,
                transition: `${BREATH_TRANSITION}, background 1s ease, box-shadow 1s ease`,
              }}>
              <span key={demoCount} className="text-4xl font-serif text-white animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                {demoCount}
              </span>
            </div>
          </div>

          <p key={`label-${demoPhase}`} className="mt-5 text-[10px] font-bold tracking-[0.3em] uppercase"
            style={{ color: PHASE_COLORS[demoPhase], opacity: 0, animation: 'fade-in 0.4s ease-out forwards', transition: 'color 0.5s ease' }}>
            {demoCur.label}
          </p>
          <p key={`cue-${demoPhase}`} className="mt-1 text-sm font-serif text-[#433422]/45"
            style={{ opacity: 0, animation: 'fade-in 0.5s ease-out 0.12s forwards' }}>
            {demoCur.cue}
          </p>
        </div>

        <div className="px-8 pb-4 flex-shrink-0"
          style={{ opacity: 0, animation: 'fade-in 0.7s ease-out 0.7s forwards' }}>
          <p className="text-[9px] font-bold tracking-[0.35em] text-[#433422]/25 uppercase mb-3">Each cycle</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Inhale', color: '#D4A373' },
              { label: 'Hold',   color: '#C8944E' },
              { label: 'Exhale', color: '#8E9775' },
              { label: 'Rest',   color: '#6B7F5E' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-[16px] px-4 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-[11px] font-bold text-[#433422]/70">{label}</p>
                  <p className="text-[9px] text-[#433422]/35">4 counts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pt-4 pb-14 flex-shrink-0"
          style={{ opacity: 0, animation: 'fade-in 0.7s ease-out 0.9s forwards' }}>
          <button onClick={() => setStage('countdown')}
            className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest active:scale-[0.98] transition-transform">
            BEGIN SESSION
          </button>
          <button onClick={onBack}
            className="w-full mt-3 py-2 text-[10px] font-bold tracking-widest text-[#433422]/25 uppercase">
            Not now
          </button>
        </div>
      </div>
    );
  }

  // ── Countdown ─────────────────────────────────────────────
  if (stage === 'countdown') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center font-sans" style={{ background: BG }}>
        <p className="text-[9px] font-bold tracking-[0.4em] text-[#433422]/30 uppercase mb-10">Starting in</p>
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          <div className="absolute inset-0 rounded-full border border-[#D4A373]/15"
            style={{ animation: 'holdPulseOuter 2.5s ease-in-out infinite' }} />
          <div className="absolute inset-0 rounded-full border border-[#D4A373]/25"
            style={{ animation: 'holdPulseInner 2.5s ease-in-out infinite' }} />
          <div className="w-36 h-36 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #D4A373 0%, #c8874a 100%)', boxShadow: '0 8px 48px rgba(212,163,115,0.3)' }}>
            <span key={countdown}
              className="text-7xl font-serif text-white animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              {countdown}
            </span>
          </div>
        </div>
        <p className="mt-10 text-sm font-serif text-[#433422]/40">Settle in and breathe naturally</p>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center font-sans px-8" style={{ background: BG }}>
        <div className="w-16 h-16 bg-[#8E9775]/10 rounded-full flex items-center justify-center mb-5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        {cyclesCompleted > 0 && (
          <p className="text-[10px] font-bold tracking-widest text-[#D4A373] uppercase mb-3">
            {cyclesCompleted} {cyclesCompleted === 1 ? 'cycle' : 'cycles'} complete
          </p>
        )}
        <h2 className="text-3xl font-serif text-[#433422] text-center mb-4 leading-snug">
          Well<br /><em className="italic text-[#D4A373]">Done.</em>
        </h2>
        <p className="text-sm text-[#433422]/45 text-center leading-relaxed mb-10 max-w-[260px]">
          "Peace I leave with you; my peace I give you." (John 14:27)
        </p>
        <button onClick={onBack}
          className="w-full max-w-[320px] py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest">
          RETURN
        </button>
      </div>
    );
  }

  // ── Exercise ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col font-sans" style={{ background: BG }}>
      {/* Header */}
      <div className="pt-14 px-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <button onClick={() => { clearInterval(intervalRef.current); onBack(); }}
          className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
          <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
        </button>
        <p className="text-[9px] font-bold tracking-[0.35em] text-[#433422]/30 uppercase">Box Breathing</p>
        <div className="w-9" />
      </div>

      {/* Phase label */}
      <div className="text-center flex-shrink-0 mb-2">
        <p key={`phase-${phase}`} className="text-[10px] font-bold tracking-[0.35em] uppercase"
          style={{ color: PHASE_COLORS[phase], opacity: 0, animation: 'fade-in 0.4s ease-out forwards' }}>
          {cur.label}
        </p>
      </div>

      {/* Orb — takes remaining vertical space, centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          <div
            className={cur.isHold ? 'absolute inset-0 rounded-full animate-[holdPulseOuter_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full'}
            style={{ border: `1px solid ${PHASE_COLORS[phase]}25`, transform: `scale(${0.88 * activeScale})`, transition: BREATH_TRANSITION }}
          />
          <div
            className={cur.isHold ? 'absolute inset-0 rounded-full animate-[holdPulseInner_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full'}
            style={{ border: `1px solid ${PHASE_COLORS[phase]}45`, transform: `scale(${0.72 * activeScale})`, transition: BREATH_TRANSITION }}
          />
          <div className="rounded-full flex items-center justify-center"
            style={{
              width: 180, height: 180,
              background: `radial-gradient(circle at 38% 38%, ${PHASE_COLORS[phase]}, ${PHASE_COLORS[phase]}cc)`,
              boxShadow: `0 8px 60px ${PHASE_COLORS[phase]}45`,
              transform: `scale(${activeScale})`,
              transition: `${BREATH_TRANSITION}, background 1s ease, box-shadow 1s ease`,
            }}>
            <span key={count}
              className="text-6xl font-serif text-white animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              {count}
            </span>
          </div>
        </div>
      </div>

      {/* Instruction + button */}
      <div className="px-8 pb-14 flex-shrink-0 text-center">
        <p key={`cue-${phase}`} className="text-xl font-serif text-[#433422] mb-1"
          style={{ opacity: 0, animation: 'fade-in 0.5s ease-out forwards' }}>
          {cur.cue}
        </p>
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#433422]/30 mb-8">
          {cur.isHold ? 'hold steady' : 'follow the rhythm'}
        </p>
        <button onClick={handleEnd} disabled={saving}
          className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-50 active:scale-[0.98] transition-transform">
          {saving ? 'SAVING...' : 'END SESSION'}
        </button>
      </div>
    </div>
  );
}
