let _mq: MediaQueryList | null = null;
let _mqHandler: ((e: MediaQueryListEvent) => void) | null = null;

export function applyTheme(theme: string) {
  // Remove any existing system listener before switching modes.
  if (_mq && _mqHandler) {
    _mq.removeEventListener('change', _mqHandler);
    _mq = null;
    _mqHandler = null;
  }

  if (theme === 'day') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (theme === 'night') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    // "system" or empty — follow OS preference and keep listening for changes.
    _mq = window.matchMedia('(prefers-color-scheme: dark)');
    const set = (dark: boolean) =>
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    set(_mq.matches);
    _mqHandler = (e) => set(e.matches);
    _mq.addEventListener('change', _mqHandler);
  }
}
