import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

const STEPS = [
  { count: 5, sense: 'Things you can see',   hint: 'Colours, shapes, light around you.',      },
  { count: 4, sense: 'Things you can touch', hint: 'Textures, temperature, your own skin.',   },
  { count: 3, sense: 'Things you can hear',  hint: 'Near sounds, distant sounds, silence.',   },
  { count: 2, sense: 'Things you can smell', hint: 'The room, the air, your own warmth.',     },
  { count: 1, sense: 'Thing you can taste',  hint: 'Linger on any lingering taste.',          },
];

const SENSE_LABELS = ['See', 'Touch', 'Hear', 'Smell', 'Taste'];

const buildInitialAnswers = () =>
  Object.fromEntries(STEPS.map((s, i) => [i, Array(s.count).fill('')]));

const BG = 'linear-gradient(180deg, #F4F8F1 0%, #EBF0E6 100%)';

export default function GroundingExercise({ onBack, user }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(buildInitialAnswers());
  const [view, setView] = useState('exercise'); // 'exercise' | 'reflect' | 'done'
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const updateAnswer = (answerIdx, val) => {
    setAnswers(prev => ({
      ...prev,
      [stepIndex]: prev[stepIndex].map((a, i) => (i === answerIdx ? val : a)),
    }));
  };

  const advance = () => {
    if (isLast) { setView('reflect'); return; }
    setStepIndex(i => i + 1);
  };

  const saveAndFinish = async () => {
    setSaving(true);
    const today = new Date();
    const dateISO = today.toISOString().split('T')[0];
    const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const answerSummary = STEPS.map((s, i) => {
      const filled = answers[i].filter(Boolean);
      if (!filled.length) return null;
      return `${SENSE_LABELS[i]}: ${filled.join(', ')}`;
    }).filter(Boolean).join('\n');
    const fullReflection = ['🌿 5-4-3-2-1 Grounding', '', answerSummary, reflection ? `\nReflection: ${reflection}` : ''].join('\n').trim();
    try {
      await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, feelingBefore: '', feelingAfter: '', reflection: fullReflection });
    } catch (_) {}
    setSaving(false);
    setView('done');
  };

  // ── Done ──────────────────────────────────────────────────
  if (view === 'done') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center font-sans px-8" style={{ background: BG }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: 'rgba(142,151,117,0.12)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 className="text-3xl font-serif text-[#433422] text-center mb-4 leading-snug">
          You are<br /><em className="italic text-[#8E9775]">grounded.</em>
        </h2>
        <p className="text-sm text-[#433422]/45 text-center leading-relaxed mb-10 max-w-[260px]">
          "Be still, and know that I am God." — Psalm 46:10
        </p>
        <button onClick={onBack}
          className="w-full max-w-[320px] py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest">
          RETURN
        </button>
      </div>
    );
  }

  // ── Reflection ────────────────────────────────────────────
  if (view === 'reflect') {
    return (
      <div className="fixed inset-0 flex flex-col font-sans overflow-y-auto" style={{ background: BG }}>
        <div className="pt-14 px-6 flex-shrink-0">
          <button onClick={() => setStepIndex(STEPS.length - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
          </button>
        </div>

        <div className="px-8 pt-5 pb-6 flex-shrink-0">
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-2">5·4·3·2·1</p>
          <h1 className="text-4xl font-serif text-[#433422] leading-tight">
            Your<br /><em className="italic text-[#8E9775]">Reflections</em>
          </h1>
        </div>

        <div className="px-8 pb-14 space-y-3 flex-shrink-0">
          {/* Answer summary */}
          {STEPS.map((s, i) => {
            const filled = answers[i].filter(Boolean);
            if (!filled.length) return null;
            return (
              <div key={i} className="rounded-[20px] px-5 py-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.65)' }}>
                <p className="text-[8px] font-bold tracking-widest text-[#8E9775] uppercase mb-1.5">
                  {SENSE_LABELS[i]}
                </p>
                <p className="text-sm text-[#433422]/70 leading-relaxed">{filled.join(' · ')}</p>
              </div>
            );
          })}

          {/* Reflection textarea */}
          <div className="rounded-[20px] px-5 py-4" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }}>
            <p className="text-[8px] font-bold tracking-widest text-[#433422]/40 uppercase mb-2">
              How do you feel now?
            </p>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="Write a few words about this moment..."
              rows={3}
              className="w-full bg-transparent text-sm text-[#433422] placeholder:text-[#433422]/25 resize-none focus:outline-none leading-relaxed"
            />
          </div>

          <button onClick={saveAndFinish} disabled={saving}
            className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? 'SAVING...' : 'SAVE TO JOURNAL'}
          </button>
          <button onClick={() => setView('done')}
            className="w-full py-2 text-[10px] font-bold tracking-widest text-[#433422]/30 uppercase">
            SKIP
          </button>
        </div>
      </div>
    );
  }

  // ── Exercise ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col font-sans" style={{ background: BG }}>
      {/* Header */}
      <div className="pt-14 px-6 pb-2 flex-shrink-0 flex items-center justify-between">
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
        </button>
        <p className="text-[9px] font-bold tracking-[0.35em] text-[#433422]/30 uppercase">Grounding</p>
        <div className="w-9" />
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 justify-center pt-4 pb-2 flex-shrink-0">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-300"
            style={{ width: i === stepIndex ? 24 : 8, background: i <= stepIndex ? '#8E9775' : '#C8D4B8' }} />
        ))}
      </div>

      {/* Big number + sense — centered in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <p key={stepIndex}
          className="text-[120px] leading-none font-serif text-[#8E9775] mb-0"
          style={{ opacity: 0, animation: 'fade-in 0.5s ease-out forwards' }}>
          {step.count}
        </p>
        <p key={`sense-${stepIndex}`}
          className="text-xl font-serif text-[#433422] text-center mt-1"
          style={{ opacity: 0, animation: 'fade-in 0.5s ease-out 0.1s forwards' }}>
          {step.sense}
        </p>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#433422]/30 mt-2 text-center">
          {step.hint}
        </p>
      </div>

      {/* Input slots + button */}
      <div className="px-6 pb-14 flex-shrink-0 space-y-2">
        {answers[stepIndex].map((val, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[18px] px-4 py-3.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
            <span className="text-[10px] font-bold tracking-wider text-[#8E9775] flex-shrink-0 w-4">{i + 1}</span>
            <input
              type="text"
              value={val}
              onChange={e => updateAnswer(i, e.target.value)}
              placeholder="Write what you notice..."
              className="flex-1 bg-transparent text-sm text-[#433422] placeholder:text-[#433422]/25 focus:outline-none"
            />
          </div>
        ))}

        <button onClick={advance}
          className="w-full py-5 mt-1 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest active:scale-[0.98] transition-transform">
          {isLast ? 'REFLECT' : 'NEXT SENSE'}
        </button>
      </div>
    </div>
  );
}
