import { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { createUserWithEmailAndPassword, signInAnonymously, linkWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserProfile } from '../services/userProfile';
import { enrollSignupCards } from '../services/dailyPath';
import prayvailLogo from '../assets/prayvail-logo-blank.png';
import malePathImg from '../assets/male-path.png';
import femalePathImg from '../assets/female-path.png';

const TOTAL_PROGRESS_STEPS = 4;

const PrevailOnboarding = ({ onComplete, initialStep = 0, initialName = '' }) => {
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCreateAccount = async () => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      const firstName = name.trim().split(' ')[0];
      const isUpgrading = auth.currentUser?.isAnonymous;
      let uid;

      if (isUpgrading) {
        // Upgrade anonymous session in-place — UID and all Firestore data are preserved
        const credential = EmailAuthProvider.credential(email, password);
        const result = await linkWithCredential(auth.currentUser, credential);
        await updateProfile(result.user, { displayName: firstName });
        uid = result.user.uid;
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: firstName });
        uid = cred.user.uid;
      }

      createUserProfile(uid, { name: firstName, email }).catch(err =>
        console.error('Failed to create Firestore profile:', err)
      );
      // Only enrol signup cards for brand-new accounts, not upgrades
      if (!isUpgrading) {
        enrollSignupCards(uid).catch(err =>
          console.error('Failed to enrol signup cards:', err)
        );
      }
      nextStep();
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already in use.'
        : err.code === 'auth/credential-already-in-use' ? 'This email is already linked to another account.'
        : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : 'Something went wrong. Please try again.';
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    const interval = setInterval(() => setActiveImg(i => (i === 0 ? 1 : 0)), 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Splash ─────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDF9F3]">
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 bg-[#D4A373]/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="w-24 h-24 rounded-full border border-[#D4A373]/30 flex items-center justify-center relative mb-8 overflow-hidden">
            <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover animate-pulse" />
          </div>
          <h1 className="text-4xl font-serif tracking-[0.2em] text-[#433422] opacity-0 animate-fade-in-up">
            PRAYVAIL
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#D4A373] mt-4 opacity-0 animate-fade-in-up-delay">
            Mindfulness in Christ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans overflow-hidden relative">

      {/* Ambient glow */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#E9DCC9]/40 blur-3xl -z-10" />
      <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 rounded-full bg-[#D4A373]/5 blur-3xl -z-10" />

      {/* Header */}
      <header className="px-8 pt-12 pb-2 flex justify-between items-center flex-shrink-0">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="p-2 -ml-2 text-gray-400 hover:text-[#433422] transition-colors ease-out"
          >
            <ArrowLeft size={22} strokeWidth={1.5} />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="flex gap-1.5 items-center">
          {Array.from({ length: TOTAL_PROGRESS_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ease-out ${
                step >= i + 2 ? 'w-8 bg-[#D4A373]' : 'w-4 bg-[#E9DCC9]'
              }`}
            />
          ))}
        </div>

        {step < 4 ? (
          <button
            onClick={() => setStep(5)}
            className="text-[10px] font-bold tracking-widest text-[#433422]/30 hover:text-[#433422]/70 transition-colors ease-out"
          >
            SKIP
          </button>
        ) : (
          <div className="w-9" />
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="pt-8 pb-6" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
              <span className="text-[10px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-4 block">
                The Invitation
              </span>
              <h2 className="text-5xl font-serif leading-[1.1] mb-5">
                Find your{' '}
                <span className="italic text-[#D4A373]">sacred</span>{' '}
                center.
              </h2>
              <p className="text-base text-gray-400 leading-relaxed max-w-[75%]">
                Where ancient scripture meets present stillness.
              </p>
            </div>

            <div className="flex-1 relative" style={{ marginLeft: '10%', marginRight: '10%' }}>
              {/* Arched horizon panel */}
              <div className="absolute inset-0 rounded-t-[60px] overflow-hidden">
                <img src={malePathImg} alt="A path" className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ease-in-out ${activeImg === 0 ? 'opacity-100 blur-none' : 'opacity-0 blur-lg'}`} />
                <img src={femalePathImg} alt="A path" className={`absolute inset-0 w-full h-full object-cover transition-all duration-[4000ms] ease-in-out ${activeImg === 1 ? 'opacity-100 blur-none' : 'opacity-0 blur-lg'}`} />
              </div>
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <PrimaryButton onClick={nextStep} label="BEGIN YOUR PATH" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Name ── */}
        {step === 2 && (
          <div className="pt-8 animate-fade-in" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-4 block">
              Your Name
            </span>
            <h2 className="text-4xl font-serif mb-10 leading-tight">
              Who are we seeking <br />peace for today?
            </h2>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name..."
              autoFocus
              className="w-full bg-transparent border-b-2 border-[#E9DCC9] py-5 text-3xl font-serif focus:border-[#D4A373] focus:outline-none transition-all ease-out placeholder:text-[#E9DCC9] caret-[#D4A373]"
            />

            <p className="mt-6 text-gray-400 text-xs italic leading-relaxed">
              "I have called you by name; you are mine." — Isaiah 43:1
            </p>

            <div
              className={`mt-10 flex justify-center transition-all duration-500 ease-out ${
                name.length > 2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <PrimaryButton
                onClick={nextStep}
                label={`CONTINUE, ${name.trim().split(' ')[0].toUpperCase()}`}
                color="terracotta"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Founders Note ── */}
        {step === 3 && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="pt-8 pb-6" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
              <span className="text-[10px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-4 block">
                From Us
              </span>
              <h2 className="text-4xl font-serif leading-tight">
                A note from <br />the founders.
              </h2>
            </div>

            {/* Blank — content to be added */}
            <div className="flex-1 relative" style={{ marginLeft: '10%', marginRight: '10%' }}>
              <div className="absolute inset-0 bg-[#F4EFE6] rounded-t-[60px] overflow-hidden" />
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <PrimaryButton onClick={nextStep} label="I'M READY" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Account ── */}
        {step === 4 && (
          <div className="pt-8 animate-fade-in" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-4 block">
              Your Journey
            </span>
            <h2 className="text-4xl font-serif mb-3 leading-tight">Save your progress.</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              A free account keeps your sanctuary safe across devices.
            </p>

            <div className="space-y-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-[#F4EFE6] rounded-2xl px-5 py-4 text-sm border-b-2 border-transparent focus:border-[#D4A373] focus:outline-none transition-all ease-out placeholder:text-gray-400/60"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-[#F4EFE6] rounded-2xl px-5 py-4 text-sm border-b-2 border-transparent focus:border-[#D4A373] focus:outline-none transition-all ease-out placeholder:text-gray-400/60"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs mb-4 text-center">{authError}</p>
            )}

            <div className="flex flex-col gap-4">
              <PrimaryButton
                onClick={handleCreateAccount}
                label={isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}
                fullWidth
                disabled={isSubmitting}
              />
              {auth.currentUser?.isAnonymous ? (
                <button
                  onClick={() => onComplete('')}
                  className="w-full text-sm font-bold tracking-[0.2em] text-gray-400 border border-[#E9DCC9] rounded-[32px] px-10 py-4 hover:border-gray-300 hover:text-[#433422] transition-all ease-out"
                >
                  MAYBE LATER
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const { user: anonUser } = await signInAnonymously(auth);
                      const firstName = name.trim().split(' ')[0];
                      if (firstName) {
                        await updateProfile(anonUser, { displayName: firstName });
                      }
                    } catch (err) {
                      console.error('Anonymous sign-in failed:', err);
                    }
                    nextStep();
                  }}
                  className="w-full text-sm font-bold tracking-[0.2em] text-gray-400 border border-[#E9DCC9] rounded-[32px] px-10 py-4 hover:border-gray-300 hover:text-[#433422] transition-all ease-out"
                >
                  CONTINUE WITHOUT AN ACCOUNT
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 5: Ready ── */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
            <div className="w-20 h-20 bg-[#8E9775]/10 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-[#8E9775]/15 rounded-full animate-ping" />
              <Check className="text-[#8E9775]" size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-serif mb-4 leading-tight">
              Your sanctuary <br />is ready.
            </h2>
            <p className="text-gray-400 mb-12 text-sm leading-relaxed max-w-[65%]">
              "Peace I leave with you; my peace I give you." — John 14:27
            </p>
            <PrimaryButton onClick={() => onComplete(name.trim().split(' ')[0])} label="ENTER PRAYVAIL" color="terracotta" />
          </div>
        )}

      </main>
    </div>
  );
};

// ── Shared CTA button ──────────────────────────────────────
const PrimaryButton = ({ onClick, label, color = 'earth', fullWidth = false, disabled = false }) => {
  const isEarth = color === 'earth';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'flex w-full' : 'inline-flex'} items-center justify-center gap-4
        px-10 py-4 rounded-[32px]
        font-bold text-sm tracking-[0.2em] whitespace-nowrap
        transition-all ease-out duration-300
        hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${isEarth
          ? 'bg-[#433422] text-[#FDF9F3] shadow-[0_10px_36px_-6px_rgba(67,52,34,0.4)] hover:shadow-[0_14px_44px_-6px_rgba(67,52,34,0.5)]'
          : 'bg-[#D4A373] text-white shadow-[0_10px_36px_-6px_rgba(212,163,115,0.45)] hover:shadow-[0_14px_44px_-6px_rgba(212,163,115,0.6)]'
        }
      `}
    >
      {label}
      <ArrowRight size={16} strokeWidth={2.5} />
    </button>
  );
};

export default PrevailOnboarding;
