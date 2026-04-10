import { useState, useEffect, useRef } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { migrateGuestDataIfNeeded } from './services/migrateGuest';
import prayvailLogo from './assets/prayvail-logo-blank.png';
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
  }, [user, loading]);

  const [fading, setFading] = useState(false);
  const navigate = (to) => {
    setFading(true);
    setTimeout(() => { setPage(to); setFading(false); }, 500);
  };

  if ((loading || (user && profileLoading)) && page !== 'onboarding') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: '#FDF9F3' }}>
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-[#D4A373]/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-20 h-20 rounded-full bg-[#D4A373]/15 animate-pulse" />
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#D4A373]/30 relative z-10">
            <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p style={{ fontFamily: "'Playfair Display', serif", color: '#433422', fontSize: '1.25rem', letterSpacing: '0.15em' }}>PRAYVAIL</p>
          <p style={{ color: '#D4A373', fontSize: '0.65rem', letterSpacing: '0.35em', fontWeight: 700 }}>GETTING YOUR SANCTUARY READY</p>
        </div>
      </div>
    );
  }

  if (onboardingComplete || (user && page !== 'onboarding')) {
    if (showAdmin) {
      return <AdminDashboard user={user} profile={profile} profileUnsubRef={profileUnsubRef} onBack={() => setShowAdmin(false)} />;
    }
    return <PrevailHome user={user} guestName={guestName} profile={profile} profileUnsubRef={profileUnsubRef} onOpenAdmin={() => setShowAdmin(true)} onGoToAuth={async () => { if (user?.isAnonymous) await signOut(auth); setOnboardingComplete(false); setPage('gateway'); }} />;
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
        <PrevailOnboarding onComplete={(name) => { if (name) setGuestName(name); setOnboardingComplete(true); }} />
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
