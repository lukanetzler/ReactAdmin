import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wheat, Calendar, Compass, User } from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.webp';

const NAV_ITEMS = [
  { icon: User,    label: 'Profile' },
  { icon: Calendar,label: 'Log' },
  { icon: Home,    label: 'Home',    center: true },
  { icon: Wheat,   label: 'Library' },
  { icon: Compass, label: 'Explore' },
];

// navHighlight: which NAV_ITEMS index to pulse. null = scanning mode. -1 = all lit.
const STEPS = [
  {
    tag: 'WELCOME',
    title: 'Your Sanctuary Awaits',
    body: 'Prayvail is a quiet space for daily stillness, reflection, and the slow walk of faith. Take a moment each day, it adds up.',
    type: 'logo',
    navHighlight: null,
  },
  {
    tag: 'GETTING AROUND',
    title: 'Your navigation',
    body: 'Five tabs keep everything within reach. Watch each one light up, the next few slides explain what each does.',
    type: 'nav',
    navHighlight: null, // scanning mode
  },
  {
    tag: 'DAILY HOME',
    title: 'Begin Each Day Here',
    body: 'Your home tab holds the daily verse, your flame streak, and the one session waiting on your path. Start here every morning.',
    type: 'nav',
    navHighlight: 2,
    iconBg: '#D4A373',
  },
  {
    tag: 'YOUR JOURNEY',
    title: 'Walk Your Path',
    body: 'Browse the library and add a journey to your path. Each journey is walked one session a day, no rushing, just presence.',
    type: 'nav',
    navHighlight: 3,
    iconBg: '#D4A373',
  },
  {
    tag: 'YOUR LOG',
    title: 'Record What Matters',
    body: 'After each session the app invites you to capture a feeling and a reflection. Over time this becomes your personal history of growth.',
    type: 'nav',
    navHighlight: 1,
    iconBg: '#8E9775',
  },
  {
    tag: 'EXPLORE & REST',
    title: 'When You Need Stillness',
    body: "The compass tab holds breathing exercises, grounding tools, The Night Sky, and The Garden of Life, two spaces built for rest and reflection.",
    type: 'nav',
    navHighlight: 4,
    iconBg: '#8E9775',
  },
  {
    tag: 'YOUR PROFILE',
    title: 'Your Sanctuary, Your Space',
    body: 'The profile tab is where you manage your account, view your supporter status, adjust notifications, and restart this tutorial any time.',
    type: 'nav',
    navHighlight: 0,
    iconBg: '#8E9775',
  },
  {
    tag: 'YOUR PATH BEGINS',
    title: "Let's get you started",
    body: "Tap the button below and we'll take you to the library. One journey will be waiting for you. Just tap it and your path begins.",
    type: 'nav',
    navHighlight: 3,
    iconBg: '#D4A373',
  },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

function MiniNav({ scanIdx, navHighlight, iconBg, scanning }) {
  return (
    <div className="w-full mb-8">
      <div className="bg-white rounded-[28px] py-4 px-5 border border-[#E9DCC9] shadow-sm flex items-end justify-between">
        {NAV_ITEMS.map((item, i) => {
          const NavIcon = item.icon;
          const activeIdx = scanning ? scanIdx : navHighlight;
          const isActive = i === activeIdx;
          const activeColor = scanning ? '#D4A373' : (iconBg || '#D4A373');

          return item.center ? (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1.5 -mt-5"
              initial={scanning ? { opacity: 0, y: 8 } : false}
              animate={scanning ? { opacity: 1, y: 0 } : {}}
              transition={scanning ? { delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 } : {}}
            >
              <motion.div
                animate={{
                  backgroundColor: isActive ? '#D4A373' : 'rgba(212,163,115,0.45)',
                  scale: isActive ? (scanning ? 1.1 : [1, 1.12, 1]) : 1,
                }}
                transition={
                  !scanning && isActive
                    ? { scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }, backgroundColor: { duration: 0.3 } }
                    : { duration: 0.3 }
                }
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md border-4 border-[#FDF9F3]"
              >
                <NavIcon size={20} color="white" strokeWidth={2} />
              </motion.div>
              <motion.span
                animate={{ color: isActive ? '#D4A373' : 'rgba(67,52,34,0.3)' }}
                transition={{ duration: 0.25 }}
                className="text-[9px] font-bold tracking-wide"
              >{item.label}</motion.span>
            </motion.div>
          ) : (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1.5"
              initial={scanning ? { opacity: 0, y: 8 } : false}
              animate={scanning ? { opacity: 1, y: 0 } : {}}
              transition={scanning ? { delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 } : {}}
            >
              {/* Pulse glow behind non-center highlighted icon */}
              <div className="relative flex items-center justify-center">
                {isActive && !scanning && (
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="absolute w-8 h-8 rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <motion.div
                  animate={
                    !scanning && isActive
                      ? { scale: [1, 1.18, 1] }
                      : { scale: scanning && isActive ? 1.15 : 1 }
                  }
                  transition={
                    !scanning && isActive
                      ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 400, damping: 20 }
                  }
                >
                  <NavIcon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    color={isActive ? activeColor : 'rgba(67,52,34,0.3)'}
                  />
                </motion.div>
              </div>
              <motion.span
                animate={{ color: isActive ? 'rgba(67,52,34,0.75)' : 'rgba(67,52,34,0.3)' }}
                transition={{ duration: 0.25 }}
                className="text-[9px] font-bold tracking-wide"
              >{item.label}</motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppTour({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);
  const [scanIdx, setScanIdx] = useState(0);

  // Cycle through nav icons on the "Getting Around" slide (navHighlight === null)
  useEffect(() => {
    const current = STEPS[step];
    if (current?.type !== 'nav' || current.navHighlight !== null) return;
    setScanIdx(0);
    const id = setInterval(() => setScanIdx(i => (i + 1) % NAV_ITEMS.length), 650);
    return () => clearInterval(id);
  }, [step]);

  const goNext = () => {
    if (step === STEPS.length - 1) { (onComplete || onClose)(); return; }
    setDir(1);
    setStep(s => s + 1);
  };

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isScanning = current.type === 'nav' && current.navHighlight === null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/50" onClick={onClose}>
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[301] bg-[#FDF9F3] rounded-t-[32px] font-sans text-[#433422] overflow-hidden"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#433422]/10 rounded-full mx-auto mt-4" />

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-5">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 28 : 10,
                backgroundColor: i === step ? '#D4A373' : '#E9DCC9',
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        {/* Sliding content */}
        <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 pt-6 pb-4"
            >
              {/* Welcome — logo orb, no nav */}
              {current.type === 'logo' && (
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute w-28 h-28 rounded-full" style={{ border: '1px solid rgba(212,163,115,0.2)', animation: 'orb-ring 3s ease-out infinite' }} />
                  <div className="absolute w-28 h-28 rounded-full" style={{ border: '1px solid rgba(212,163,115,0.15)', animation: 'orb-ring 3s ease-out 1s infinite' }} />
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-[#D4A373]/20" style={{ animation: 'orb-core 3s ease-in-out infinite' }}>
                    <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* All nav slides — scanning OR pulsing a specific tab */}
              {current.type === 'nav' && (
                <MiniNav
                  scanIdx={scanIdx}
                  navHighlight={current.navHighlight}
                  iconBg={current.iconBg}
                  scanning={isScanning}
                />
              )}

              <p className="text-[9px] font-bold tracking-[0.3em] text-[#D4A373] uppercase mb-3 text-center">
                {current.tag}
              </p>
              <h2 className="text-2xl font-serif text-[#433422] text-center mb-3 leading-snug">
                {current.title}
              </h2>
              <p className="text-sm text-[#433422]/60 leading-relaxed text-center">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-8 pb-10 pt-2 flex flex-col gap-3">
          <button
            onClick={onClose}
            className="text-[11px] font-bold tracking-[0.2em] text-[#433422]/30 text-center py-1 uppercase"
          >
            Skip Tour
          </button>
          <motion.button
            onClick={goNext}
            whileTap={{ scale: 0.97 }}
            className="w-full py-5 bg-[#D4A373] text-white rounded-[24px] font-serif text-lg flex items-center justify-center gap-2"
          >
            {isLast ? 'Choose Your Path →' : 'Next →'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
