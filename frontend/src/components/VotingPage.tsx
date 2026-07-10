import { useEffect, useMemo, useRef, useState } from 'react';
import { AppName, AppVersion, GetConfig, GetSongs, Logout, NotifyNearEnd, SaveWindowSize, SubmitVote, UpdateNotificationsEnabled, UpdateNotificationSkipVoted, UpdateNotificationThreshold } from '../../wailsjs/go/main/App';
import { EventsOn, WindowGetSize } from '../../wailsjs/runtime/runtime';
import { main } from '../../wailsjs/go/models';
import AboutPopup from './AboutPopup';
import BottomBar from './BottomBar';
import SettingsPopup from './SettingsPopup';
import SongItem, { SongItemHandle, PlayerSize } from './SongItem';
import { resolveSpaceAction } from '../lib/spaceShortcut';

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
  const [followPlayback, setFollowPlayback] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [storedEmail, setStoredEmail] = useState('');
  const [storedDisplayEmail, setStoredDisplayEmail] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [storedTheme, setStoredTheme] = useState('system');
  const [playerSize, setPlayerSize] = useState<PlayerSize>('large');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationThreshold, setNotificationThreshold] = useState(80);
  const [notificationSkipVoted, setNotificationSkipVoted] = useState(false);
  const [appTitle, setAppTitle] = useState('OSC Voting');
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const songRefs = useRef<Record<string, SongItemHandle>>({});
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(null);
  const hoverEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  useEffect(() => { AppVersion().then(setAppVersion); }, []);

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
        setAutoScroll(cfg.autoScrollToUnvoted ?? true);
        setFollowPlayback(cfg.followPlayback ?? true);
        setStoredEmail(cfg.email ?? '');
        setStoredDisplayEmail(cfg.displayEmail ?? '');
        setStoredPassword(cfg.password ?? '');
        setStoredTheme(cfg.theme ?? 'system');
        setPlayerSize((cfg.playerSize as PlayerSize) ?? 'large');
        setNotificationsEnabled(cfg.notificationsEnabled ?? true);
        setNotificationThreshold(cfg.notificationThreshold ?? 80);
        setNotificationSkipVoted(cfg.notificationSkipVoted ?? false);
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

  const followPlaybackRef = useRef(followPlayback);
  followPlaybackRef.current = followPlayback;

  // Single blur listener for all SoundCloud iframes (WebView2 workaround: SC Widget
  // PLAY events are unreliable; we detect iframe clicks via window blur instead).
  const handlePlayRef = useRef(handlePlay);
  handlePlayRef.current = handlePlay;
  useEffect(() => {
    const onBlur = () => {
      // reset sticky hover: mouseOut/mouseLeave don't fire once the window loses focus
      if (hoverEnterTimer.current) { clearTimeout(hoverEnterTimer.current); hoverEnterTimer.current = null; }
      if (hoverClearTimer.current) { clearTimeout(hoverClearTimer.current); hoverClearTimer.current = null; }
      setHoveredSongId(null);

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
      setTimeout(() => songRefs.current[id]?.playFromStart(), 100);
      return;
    }
    const idx = sortedSongs.findIndex(s => s.id === id);
    const next = sortedSongs[idx + 1] ?? (loopMode === 'playlist' ? sortedSongs[0] : null);
    if (next && next.id !== id) {
      setPlayingId(next.id);
      setIsPaused(false);
      setTimeout(() => songRefs.current[next.id]?.playFromStart(), 100);
      if (followPlaybackRef.current) {
        document.getElementById(`song-item-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (loopMode === 'playlist' && next?.id === id) {
      // single-song playlist: replay it
      setTimeout(() => songRefs.current[id]?.playFromStart(), 100);
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

  const handleEmbedPause = (id: string) => {
    if (id !== playingId) return;
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
    setTimeout(() => songRefs.current[first.id]?.playFromStart(), 100);
  };

  const handlePrev = () => {
    if (!playingId) return;
    const idx = sortedSongs.findIndex(s => s.id === playingId);
    const prev = sortedSongs[idx - 1];
    if (!prev) return;
    songRefs.current[playingId]?.pause();
    setPlayingId(prev.id);
    setIsPaused(false);
    setTimeout(() => songRefs.current[prev.id]?.playFromStart(), 100);
  };

  const handleNext = () => {
    if (!playingId) return;
    const idx = sortedSongs.findIndex(s => s.id === playingId);
    const next = sortedSongs[idx + 1];
    if (!next) return;
    songRefs.current[playingId]?.pause();
    setPlayingId(next.id);
    setIsPaused(false);
    setTimeout(() => songRefs.current[next.id]?.playFromStart(), 100);
  };

  const handleVote = (id: string, points: number) => {
    setSongs(prev =>
      prev.map(s => (s.id === id ? main.Song.createFrom({ ...s, currentVote: points }) : s))
    );
  };

  const handleNearEnd = (id: string) => {
    if (!notificationsEnabled) return;
    const song = songs.find(s => s.id === id);
    if (!song) return;
    if (notificationSkipVoted && song.currentVote > 0) return;
    NotifyNearEnd(id, song.title, song.currentVote).catch(() => {});
  };

  useEffect(() => {
    return EventsOn('notification:vote', (songId: string, actionId: string) => {
      const points = parseInt(actionId, 10);
      if (points >= 1 && points <= 5) {
        handleVote(songId, points);
        SubmitVote(songId, points).catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const action = resolveSpaceAction({
        target: e.target,
        settingsOpen,
        aboutOpen,
        playingId,
        isPaused,
      });
      if (action === 'none') return;
      // preventDefault also cancels the native activation of a focused button,
      // so SPACE resolves to play/pause no matter which button holds focus.
      e.preventDefault();
      // Pressing SPACE switches the browser into keyboard-focus modality, which
      // would paint a focus ring on whatever button was last clicked with the
      // mouse (Loop, Next, a vote button, ...). Drop focus off a focused button
      // so the shortcut never leaves a lingering outline. Tab-based navigation is
      // unaffected: Tab still focuses the button and shows the ring.
      const active = document.activeElement as HTMLElement | null;
      if (active && active.tagName === 'BUTTON') active.blur();
      if (action === 'playFirst')    handlePlayFirst();
      else if (action === 'resume')  handleResume();
      else                           handlePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playingId, isPaused, sortedSongs, settingsOpen, aboutOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        WindowGetSize().then(({ w, h }) => SaveWindowSize(w, h));
      }, 500);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, []);

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
          <button className="settings-btn" onClick={() => setAboutOpen(true)} title="About">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5"/>
              <line x1="8" y1="7" x2="8" y2="11.5"/>
              <circle cx="8" cy="4.5" r="0.75" fill="currentColor" stroke="none"/>
            </svg>
          </button>
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
      {aboutOpen && (
        <AboutPopup version={appVersion} onClose={() => setAboutOpen(false)} />
      )}
      {settingsOpen && (
        <SettingsPopup
          initialEmail={storedEmail}
          initialDisplayEmail={storedDisplayEmail}
          initialPassword={storedPassword}
          initialTheme={storedTheme}
          initialAutoScroll={autoScroll}
          initialFollowPlayback={followPlayback}
          initialPlayerSize={playerSize}
          initialNotificationsEnabled={notificationsEnabled}
          initialNotificationThreshold={notificationThreshold}
          initialNotificationSkipVoted={notificationSkipVoted}
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
          onFollowPlaybackChange={(val) => setFollowPlayback(val)}
          onPlayerSizeChange={(size) => setPlayerSize(size as PlayerSize)}
          onNotificationsEnabledChange={(val) => setNotificationsEnabled(val)}
          onNotificationThresholdChange={(val) => setNotificationThreshold(val)}
          onNotificationSkipVotedChange={(val) => setNotificationSkipVoted(val)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <div
        className="song-list"
        onMouseOver={e => {
          const actions = (e.target as Element).closest('.song-actions');
          if (!actions) return;
          if (hoverEnterTimer.current) { clearTimeout(hoverEnterTimer.current); hoverEnterTimer.current = null; }
          const itemEl = actions.closest('[id^="song-item-"]');
          if (!itemEl) return;
          const id = itemEl.id.replace('song-item-', '');
          hoverEnterTimer.current = setTimeout(() => {
            hoverEnterTimer.current = null;
            if (hoverClearTimer.current) { clearTimeout(hoverClearTimer.current); hoverClearTimer.current = null; }
            setHoveredSongId(id);
          }, 150);
        }}
        onMouseOut={e => {
          if (!(e.target as Element).closest('.song-actions')) return;
          if ((e.relatedTarget as Element | null)?.closest('.song-actions')) return;
          if (hoverEnterTimer.current) { clearTimeout(hoverEnterTimer.current); hoverEnterTimer.current = null; }
          hoverClearTimer.current = setTimeout(() => { hoverClearTimer.current = null; setHoveredSongId(null); }, 150);
        }}
        onMouseLeave={() => {
          if (hoverEnterTimer.current) { clearTimeout(hoverEnterTimer.current); hoverEnterTimer.current = null; }
          if (hoverClearTimer.current) { clearTimeout(hoverClearTimer.current); hoverClearTimer.current = null; }
          setHoveredSongId(null);
        }}
      >
        {songs.map(song => (
          <div key={song.id} style={{ order: sortPositions.get(song.id) ?? 0 }}>
            <SongItem
              song={song}
              isPlaying={playingId === song.id}
              isDark={isDark}
              playerSize={playerSize}
              isOtherActive={hoveredSongId !== null && hoveredSongId !== song.id}
              onPlay={handlePlay}
              onPause={handleEmbedPause}
              onFinish={handleFinish}
              onVote={handleVote}
              onNearEnd={handleNearEnd}
              nearEndThreshold={notificationThreshold / 100}
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
