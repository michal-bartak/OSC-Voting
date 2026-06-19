import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { OpenCommentInBrowser, SubmitVote } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { SCWidget } from '../types';

export type PlayerSize = 'minimal' | 'medium' | 'large';

const PLAYER_HEIGHT: Record<PlayerSize, number> = {
  minimal: 20,
  medium: 95,
  large: 120,
};

interface Props {
  song: main.Song;
  isPlaying: boolean;
  isDark: boolean;
  playerSize?: PlayerSize;
  isOtherActive?: boolean;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  onFinish: (id: string) => void;
  onVote: (id: string, points: number) => void;
}

export interface SongItemHandle {
  play(): void;
  playFromStart(): void;
  pause(): void;
  getIframe(): HTMLIFrameElement | null;
}

const SongItem = forwardRef<SongItemHandle, Props>(
  ({ song, isPlaying, isDark, playerSize = 'large', isOtherActive, onPlay, onPause, onFinish, onVote }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const widgetRef = useRef<SCWidget | null>(null);
    const positionRef = useRef(0);
    const onPlayRef = useRef(onPlay);
    onPlayRef.current = onPlay;
    const onPauseRef = useRef(onPause);
    onPauseRef.current = onPause;
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;
    const [voteError, setVoteError] = useState('');
    const [voting, setVoting] = useState(false);
    const prevVoteRef = useRef(song.currentVote);
    const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [scTitle, setScTitle] = useState<string | null>(null);
    const [scAuthor, setScAuthor] = useState<string | null>(null);
    const [descOpen, setDescOpen] = useState(false);
    const [nearViewport, setNearViewport] = useState(false);

    // Only load the SC iframe when the song is near the viewport.
    // Keeps the number of live SoundCloud players (and their postMessage traffic) small.
    const showIframe = nearViewport || isPlaying;

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setNearViewport(true);
            observer.disconnect(); // loaded once, never unload
          }
        },
        { rootMargin: '300px 0px' },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    useImperativeHandle(ref, () => ({
      play()          { widgetRef.current?.play(); },
      playFromStart() { positionRef.current = 0; widgetRef.current?.play(); },
      pause()         { widgetRef.current?.pause(); },
      getIframe()     { return iframeRef.current; },
    }));

    const handleIframeLoad = () => {
      if (!iframeRef.current || !window.SC) return;
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      positionRef.current = 0;

      widget.bind(window.SC.Widget.Events.PLAY,   () => onPlayRef.current(song.id));
      widget.bind(window.SC.Widget.Events.PAUSE,  () => onPauseRef.current(song.id));
      widget.bind(window.SC.Widget.Events.FINISH, () => onFinishRef.current(song.id));
      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: unknown) => {
        const d = data as { currentPosition?: number };
        if (typeof d?.currentPosition === 'number') {
          positionRef.current = d.currentPosition;
        }
      });
      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.getCurrentSound(sound => {
          const raw = sound?.artwork_url ?? sound?.user?.avatar_url ?? null;
          setArtworkUrl(raw ? raw.replace('-large', '-t200x200') : null);
          setDescription(sound?.description?.trim() || null);
          setScTitle(sound?.title?.trim() || null);
          setScAuthor(sound?.user?.username?.trim() || null);
        });
      });
    };

    useEffect(() => {
      if (!isPlaying) {
        widgetRef.current?.pause();
      }
    }, [isPlaying]);

    useEffect(() => {
      if (!descOpen) return;
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDescOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [descOpen]);

    // WebKit compositing fix: when filter is added/removed, the iframe's
    // compositing layer may retain stale edge pixels. A translateZ(0) toggle
    // forces WebKit to flush the layer.
    useEffect(() => {
      const wrap = iframeRef.current?.parentElement as HTMLElement | null;
      if (!wrap) return;
      wrap.style.transform = 'translateZ(0)';
      const id = requestAnimationFrame(() => { wrap.style.transform = ''; });
      return () => cancelAnimationFrame(id);
    }, [isDark]);

    const handleVote = async (points: number) => {
      if (voting) return;
      const prev = prevVoteRef.current;
      const newPoints = prev === points ? 0 : points;
      prevVoteRef.current = newPoints;
      onVote(song.id, newPoints);
      setVoteError('');
      setVoting(true);
      try {
        await SubmitVote(song.id, newPoints);
      } catch {
        prevVoteRef.current = prev;
        onVote(song.id, prev);
        setVoteError('Failed to save vote');
        setTimeout(() => setVoteError(''), 3000);
      } finally {
        setVoting(false);
      }
    };

    const handleComment = () => {
      OpenCommentInBrowser(song.soundCloudUrl, Math.round(positionRef.current));
    };

    const embedUrl =
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundCloudUrl)}` +
      `&auto_play=false&hide_related=true&show_comments=false` +
      `&show_user=true&show_reposts=false&visual=false&color=%23888888&show_artwork=false`;

    const isMinimal = playerSize === 'minimal';
    const h = PLAYER_HEIGHT[playerSize];

    const artworkImg = artworkUrl
      ? <img src={artworkUrl} className="sc-artwork" style={{ width: h, height: h }} alt="" />
      : <div className="sc-artwork sc-artwork--placeholder" style={{ width: h, height: h }} />;

    const infoIcon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5"/>
        <line x1="8" y1="7" x2="8" y2="11.5"/>
        <circle cx="8" cy="4.5" r="0.75" fill="currentColor" stroke="none"/>
      </svg>
    );

    const artworkWrap = (
      <div className="sc-artwork-wrap" style={{ width: h, height: h }}>
        {artworkImg}
        {!isMinimal && description && (
          <button className="desc-btn desc-btn--overlay" onClick={() => setDescOpen(true)} title="Behind the track">
            {infoIcon}
          </button>
        )}
      </div>
    );

    const inlineDescBtn = isMinimal && (
      <button
        className="desc-btn desc-btn--inline"
        onClick={description ? () => setDescOpen(true) : undefined}
        disabled={!description}
        title={description ? 'Behind the track' : 'No track info'}
      >
        {infoIcon}
      </button>
    );

    const voteButtons = (
      <div className="vote-buttons">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className={`vote-btn${song.currentVote === n ? ' vote-btn--active' : ''}`}
            onClick={() => handleVote(n)}
            disabled={voting}
            title={`Give ${n} point${n > 1 ? 's' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
    );

    const commentBtn = (
      <button
        className="comment-btn"
        onClick={handleComment}
        title="Comment on SoundCloud at current position"
      >
        💬
      </button>
    );

    return (
      <div
        id={`song-item-${song.id}`}
        ref={containerRef}
        className={`song-item${isPlaying ? ' song-item--playing' : ''}${isMinimal ? ' song-item--minimal' : ''}${isOtherActive ? ' song-item--other-active' : ''}`}
      >
        {!isMinimal && (
          <div className="song-header">
            <span className="song-title">{song.title}</span>
            <div className="song-actions">
              {voteButtons}
              {commentBtn}
            </div>
          </div>
        )}
        {voteError && <div className="vote-error">{voteError}</div>}
        <div className={`sc-player-wrap${isDark ? ' sc-player-wrap--dark' : ''}`}>
          {artworkWrap}
          {inlineDescBtn}
          {showIframe ? (
            <iframe
              ref={iframeRef}
              id={`sc-player-${song.id}`}
              src={embedUrl}
              width="100%"
              height={h}
              scrolling="no"
              frameBorder="0"
              allow="autoplay"
              onLoad={handleIframeLoad}
              className="sc-iframe"
            />
          ) : (
            <div className="sc-iframe sc-iframe--placeholder" style={{ height: h }} />
          )}
        </div>
        {isMinimal && (
          <div className="song-actions song-actions--minimal">
            {voteButtons}
            {commentBtn}
          </div>
        )}
        {descOpen && description && (
          <div className="modal-overlay" onClick={() => setDescOpen(false)}>
            <div className="modal-card desc-popup" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="desc-popup-title">{scTitle ?? song.title}</span>
                <button className="modal-close" onClick={() => setDescOpen(false)}>✕</button>
              </div>
              {scAuthor && <div className="desc-popup-author">{scAuthor} · Behind the track</div>}
              <div className="desc-popup-body"><p className="desc-popup-text">{description}</p></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SongItem.displayName = 'SongItem';
export default SongItem;
