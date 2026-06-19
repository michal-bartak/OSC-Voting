import { IsSystemDark } from '../wailsjs/go/main/App';
import { Environment } from '../wailsjs/runtime/runtime';

let _mq: MediaQueryList | null = null;
let _mqHandler: ((e: MediaQueryListEvent) => void) | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _isLinux: boolean | null = null;
// Bumped on every applyTheme() call. Async system-theme resolves capture the
// generation at call time and bail if superseded, so a slow/in-flight resolve
// (or a late poll tick) from a previous mode can't clobber a newer choice.
let _generation = 0;

async function isLinux(): Promise<boolean> {
  if (_isLinux !== null) return _isLinux;
  try {
    const env = await Environment();
    _isLinux = env.platform === 'linux';
  } catch {
    _isLinux = false;
  }
  return _isLinux;
}

async function resolveSystemDark(): Promise<boolean> {
  if (await isLinux()) {
    try {
      return await IsSystemDark();
    } catch {
      // fall through to matchMedia
    }
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function setDataTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export async function applyTheme(theme: string) {
  const gen = ++_generation;

  if (_mq && _mqHandler) {
    _mq.removeEventListener('change', _mqHandler);
    _mq = null;
    _mqHandler = null;
  }
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }

  if (theme === 'day') {
    setDataTheme(false);
    return;
  }
  if (theme === 'night') {
    setDataTheme(true);
    return;
  }

  // system: resolve now, then keep watching for changes.
  const refresh = async () => {
    const dark = await resolveSystemDark();
    if (gen !== _generation) return; // superseded by a newer applyTheme() call
    setDataTheme(dark);
  };
  await refresh();
  if (gen !== _generation) return;

  _mq = window.matchMedia('(prefers-color-scheme: dark)');
  _mqHandler = () => { refresh(); };
  _mq.addEventListener('change', _mqHandler);

  // WebKitGTK on Linux often ignores prefers-color-scheme; poll gsettings instead.
  if (await isLinux()) {
    if (gen !== _generation) return; // a newer call ran during the await
    _pollTimer = setInterval(refresh, 5000);
  }
}
