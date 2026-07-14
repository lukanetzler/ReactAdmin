import { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { migrateGuestDataIfNeeded } from './services/migrateGuest';
import { initializePurchases } from './services/purchases';
import prayvailLogo from './assets/prayvail-logo-blank.webp';
import PrevailGateway from './pages/PrevailGateway';
import PrevailOnboarding from './pages/PrevailOnboarding';
import PrevailLogin from './pages/PrevailLogin';
import PrevailHome from './pages/PrevailHome';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('gateway');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const profileUnsubRef = useRef(null);

  // Listen to user profile in Firestore — drives role-based routing
  useEffect(() => {
    if (profileUnsubRef.current) profileUnsubRef.current();
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setProfileLoading(false);
    }, () => {
      setProfileLoading(false);
    });
    profileUnsubRef.current = unsub;
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      setPage('gateway');
      setOnboardingComplete(false);
    }
    if (user && !user.isAnonymous) {
      migrateGuestDataIfNeeded(user.uid).catch(() => {});
    }
    // Initialize RevenueCat with the Firebase UID so purchases are linked to the account
    if (user) {
      initializePurchases(user.uid).catch(() => {});
    }
  }, [user, loading]);

  const [fading, setFading] = useState(false);
  const navigate = (to) => {
    setFading(true);
    setTimeout(() => { setPage(to); setFading(false); }, 500);
  };

  if ((loading || (user && profileLoading)) && page !== 'onboarding') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#FDF9F3' }}>
        <div className="w-16 h-16 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(212,163,115,0.25)' }}>
          <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p style={{ fontFamily: "'Playfair Display', serif", color: '#433422', fontSize: '1.1rem', letterSpacing: '0.15em' }}>PRAYVAIL</p>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%', backgroundColor: '#D4A373',
                animation: 'breathe 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.22}s`,
                opacity: 0.5,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (onboardingComplete || (user && page !== 'onboarding')) {
    if (showAdmin) {
      return <AdminDashboard user={user} profile={profile} profileUnsubRef={profileUnsubRef} onBack={() => setShowAdmin(false)} />;
    }
    return <PrevailHome user={user} guestName={guestName} profile={profile} profileUnsubRef={profileUnsubRef} onOpenAdmin={() => setShowAdmin(true)} onGoToAuth={async () => { if (user?.isAnonymous) await signOut(auth); setOnboardingComplete(false); setPage('gateway'); }} onGoToSignUp={() => { if (user?.isAnonymous) { setOnboardingInitialStep(4); setOnboardingComplete(false); setPage('onboarding'); } else { setOnboardingComplete(false); setPage('gateway'); } }} />;
  }

  return (
    <div className={`transition-opacity duration-500 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}>
      {page === 'gateway' && (
        <PrevailGateway
          onBeginWalk={() => navigate('onboarding')}
          onEnterSanctuary={() => navigate('login')}
        />
      )}
      {page === 'onboarding' && (
        <PrevailOnboarding onComplete={(name) => { if (name) setGuestName(name); setOnboardingComplete(true); setOnboardingInitialStep(0); }} initialStep={onboardingInitialStep} initialName={onboardingInitialStep === 4 ? (guestName || user?.displayName || '') : ''} />
      )}
      {page === 'login' && (
        <PrevailLogin
          onBack={() => navigate('gateway')}
          onLogin={() => { /* auth state change routes to home automatically */ }}
        />
      )}
    </div>
  );
}

export default App;
