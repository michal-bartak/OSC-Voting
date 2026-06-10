import { useEffect, useState } from 'react';
import { GetConfig, IsLoggedIn, Login } from '../wailsjs/go/main/App';
import LoginPage from './components/LoginPage';
import VotingPage from './components/VotingPage';
import { applyTheme } from './theme';
import './App.css';

type Page = 'loading' | 'login' | 'voting';

function App() {
  const [page, setPage] = useState<Page>('loading');
  const [loginHint, setLoginHint] = useState<{ email?: string; error?: string }>({});

  useEffect(() => {
    IsLoggedIn().then(async ok => {
      const cfg = await GetConfig().catch(() => null);
      applyTheme(cfg?.theme ?? 'system');

      if (ok) { setPage('voting'); return; }

      // Session expired or missing — try stored credentials before showing login form.
      try {
        if (cfg?.email && cfg?.password) {
          await Login(cfg.email, cfg.password);
          setPage('voting');
          return;
        }
        setLoginHint({ email: cfg?.email });
      } catch {
        setLoginHint({
          email: cfg?.email,
          error: 'Session expired — please re-enter your password.',
        });
      }
      setPage('login');
    }).catch(() => setPage('login'));
  }, []);

  if (page === 'loading') {
    return (
      <div className="splash">
        <div className="splash-text">Connecting…</div>
      </div>
    );
  }

  if (page === 'login') {
    return (
      <LoginPage
        onSuccess={() => setPage('voting')}
        initialEmail={loginHint.email}
        initialError={loginHint.error}
      />
    );
  }

  return <VotingPage onLogout={() => setPage('login')} />;
}

export default App;
