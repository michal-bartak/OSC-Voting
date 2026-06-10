import { useEffect, useState } from 'react';
import { Login, UpdateAutoScroll, UpdateTheme } from '../../wailsjs/go/main/App';
import { applyTheme } from '../theme';

interface Props {
  initialEmail: string;
  initialPassword: string;
  initialTheme: string;
  initialAutoScroll: boolean;
  onSave: (email: string, password: string, theme: string) => void;
  onAutoScrollChange?: (val: boolean) => void;
  onClose: () => void;
}

const THEMES = [
  { value: 'day',    label: 'Day' },
  { value: 'night',  label: 'Night' },
  { value: 'system', label: 'System' },
];

export default function SettingsPopup({ initialEmail, initialPassword, initialTheme, initialAutoScroll, onSave, onAutoScrollChange, onClose }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [theme, setTheme] = useState(initialTheme || 'system');
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        applyTheme(initialTheme || 'system');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, initialTheme]);

  const handleThemeSelect = (t: string) => {
    setTheme(t);
    applyTheme(t);
    UpdateTheme(t).catch(() => {});
  };

  const handleAutoScrollToggle = (val: boolean) => {
    setAutoScroll(val);
    UpdateAutoScroll(val).catch(() => {});
    onAutoScrollChange?.(val);
  };

  const handleCancel = () => {
    applyTheme(initialTheme || 'system');
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await Login(email, password);
      onSave(email, password, theme);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <button className="modal-close" onClick={handleCancel}>✕</button>
        </div>

        <div className="settings-section">
          <div className="settings-section-label">Appearance</div>
          <div className="theme-selector">
            {THEMES.map(t => (
              <button
                key={t.value}
                className={`theme-option${theme === t.value ? ' theme-option--active' : ''}`}
                onClick={() => handleThemeSelect(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-label">Behavior</div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              className="settings-toggle-checkbox"
              checked={autoScroll}
              onChange={e => handleAutoScrollToggle(e.target.checked)}
            />
            <span>Auto-scroll to first unvoted</span>
          </label>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section-label">Account</div>
        <form onSubmit={handleSave} className="login-form">
          <label className="field-label">Email</label>
          <input
            type="email"
            className="field-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            disabled={loading}
          />
          <label className="field-label">Password</label>
          <input
            type="password"
            className="field-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
          />
          {error && <div className="login-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="login-btn" disabled={loading || !email || !password}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
