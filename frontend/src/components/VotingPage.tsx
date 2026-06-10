import { useEffect, useRef, useState } from 'react';
import { GetConfig, GetSongs, Logout } from '../../wailsjs/go/main/App';
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
  const songRefs = useRef<Record<string, SongItemHandle>>({});

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
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙</button>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
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
