import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

const STEPS = [
  { count: 5, sense: 'Things you can see',   hint: 'Colours, shapes, light around you.',      color: '#8E9775' },
  { count: 4, sense: 'Things you can touch', hint: 'Textures, temperature, your own skin.',   color: '#8E9775' },
  { count: 3, sense: 'Things you can hear',  hint: 'Near sounds, distant sounds, silence.',   color: '#8E9775' },
  { count: 2, sense: 'Things you can smell', hint: 'The room, the air, your own warmth.',     color: '#8E9775' },
  { count: 1, sense: 'Thing you can taste',  hint: 'Linger on any lingering taste.',          color: '#8E9775' },
];

const SENSE_LABELS = ['See', 'Touch', 'Hear', 'Smell', 'Taste'];

// Build initial answers: { 0: ['','','','',''], 1: ['','','',''], ... }
const buildInitialAnswers = () =>
  Object.fromEntries(STEPS.map((s, i) => [i, Array(s.count).fill('')]));

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

    const fullReflection = [
      '🌿 5-4-3-2-1 Grounding',
      '',
      answerSummary,
      reflection ? `\nReflection: ${reflection}` : '',
    ].join('\n').trim();

    try {
      await addJournalEntry(user?.uid ?? null, {
        dateISO,
        dateDisplay,
        feelingBefore: '',
        feelingAfter: '',
        reflection: fullReflection,
      });
    } catch (_) {}
    setSaving(false);
    setView('done');
  };

  // ── Done ──────────────────────────────────────────────────
  if (view === 'done') {
    return (
      <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">
          <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-3">Prayvail</p>
            <h1 className="text-3xl font-serif leading-tight">
              You are<br /><em className="italic text-[#8E9775]">grounded.</em>
            </h1>
            <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
              style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
          </div>
          <div className="flex flex-col items-center px-8 pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-[#8E9775]/10 rounded-full flex items-center justify-center mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8E9775" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="text-sm text-[#433422]/50 leading-relaxed mb-8 max-w-[220px]">
              "Be still, and know that I am God." — Psalm 46:10
            </p>
            <button onClick={onBack} className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest">
              RETURN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Reflection ────────────────────────────────────────────
  if (view === 'reflect') {
    return (
      <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">
          {/* Arch header */}
          <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-3">Prayvail</p>
            <h1 className="text-3xl font-serif leading-tight">
              Your<br /><em className="italic text-[#8E9775]">Reflections</em>
            </h1>
            <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
              style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
          </div>

          <div className="px-7 pt-10 pb-8 space-y-4">
            {/* Answer summary */}
            <div className="space-y-2">
              {STEPS.map((s, i) => {
                const filled = answers[i].filter(Boolean);
                if (!filled.length) return null;
                return (
                  <div key={i} className="bg-[#FDF9F3] rounded-[18px] px-4 py-3">
                    <p className="text-[8px] font-bold tracking-widest text-[#8E9775] uppercase mb-1.5">
                      {SENSE_LABELS[i]}
                    </p>
                    <p className="text-xs text-[#433422]/70 leading-relaxed">{filled.join(' · ')}</p>
                  </div>
                );
              })}
            </div>

            {/* Reflection textarea */}
            <div className="bg-[#FDF9F3] rounded-[18px] px-4 py-3">
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

            <button
              onClick={saveAndFinish}
              disabled={saving}
              className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE TO JOURNAL'}
            </button>
            <button
              onClick={() => setView('done')}
              className="w-full py-3 text-[11px] font-bold tracking-widest text-[#433422]/35 hover:text-[#433422]/60 transition-colors"
            >
              SKIP
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

        {/* Arch header */}
        <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
          <button
            onClick={onBack}
            className="absolute top-10 left-6 p-1 text-[#433422]/35 hover:text-[#433422] transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-3">Prayvail</p>
          <h1 className="text-3xl font-serif leading-tight">
            5·4·3·2·1<br /><em className="italic text-[#8E9775]">Grounding</em>
          </h1>
          <div className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
            style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }} />
        </div>

        {/* Body */}
        <div className="px-7 pt-10 pb-8">
          {/* Step indicator */}
          <div className="flex gap-1.5 justify-center mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 24 : 8,
                  background: i <= stepIndex ? '#8E9775' : '#E9DCC9',
                }}
              />
            ))}
          </div>

          {/* Big number + sense */}
          <div className="text-center mb-5">
            <p className="text-[64px] leading-none font-serif text-[#8E9775] mb-1">{step.count}</p>
            <p className="text-lg font-serif text-[#433422]">{step.sense}</p>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#433422]/30 mt-1">{step.hint}</p>
          </div>

          {/* Fillable item slots */}
          <div className="space-y-2 mb-6">
            {answers[stepIndex].map((val, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#FDF9F3] rounded-[16px] px-4 py-3">
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
          </div>

          <button
            onClick={advance}
            className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest"
          >
            {isLast ? 'REFLECT' : 'NEXT SENSE'}
          </button>
        </div>
      </div>
    </div>
  );
}
