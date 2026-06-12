import { IsSystemDark } from '../wailsjs/go/main/App';
import { Environment } from '../wailsjs/runtime/runtime';

let _mq: MediaQueryList | null = null;
let _mqHandler: ((e: MediaQueryListEvent) => void) | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _isLinux: boolean | null = null;

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
  } else if (theme === 'night') {
    setDataTheme(true);
  } else {
    const refresh = async () => setDataTheme(await resolveSystemDark());
    await refresh();

    _mq = window.matchMedia('(prefers-color-scheme: dark)');
    _mqHandler = () => { refresh(); };
    _mq.addEventListener('change', _mqHandler);

    // WebKitGTK on Linux often ignores prefers-color-scheme; poll gsettings instead.
    if (await isLinux()) {
      _pollTimer = setInterval(refresh, 5000);
    }
  }
}
