---
name: soundcloud-integration
description: "SC Widget API usage, PLAY_PROGRESS position tracking, comment deeplinks, autoplay behavior"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

## SC Widget API setup

SC Widget API script loaded in `frontend/index.html`:
```html
<script src="https://w.soundcloud.com/player/api.js"></script>
```

Per-song iframe embed URL pattern:
```
https://w.soundcloud.com/player/?url={encodeURIComponent(trackUrl)}&auto_play=false
  &hide_related=true&show_comments=false&show_user=true&show_reposts=false
  &visual=false&color=%23ff5500
```

Widget init in `SongItem.tsx` `handleIframeLoad`:
```typescript
const widget = window.SC.Widget(iframeRef.current);
widgetRef.current = widget;
positionRef.current = 0;
widget.bind(window.SC.Widget.Events.PLAY, () => onPlay(song.id));
widget.bind(window.SC.Widget.Events.FINISH, () => onFinish(song.id));
widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: unknown) => {
  const d = data as { currentPosition?: number };
  if (typeof d?.currentPosition === 'number') positionRef.current = d.currentPosition;
});
```

## Position tracking — CRITICAL

**DO NOT use `widget.getPosition(callback)`** for the comment button. The async callback fires unreliably in Wails WKWebView when a track is at a non-zero position.

**Use `positionRef` updated by `PLAY_PROGRESS`** instead. The position is in milliseconds (float). When passing to Go, always use `Math.round(positionRef.current)` — Go's `int` type fails to unmarshal a float JSON value, causing a silent error.

Go function signature: `OpenCommentInBrowser(trackURL string, positionMs float64)` — accepts float64 to be safe.

## Comment deeplink URL format

Go builds: `{trackURL}#t={mins}m{secs:02d}s`
- Strip existing `?si=...&utm_...` query params first (some SC track URLs have tracking params)
- Example: `https://soundcloud.com/artist/track#t=1m30s`
- This is SC's own timed-comment anchor format

## Autoplay behavior

SC track pages autoplay when opened via URL (including `#t=...` format). There is no reliable URL parameter to prevent this — it's SC's client-side behavior. Accepted as a limitation.

## Window.SC global type

Declared in `frontend/src/types.ts`:
```typescript
declare global {
  interface Window {
    SC: {
      Widget: ((iframe: HTMLIFrameElement | string) => SCWidget) & {
        Events: { PLAY: string; PAUSE: string; FINISH: string; READY: string; ERROR: string; PLAY_PROGRESS: string; };
      };
    };
  }
}
```

## Auto-advance playlist

`VotingPage.tsx` `handleFinish(id)`: finds next song index, calls `songRefs.current[next.id]?.play()` via `useImperativeHandle` exposed by `SongItem`. 100ms timeout before play() to allow iframe readiness.

## Pause management

`SongItem.tsx` `useEffect([isPlaying])`: when `isPlaying` becomes false, calls `widgetRef.current?.pause()`. Parent sets `playingId` on PLAY event, which causes all other songs to become `isPlaying=false`.
