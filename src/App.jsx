import { useState } from 'react';
import PrevailGateway from './pages/PrevailGateway';
import PrevailOnboarding from './pages/PrevailOnboarding';
import PrevailLogin from './pages/PrevailLogin';
import PrevailHome from './pages/PrevailHome';

function App() {
  const [page, setPage] = useState('gateway');
  const [fading, setFading] = useState(false);
  const [userName, setUserName] = useState('');
  const [hasAccount, setHasAccount] = useState(false);

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
        <PrevailOnboarding onComplete={(name) => { setUserName(name); navigate('home'); }} />
      )}
      {page === 'login' && (
        <PrevailLogin
          onBack={() => navigate('gateway')}
          onLogin={() => { setHasAccount(true); navigate('home'); }}
        />
      )}
      {page === 'home' && (
        <PrevailHome
          userName={userName}
          hasAccount={hasAccount}
          onUpdateName={(name) => setUserName(name)}
        />
      )}
    </div>
  );
}

export default App;
