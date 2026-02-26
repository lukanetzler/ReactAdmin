import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import PrevailGateway from './pages/PrevailGateway';
import PrevailOnboarding from './pages/PrevailOnboarding';
import PrevailLogin from './pages/PrevailLogin';
import PrevailHome from './pages/PrevailHome';

function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('gateway');
  const [fading, setFading] = useState(false);

  const navigate = (to) => {
    setFading(true);
    setTimeout(() => {
      setPage(to);
      setFading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF9F3' }}>
        <p style={{ color: '#433422', fontFamily: "'Playfair Display', serif" }}>Loading...</p>
      </div>
    );
  }

  if (user) {
    return <PrevailHome user={user} />;
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
        <PrevailOnboarding onComplete={() => { /* auth state change routes to home automatically */ }} />
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
