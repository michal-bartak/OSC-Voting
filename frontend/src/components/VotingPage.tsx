import { useEffect, useMemo, useRef, useState } from 'react';
import { AppName, GetConfig, GetSongs, Logout } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import BottomBar from './BottomBar';
import SettingsPopup from './SettingsPopup';
import SongItem, { SongItemHandle } from './SongItem';

export type SortOrder = 'id' | 'vote-desc' | 'vote-asc' | 'title';
export type LoopMode = 'none' | 'playlist' | 'song';

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
  const [isPaused, setIsPaused] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('id');
  const [loopMode, setLoopMode] = useState<LoopMode>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const [storedDisplayEmail, setStoredDisplayEmail] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [storedTheme, setStoredTheme] = useState('system');
  const [appTitle, setAppTitle] = useState('OSC Voting');
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const songRefs = useRef<Record<string, SongItemHandle>>({});

  const sortedSongs = useMemo(() => {
    const copy = [...songs];
    switch (sortOrder) {
      case 'vote-desc': return copy.sort((a, b) => b.currentVote - a.currentVote);
      case 'vote-asc':  return copy.sort((a, b) => a.currentVote - b.currentVote);
      case 'title':     return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:          return copy;
    }
  }, [songs, sortOrder]);

  const sortPositions = useMemo(() => {
    const map = new Map<string, number>();
    sortedSongs.forEach((s, i) => map.set(s.id, i));
    return map;
  }, [sortedSongs]);

  useEffect(() => { AppName().then(setAppTitle); }, []);

  // Track data-theme changes (set by applyTheme()) to keep isDark in sync.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
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
        setStoredDisplayEmail(cfg.displayEmail ?? '');
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
    setIsPaused(false);
  };

  // Single blur listener for all SoundCloud iframes (WebView2 workaround: SC Widget
  // PLAY events are unreliable; we detect iframe clicks via window blur instead).
  const handlePlayRef = useRef(handlePlay);
  handlePlayRef.current = handlePlay;
  useEffect(() => {
    const onBlur = () => {
      for (const [id, handle] of Object.entries(songRefs.current)) {
        if (handle.getIframe() === document.activeElement) {
          handlePlayRef.current(id);
          break;
        }
      }
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  const handleFinish = (id: string) => {
    if (loopMode === 'song') {
      setTimeout(() => songRefs.current[id]?.play(), 100);
      return;
    }
    const idx = sortedSongs.findIndex(s => s.id === id);
    const next = sortedSongs[idx + 1] ?? (loopMode === 'playlist' ? sortedSongs[0] : null);
    if (next && next.id !== id) {
      setPlayingId(next.id);
      setIsPaused(false);
      setTimeout(() => songRefs.current[next.id]?.play(), 100);
    } else if (loopMode === 'playlist' && next?.id === id) {
      // single-song playlist: replay it
      setTimeout(() => songRefs.current[id]?.play(), 100);
    } else {
      setPlayingId(null);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (!playingId) return;
    songRefs.current[playingId]?.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!playingId) return;
    songRefs.current[playingId]?.play();
    setIsPaused(false);
  };

  const handleStop = () => {
    if (playingId) songRefs.current[playingId]?.pause();
    setPlayingId(null);
    setIsPaused(false);
  };

  const handlePlayFirst = () => {
    const first = sortedSongs[0];
    if (!first) return;
    setPlayingId(first.id);
    setIsPaused(false);
    setTimeout(() => songRefs.current[first.id]?.play(), 100);
  };

  const handlePrev = () => {
    if (!playingId) return;
    const idx = sortedSongs.findIndex(s => s.id === playingId);
    const prev = sortedSongs[idx - 1];
    if (!prev) return;
    songRefs.current[playingId]?.pause();
    setPlayingId(prev.id);
    setIsPaused(false);
    setTimeout(() => songRefs.current[prev.id]?.play(), 100);
  };

  const handleNext = () => {
    if (!playingId) return;
    const idx = sortedSongs.findIndex(s => s.id === playingId);
    const next = sortedSongs[idx + 1];
    if (!next) return;
    songRefs.current[playingId]?.pause();
    setPlayingId(next.id);
    setIsPaused(false);
    setTimeout(() => songRefs.current[next.id]?.play(), 100);
  };

  const handleVote = (id: string, points: number) => {
    setSongs(prev =>
      prev.map(s => (s.id === id ? main.Song.createFrom({ ...s, currentVote: points }) : s))
    );
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(tag)) return;
      if (settingsOpen) return;
      e.preventDefault();
      if (!playingId && !isPaused) handlePlayFirst();
      else if (isPaused)           handleResume();
      else                         handlePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playingId, isPaused, sortedSongs, settingsOpen]);

  const handleJumpToFirstUnvoted = () => {
    const first = sortedSongs.find(s => s.currentVote === 0);
    if (first) {
      document.getElementById(`song-item-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleJumpToPlaying = () => {
    if (playingId) {
      document.getElementById(`song-item-${playingId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
  const currentIdx = playingId ? sortedSongs.findIndex(s => s.id === playingId) : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < sortedSongs.length - 1;
  const playingTitle = playingId ? (sortedSongs.find(s => s.id === playingId)?.title ?? null) : null;

  return (
    <div className="voting-page">
      <header className="voting-header">
        <div className="header-left">
          <span className="header-title">{appTitle}</span>
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
          initialDisplayEmail={storedDisplayEmail}
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
          <div key={song.id} style={{ order: sortPositions.get(song.id) ?? 0 }}>
            <SongItem
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
          </div>
        ))}
      </div>
      <BottomBar
        playingTitle={playingTitle}
        isPaused={isPaused}
        sortOrder={sortOrder}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPlay={isPaused ? handleResume : handlePlayFirst}
        onPause={handlePause}
        onStop={handleStop}
        onPrev={handlePrev}
        onNext={handleNext}
        onSortChange={setSortOrder}
        loopMode={loopMode}
        onLoopChange={setLoopMode}
        hasUnvoted={songs.some(s => s.currentVote === 0)}
        onJumpToFirstUnvoted={handleJumpToFirstUnvoted}
        onJumpToPlaying={playingId ? handleJumpToPlaying : null}
      />
    </div>
  );
}
