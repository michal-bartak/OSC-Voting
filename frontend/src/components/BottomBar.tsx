import { useEffect, useRef, useState } from 'react';
import { LoopMode, SortOrder } from './VotingPage';

interface BottomBarProps {
  playingTitle: string | null;
  isPaused: boolean;
  sortOrder: SortOrder;
  hasPrev: boolean;
  hasNext: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSortChange: (o: SortOrder) => void;
  loopMode: LoopMode;
  onLoopChange: (m: LoopMode) => void;
  hasUnvoted: boolean;
  onJumpToFirstUnvoted: () => void;
  onJumpToPlaying: (() => void) | null;
}

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="3" width="2" height="10" rx="1"/>
    <path d="M13 3.5a1 1 0 0 0-1.6-.8L5 7.2a1 1 0 0 0 0 1.6l6.4 4.5a1 1 0 0 0 1.6-.8V3.5z"/>
  </svg>
);

const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="12" y="3" width="2" height="10" rx="1"/>
    <path d="M3 3.5a1 1 0 0 1 1.6-.8L11 7.2a1 1 0 0 1 0 1.6L4.6 13.3A1 1 0 0 1 3 12.5V3.5z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 3.5a1 1 0 0 1 1.5-.87l8 4.5a1 1 0 0 1 0 1.74l-8 4.5A1 1 0 0 1 4 12.5V3.5z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="3" width="4" height="10" rx="1.5"/>
    <rect x="9" y="3" width="4" height="10" rx="1.5"/>
  </svg>
);

const LOOP_CYCLE: LoopMode[] = ['none', 'playlist', 'song'];

const LOOP_TITLES: Record<LoopMode, string> = {
  none: 'Loop: off',
  playlist: 'Loop: playlist',
  song: 'Loop: current song',
};

const LoopIcon = ({ mode }: { mode: LoopMode }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 11V6.5A2.5 2.5 0 0 1 4.5 4H12"/>
    <polyline points="10,2 12,4 10,6"/>
    <path d="M14 5v4.5A2.5 2.5 0 0 1 11.5 12H4"/>
    <polyline points="6,10 4,12 6,14"/>
    {mode === 'song' && (
      <>
        <circle cx="13" cy="13" r="4" fill="var(--bg-header)" stroke="none"/>
        <text x="13" y="16.2" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">1</text>
      </>
    )}
  </svg>
);

const JumpUnvotedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="8" cy="8" r="4.5"/>
    <line x1="8" y1="1" x2="8" y2="4"/>
    <line x1="8" y1="12" x2="8" y2="15"/>
    <line x1="1" y1="8" x2="4" y2="8"/>
    <line x1="12" y1="8" x2="15" y2="8"/>
    <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>
  </svg>
);

const JumpPlayingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1.5" y="6" width="3" height="8" rx="1"/>
    <rect x="6.5" y="2" width="3" height="12" rx="1"/>
    <rect x="11.5" y="4" width="3" height="9" rx="1"/>
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="2" y="2" width="10" height="10" rx="1.5"/>
  </svg>
);

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'id', label: 'Default' },
  { value: 'vote-desc', label: 'Votes ↓' },
  { value: 'vote-asc', label: 'Votes ↑' },
  { value: 'title', label: 'Title A–Z' },
];

export default function BottomBar({
  playingTitle, isPaused, sortOrder,
  hasPrev, hasNext,
  onPlay, onPause, onStop, onPrev, onNext, onSortChange,
  loopMode, onLoopChange,
  hasUnvoted, onJumpToFirstUnvoted, onJumpToPlaying,
}: BottomBarProps) {
  const isPlaying = !!playingTitle && !isPaused;
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOrder)?.label ?? 'Default';

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  return (
    <div className="bottom-bar">
      <div className="transport-controls">
        <button className="transport-btn" onClick={onPrev} disabled={!hasPrev} title="Previous">
          <PrevIcon />
        </button>
        <button
          className="transport-btn transport-btn--play-pause"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="transport-btn" onClick={onStop} disabled={!playingTitle} title="Stop">
          <StopIcon />
        </button>
        <button className="transport-btn" onClick={onNext} disabled={!hasNext} title="Next">
          <NextIcon />
        </button>
        <button
          className={`transport-btn${loopMode !== 'none' ? ' transport-btn--loop-active' : ''}`}
          onClick={() => onLoopChange(LOOP_CYCLE[(LOOP_CYCLE.indexOf(loopMode) + 1) % 3])}
          title={LOOP_TITLES[loopMode]}
        >
          <LoopIcon mode={loopMode} />
        </button>
      </div>

      <div className="bar-divider" />

      <div className="now-playing">
        <span className="now-playing-label">Now playing</span>
        <span className={`now-playing-title${!playingTitle ? ' now-playing-title--empty' : ''}`}>
          {playingTitle ?? 'Nothing playing'}
        </span>
      </div>

      <div className="bar-divider" />

      <div className="jump-controls">
        <button className="transport-btn" onClick={onJumpToFirstUnvoted} disabled={!hasUnvoted} title="Jump to first unvoted">
          <JumpUnvotedIcon />
        </button>
        <button className="transport-btn" onClick={onJumpToPlaying ?? undefined} disabled={!onJumpToPlaying} title="Jump to currently playing">
          <JumpPlayingIcon />
        </button>
      </div>

      <div className="bar-divider" />

      <div className="sort-controls" ref={sortRef}>
        <span className="sort-label">Sort</span>
        <div className="sort-dropdown">
          <button
            type="button"
            className="sort-select"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen(open => !open)}
          >
            {currentSortLabel}
          </button>
          {sortOpen && (
            <ul className="sort-dropdown-menu" role="listbox">
              {SORT_OPTIONS.map(option => (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={sortOrder === option.value}
                    className={`sort-dropdown-item${sortOrder === option.value ? ' sort-dropdown-item--active' : ''}`}
                    onClick={() => {
                      onSortChange(option.value);
                      setSortOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
