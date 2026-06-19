// Song and AppState are provided by Wails-generated models (wailsjs/go/models.ts)
// Re-exported here for convenience
export type { } from '../wailsjs/go/models';

export interface SCWidget {
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  getPosition(callback: (position: number) => void): void;
  bind(event: string, listener: (data?: unknown) => void): void;
  unbind(event: string): void;
  getDuration(callback: (ms: number) => void): void;
  getCurrentSound(callback: (sound: {
    artwork_url?: string | null;
    title?: string | null;
    user?: { avatar_url?: string; username?: string };
    description?: string | null;
  } | null) => void): void;
}

declare global {
  interface Window {
    SC: {
      Widget: ((iframe: HTMLIFrameElement | string) => SCWidget) & {
        Events: {
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          READY: string;
          ERROR: string;
          PLAY_PROGRESS: string;
        };
      };
    };
  }
}
