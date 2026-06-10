import { useEffect, useRef, useState } from 'react';
import { ApplySCTheme, GetConfig, GetSongs, Logout } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import SettingsPopup from './SettingsPopup';
import SongItem, { SongItemHandle } from './SongItem';

interface Props {
  onLogout: () => void;
}

function scrollToFirstUnvoted(songs: main.Song[]) {
  const first = songs.find(s => s.currentVote === 0);
  if (first) {
    document.getElementById(`song-item-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export default function VotingPage({ onLogout }: Props) {
  const [songs, setSongs] = useState<main.Song[]>([]);
  const [challengeNumber, setChallengeNumber] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [storedTheme, setStoredTheme] = useState('system');
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const songRefs = useRef<Record<string, SongItemHandle>>({});

  // Track data-theme changes (set by applyTheme()) to keep isDark in sync.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
      ApplySCTheme(dark);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([GetSongs(), GetConfig()])
      .then(([state, cfg]) => {
        setSongs(state.songs);
        setChallengeNumber(state.challengeNumber);
        setAutoScroll(cfg.autoScrollToUnvoted);
        setStoredEmail(cfg.email ?? '');
        setStoredPassword(cfg.password ?? '');
        setStoredTheme(cfg.theme ?? 'system');
        if (cfg.autoScrollToUnvoted) {
          setTimeout(() => scrollToFirstUnvoted(state.songs), 150);
        }
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = (id: string) => {
    if (playingId && playingId !== id) {
      songRefs.current[playingId]?.pause();
    }
    setPlayingId(id);
  };

  const handleFinish = (id: string) => {
    const idx = songs.findIndex(s => s.id === id);
    const next = songs[idx + 1];
    if (next) {
      setPlayingId(next.id);
      setTimeout(() => songRefs.current[next.id]?.play(), 100);
    } else {
      setPlayingId(null);
    }
  };

  const handleVote = (id: string, points: number) => {
    setSongs(prev =>
      prev.map(s => (s.id === id ? main.Song.createFrom({ ...s, currentVote: points }) : s))
    );
  };

  const handleLogout = async () => {
    await Logout();
    onLogout();
  };

  if (loading) {
    return <div className="splash"><div className="splash-text">Loading songs…</div></div>;
  }

  if (error) {
    return (
      <div className="splash">
        <div className="splash-text error">{error}</div>
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  const voted = songs.filter(s => s.currentVote > 0).length;
  const total = songs.length;

  return (
    <div className="voting-page">
      <header className="voting-header">
        <div className="header-left">
          <span className="header-title">OSC Voting</span>
          <span className="header-challenge">Challenge #{challengeNumber}</span>
        </div>
        <div className="header-right">
          <span className="vote-progress">{voted}/{total} voted</span>
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4"/>
              <line x1="2" y1="8" x2="14" y2="8"/>
              <line x1="2" y1="12" x2="14" y2="12"/>
              <circle cx="10" cy="4" r="1.75" fill="currentColor" stroke="none"/>
              <circle cx="5" cy="8" r="1.75" fill="currentColor" stroke="none"/>
              <circle cx="11" cy="12" r="1.75" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>
      </header>
      {settingsOpen && (
        <SettingsPopup
          initialEmail={storedEmail}
          initialPassword={storedPassword}
          initialTheme={storedTheme}
          initialAutoScroll={autoScroll}
          onSave={(email, password, theme) => {
            setStoredEmail(email);
            setStoredPassword(password);
            setStoredTheme(theme);
            setSettingsOpen(false);
          }}
          onAutoScrollChange={(val) => {
            setAutoScroll(val);
            if (val) scrollToFirstUnvoted(songs);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <div className="song-list">
        {songs.map(song => (
          <SongItem
            key={song.id}
            song={song}
            isPlaying={playingId === song.id}
            isDark={isDark}
            onPlay={handlePlay}
            onFinish={handleFinish}
            onVote={handleVote}
            ref={el => {
              if (el) songRefs.current[song.id] = el;
              else delete songRefs.current[song.id];
            }}
          />
        ))}
      </div>
    </div>
  );
}
