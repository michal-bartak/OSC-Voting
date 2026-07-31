import { useEffect } from 'react';
import { OpenURL } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

interface Props {
  info: main.UpdateInfo;
  onClose: () => void;
}

export default function UpdatePopup({ info, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const open = (url: string) => OpenURL(url).catch(() => {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card update-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Update available</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="update-message">
          OSC Voting <strong>v{info.latestVersion}</strong> is available — you have v{info.currentVersion}.
        </p>

        <div className="update-actions">
          <button className="update-view-btn" onClick={() => open(info.releaseURL)}>
            View release
          </button>
          <button className="update-dismiss-btn" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
