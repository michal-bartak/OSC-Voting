import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { OpenCommentInBrowser, SubmitVote } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { SCWidget } from '../types';

interface Props {
  song: main.Song;
  isPlaying: boolean;
  isDark: boolean;
  onPlay: (id: string) => void;
  onFinish: (id: string) => void;
  onVote: (id: string, points: number) => void;
}

export interface SongItemHandle {
  play(): void;
  pause(): void;
}

const SongItem = forwardRef<SongItemHandle, Props>(
  ({ song, isPlaying, isDark, onPlay, onFinish, onVote }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const widgetRef = useRef<SCWidget | null>(null);
    const positionRef = useRef(0);
    const onPlayRef = useRef(onPlay);
    onPlayRef.current = onPlay;
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;
    const [voteError, setVoteError] = useState('');
    const [voting, setVoting] = useState(false);
    const prevVoteRef = useRef(song.currentVote);
    const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      play() { widgetRef.current?.play(); },
      pause() { widgetRef.current?.pause(); },
    }));

    const handleIframeLoad = () => {
      if (!iframeRef.current || !window.SC) return;
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      positionRef.current = 0;

      widget.bind(window.SC.Widget.Events.PLAY,   () => onPlayRef.current(song.id));
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
        });
      });
    };

    useEffect(() => {
      if (!isPlaying) {
        widgetRef.current?.pause();
      }
    }, [isPlaying]);

    useEffect(() => {
      const handleWindowBlur = () => {
        if (document.activeElement === iframeRef.current) {
          onPlayRef.current(song.id);
        }
      };
      window.addEventListener('blur', handleWindowBlur);
      return () => window.removeEventListener('blur', handleWindowBlur);
    }, [song.id]);

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

    return (
      <div id={`song-item-${song.id}`} className={`song-item${isPlaying ? ' song-item--playing' : ''}`}>
        <div className="song-header">
          <span className="song-title">{song.title}</span>
          <div className="song-actions">
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
            <button
              className="comment-btn"
              onClick={handleComment}
              title="Comment on SoundCloud at current position"
            >
              💬
            </button>
          </div>
        </div>
        {voteError && <div className="vote-error">{voteError}</div>}
        <div className={`sc-player-wrap${isDark ? ' sc-player-wrap--dark' : ''}`}>
          {artworkUrl
            ? <img src={artworkUrl} className="sc-artwork" alt="" />
            : <div className="sc-artwork sc-artwork--placeholder" />
          }
          <iframe
            ref={iframeRef}
            id={`sc-player-${song.id}`}
            src={embedUrl}
            width="100%"
            height="120"
            scrolling="no"
            frameBorder="0"
            allow="autoplay"
            onLoad={handleIframeLoad}
            className="sc-iframe"
          />
        </div>
      </div>
    );
  }
);

SongItem.displayName = 'SongItem';
export default SongItem;
