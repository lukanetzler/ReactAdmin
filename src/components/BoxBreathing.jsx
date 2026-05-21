import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

const PHASES = [
  { label: 'BREATHE IN SLOWLY', instruction: 'Inhale...',        scale: 1.20, isHold: false },
  { label: 'HOLD YOUR BREATH',  instruction: 'Hold your breath', scale: 1.20, isHold: true  },
  { label: 'RELEASE SLOWLY',    instruction: 'Exhale...',        scale: 1,    isHold: false },
  { label: 'REST AND HOLD',     instruction: 'Rest...',          scale: 1,    isHold: true  },
];

// Always 4 s — holds don't change scale so the duration is a no-op during them.
// Keeping it constant avoids the browser using the *old* short duration when
// transitioning from a Hold phase to an active phase in the same render.
const BREATH_TRANSITION = 'transform 4000ms ease-in-out';

export default function BoxBreathing({ onBack }) {
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [done, setDone] = useState(false);
  // Paint the orb at scale 1 first so the CSS transition has a baseline
  // to animate from on the very first inhale.
  const [ready, setReady] = useState(false);
  const intervalRef = useRef(null);
  // Monotonic tick counter — never read as React state, so Strict Mode's
  // double-invocation of updaters cannot cause phase to skip.
  const tickRef = useRef(0);

  useEffect(() => {
    const paintDelay = setTimeout(() => setReady(true), 80);
    intervalRef.current = setInterval(() => {
      const t = ++tickRef.current;
      // phase: 0=Inhale, 1=Hold, 2=Exhale, 3=Rest — advances every 4 ticks
      setPhase(Math.floor(t / 4) % 4);
      // count: 4 → 3 → 2 → 1, repeating — t%4===0 gives 4 (start of phase)
      setCount(t % 4 === 0 ? 4 : 4 - (t % 4));
    }, 1000);
    return () => { clearTimeout(paintDelay); clearInterval(intervalRef.current); };
  }, []);

  const cur = PHASES[phase];
  // Before the 80 ms paint delay, keep everything at scale 1 so the first
  // inhale transition has a starting point to animate from.
  const activeScale = ready ? cur.scale : 1;

  // ── Completion card ───────────────────────────────────────
  if (done) {
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
            <div className="w-16 h-16 bg-[#8E9775]/10 rounded-full flex items-center justify-center mb-6">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
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

  // ── Main card ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">

        {/* Arch header */}
        <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
          <button
            onClick={() => { clearInterval(intervalRef.current); onBack(); }}
            className="absolute top-10 left-6 p-1 text-[#433422]/35 hover:text-[#433422] transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">Prayvail</p>
          <h1 className="text-3xl font-serif leading-tight">
            Box<br /><em className="italic text-[#D4A373]">Breathing</em>
          </h1>
          {/* Arch wave — left-0/right-0 so it's fully contained within the card */}
          <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
            style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
        </div>

        {/* Body */}
        <div className="flex flex-col items-center px-7 pt-10 pb-8">

          {/* Phase label */}
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-7 min-h-[14px]">
            {cur.label}
          </p>

          {/* Orb area — fixed 220×220 bounding box keeps rings inside the card */}
          <div className="relative flex items-center justify-center mb-7" style={{ width: 220, height: 220 }}>

            {/* Outer ring */}
            <div
              className={cur.isHold ? 'absolute inset-0 rounded-full border border-[#D4A373]/18 animate-[holdPulseOuter_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full border border-[#D4A373]/18'}
              style={{ transform: `scale(${0.88 * activeScale})`, transition: BREATH_TRANSITION }}
            />
            {/* Inner ring */}
            <div
              className={cur.isHold ? 'absolute inset-0 rounded-full border border-[#D4A373]/30 animate-[holdPulseInner_2.5s_ease-in-out_infinite]' : 'absolute inset-0 rounded-full border border-[#D4A373]/30'}
              style={{ transform: `scale(${0.72 * activeScale})`, transition: BREATH_TRANSITION }}
            />

            {/* Core orb */}
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
              <span
                key={count}
                className="text-5xl font-serif text-[#FDF9F3] animate-[countPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
              >
                {count}
              </span>
            </div>
          </div>

          <p className="text-2xl font-serif text-[#433422] mb-1">{cur.instruction}</p>
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#433422]/30 mb-8">
            {cur.isHold ? 'hold steady' : 'follow the rhythm'}
          </p>

          <button
            onClick={() => { clearInterval(intervalRef.current); setDone(true); }}
            className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest"
          >
            END SESSION
          </button>
        </div>

      </div>
    </div>
  );
}
