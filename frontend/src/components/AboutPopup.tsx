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
          A desktop companion for <strong>OneSynthChallenge</strong> — a music competition
          where every track is made with a single synthesizer. Browse submissions, listen to
          SoundCloud embeds, cast your votes, and leave timestamped comments without ever leaving
          the app.
        </p>

        <div className="about-links">
          <button className="about-link-btn" onClick={() => open('https://michal-bartak.github.io/OSC-Voting/')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2.5h6a2 2 0 012 2v9a1.5 1.5 0 00-1.5-1.5h-6.5z"/>
              <path d="M13.5 2.5h-3a2 2 0 00-2 2v9a1.5 1.5 0 011.5-1.5h3.5z"/>
            </svg>
            Documentation
          </button>
          <button className="about-link-btn" onClick={() => open('https://github.com/michal-bartak/OSC-Voting')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </button>
          <button className="about-link-btn" onClick={() => open('https://www.onesynthchallenge.org')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13"/>
            </svg>
            onesynthchallenge.org
          </button>
          <button className="about-link-btn" onClick={() => open('https://sites.google.com/site/kvrosc/')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13"/>
            </svg>
            KVR OSC
          </button>
          <button className="about-link-btn" onClick={() => open('https://soundcloud.com/kvrosc')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.008.055.045.089.09.089s.089-.034.104-.089l.21-1.308-.21-1.334c-.015-.061-.06-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.21 2.458c0 .062.059.104.12.104.061 0 .12-.042.12-.104l.24-2.458-.24-2.563c0-.06-.06-.104-.12-.104m.945-.089c-.075 0-.135.06-.135.135l-.195 2.64.195 2.549c0 .075.06.135.135.135.074 0 .135-.06.135-.135l.225-2.549-.225-2.64c0-.075-.061-.135-.135-.135m1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.21 2.415.21 2.563c.006.09.075.15.164.15.084 0 .154-.06.16-.15l.24-2.563-.24-2.415m.824-.988c-.101 0-.18.079-.18.18l-.21 3.223.21 2.549c0 .1.079.18.18.18.1 0 .18-.08.18-.18l.24-2.549-.24-3.223c0-.101-.08-.18-.18-.18m.99-.036c-.109 0-.194.085-.194.195l-.21 3.244.21 2.534c0 .109.085.194.194.194.11 0 .195-.085.195-.194l.24-2.534-.24-3.244c0-.11-.085-.195-.195-.195m1.005-.42c-.12 0-.209.09-.209.21l-.194 3.66.194 2.519c0 .12.089.21.209.21.119 0 .209-.09.209-.21l.225-2.519-.225-3.66c0-.12-.09-.21-.209-.21m1.019-.06c-.125 0-.225.099-.225.224l-.18 3.72.18 2.505c0 .125.1.224.225.224.124 0 .224-.099.224-.224l.21-2.505-.21-3.72c0-.125-.1-.225-.224-.225m1.245.36c0-.135-.104-.24-.24-.24-.135 0-.24.105-.24.24l-.164 3.375.164 2.489c0 .135.105.24.24.24.136 0 .24-.105.24-.24l.195-2.489-.195-3.375m.749-.63c-.15 0-.254.12-.254.255l-.15 3.72.15 2.474c0 .135.104.255.254.255.135 0 .255-.12.255-.255l.164-2.474-.164-3.72c0-.135-.12-.255-.255-.255m1.184.045c-.045-.03-.104-.045-.164-.045-.061 0-.12.015-.166.045-.09.045-.149.135-.149.24v.015l-.135 3.6.135 2.474.006.045c.015.15.135.255.269.255.06 0 .12-.015.165-.045.09-.06.149-.15.149-.255l.016-.24.149-2.234-.165-3.63c0-.104-.06-.18-.15-.24m9.457 2.174c-.405 0-.79.082-1.141.23-.234-2.654-2.46-4.735-5.174-4.735-.663 0-1.31.135-1.875.36-.221.09-.28.18-.28.36v9.884c0 .18.135.329.315.345h8.155c1.626 0 2.943-1.32 2.943-2.945 0-1.626-1.317-2.94-2.943-2.94"/>
            </svg>
            KVR OSC on SoundCloud
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
