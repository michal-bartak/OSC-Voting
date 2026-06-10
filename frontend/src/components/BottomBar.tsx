import { SortOrder } from './VotingPage';

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

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="2" y="2" width="10" height="10" rx="1.5"/>
  </svg>
);

export default function BottomBar({
  playingTitle, isPaused, sortOrder,
  hasPrev, hasNext,
  onPlay, onPause, onStop, onPrev, onNext, onSortChange,
}: BottomBarProps) {
  const isPlaying = !!playingTitle && !isPaused;

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
      </div>

      <div className="bar-divider" />

      <div className="now-playing">
        <span className="now-playing-label">Now playing</span>
        <span className={`now-playing-title${!playingTitle ? ' now-playing-title--empty' : ''}`}>
          {playingTitle ?? 'Nothing playing'}
        </span>
      </div>

      <div className="bar-divider" />

      <div className="sort-controls">
        <span className="sort-label">Sort</span>
        <select
          className="sort-select"
          value={sortOrder}
          onChange={e => onSortChange(e.target.value as SortOrder)}
        >
          <option value="id">Default</option>
          <option value="vote-desc">Votes ↓</option>
          <option value="vote-asc">Votes ↑</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>
    </div>
  );
}
