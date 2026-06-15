import { useEffect } from 'react';
import { OpenURL } from '../../wailsjs/go/main/App';

interface Props {
  version: string;
  onClose: () => void;
}

export default function AboutPopup({ version, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const open = (url: string) => OpenURL(url).catch(() => {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card about-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">About</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="about-hero">
          <span className="about-app-name">OSC Voting</span>
          <span className="about-version">v{version}</span>
        </div>

        <p className="about-desc">
          A desktop companion for <strong>OneSynthChallenge</strong> — a synth music competition
          where every track is made with a single synthesizer. Browse submissions, listen to
          SoundCloud embeds, cast your votes, and leave timestamped comments without ever leaving
          the app.
        </p>

        <div className="about-links">
          <button className="about-link-btn" onClick={() => open('https://www.onesynthchallenge.org')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13"/>
            </svg>
            onesynthchallenge.com
          </button>
          <button className="about-link-btn" onClick={() => open('https://github.com/michal-bartak/OSC-Voting')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            michal-bartak/OSC-Votes
          </button>
        </div>

        <div className="about-author">
          Made by <strong>Michal "MaXyM" Bartak</strong>
          <br />
          <span className="about-author-ai">assisted by Claude AI</span>
        </div>

        <p className="about-courtesy">
          All voting data and track listings are sourced from the official OSC platform.
          Many thanks to the OSC creators for running the challenge.
        </p>
      </div>
    </div>
  );
}
