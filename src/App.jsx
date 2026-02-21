import { useState } from 'react';
import PrevailGateway from './pages/PrevailGateway';
import PrevailOnboarding from './pages/PrevailOnboarding';
import PrevailLogin from './pages/PrevailLogin';
import PrevailHome from './pages/PrevailHome';

function App() {
  const [page, setPage] = useState('gateway');
  const [fading, setFading] = useState(false);

  const navigate = (to) => {
    setFading(true);
    setTimeout(() => {
      setPage(to);
      setFading(false);
    }, 500);
  };

  return (
    <div className={`transition-opacity duration-500 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}>
      {page === 'gateway' && (
        <PrevailGateway
          onBeginWalk={() => navigate('onboarding')}
          onEnterSanctuary={() => navigate('login')}
        />
      )}
      {page === 'onboarding' && (
        <PrevailOnboarding onComplete={() => navigate('home')} />
      )}
      {page === 'login' && (
        <PrevailLogin
          onBack={() => navigate('gateway')}
          onLogin={() => navigate('home')}
        />
      )}
      {page === 'home' && <PrevailHome />}
    </div>
  );
}

export default App;
