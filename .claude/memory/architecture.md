---
name: architecture
description: "Full file map, Go structs, frontend component tree, and data flow"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

## Go files (backend)

| File | Purpose |
|------|---------|
| `main.go` | Wails entry point; window config (1200×820, min 900×600, dark bg #121212) |
| `version.go` | Embeds VERSION file at compile time |
| `models.go` | Shared structs: Song, AppState, Config |
| `app.go` | All Wails-bound methods (Login, Logout, IsLoggedIn, GetSongs, SubmitVote, OpenCommentInBrowser) |
| `client.go` | HTTP client + cookiejar; saveSession/loadSession/clearSession |
| `parser.go` | Scrapes /voting HTML with goquery; extracts songs + challengeNumber |
| `config.go` | GetConfig / SaveConfig — reads/writes ~/.config/osc/config.json |

## Go structs (models.go)

```go
type Song struct {
    ID            string `json:"id"`
    Title         string `json:"title"`
    SoundCloudURL string `json:"soundCloudUrl"`
    CurrentVote   int    `json:"currentVote"`
}
type AppState struct {
    Songs           []Song `json:"songs"`
    ChallengeNumber int    `json:"challengeNumber"`
}
type Config struct {
    AutoScrollToUnvoted *bool  `json:"autoScrollToUnvoted,omitempty"`  // default true
    FollowPlayback      *bool  `json:"followPlayback,omitempty"`       // default true
    Email               string `json:"email,omitempty"`
    Password            string `json:"password,omitempty"`
    Theme               string `json:"theme,omitempty"`       // "day"|"night"|"system"
    DisplayEmail        string `json:"displayEmail,omitempty"`
    PlayerSize          string `json:"playerSize,omitempty"` // "minimal"|"medium"|"large"
}
```

`*bool` fields use `omitempty` so absent JSON keys are detectable. `GetConfig()` applies `true` defaults for nil pointers, covering both fresh installs and old configs missing those fields.

## Frontend files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Page router: loading → auto-login → login or voting |
| `frontend/src/App.css` | All styles (dark theme, orange #ff5500 accent) |
| `frontend/src/types.ts` | SCWidget interface + window.SC global declaration |
| `frontend/src/components/LoginPage.tsx` | Login form; accepts initialEmail/initialError props |
| `frontend/src/components/VotingPage.tsx` | Main voting UI; header + song list |
| `frontend/src/components/SongItem.tsx` | Individual song row: SC iframe, vote buttons, comment button |
| `frontend/src/components/SettingsPopup.tsx` | Modal: theme, player size, behavior toggles, credentials |
| `frontend/src/components/AboutPopup.tsx` | Modal: app version, description, author, links |
| `frontend/wailsjs/go/main/App.js` | Auto-generated Wails JS bindings (DO NOT edit manually) |
| `frontend/wailsjs/go/models.ts` | Auto-generated TypeScript models (DO NOT edit manually) |
| `frontend/index.html` | Loads SC Widget API script from w.soundcloud.com |

## Component tree

```
App (page router)
├── LoginPage        — email/password form
└── VotingPage       — header + song list
    ├── AboutPopup   (conditional modal)
    ├── SettingsPopup (conditional modal)
    └── SongItem ×N
        └── SC iframe (Widget API)
```

## SongItemHandle interface

```typescript
export interface SongItemHandle {
  play(): void;          // resume (preserves paused position)
  playFromStart(): void; // resets positionRef=0, then plays
  pause(): void;
  getIframe(): HTMLIFrameElement | null;
}
```

`playFromStart()` must be used for all non-resume play calls (NEXT, PREV, auto-advance, first play). `play()` is reserved for `handleResume` only. Using `play()` for a new song start leaves positionRef stale until the first PLAY_PROGRESS fires, causing the comment button to open at the wrong timestamp.

## Data flow

1. App startup: `IsLoggedIn()` → if false, try `GetConfig()` + `Login()` auto-login
2. VotingPage mount: `Promise.all([GetSongs(), GetConfig()])` — parallel
3. Vote click: optimistic update in React state → `SubmitVote(id, points)` → revert on error
4. SC playback: iframe Widget API PLAY/PAUSE/FINISH/PLAY_PROGRESS events; parent VotingPage manages `playingId` + `isPaused`
5. Comment: `positionRef.current` (updated by PLAY_PROGRESS, reset to 0 by `playFromStart()`) → `OpenCommentInBrowser(url, ms)`

## Wails binding namespace

All Go methods available in TypeScript as:
```typescript
import {
  Login, Logout, IsLoggedIn,
  GetSongs, GetConfig, SaveConfig,
  SubmitVote, OpenCommentInBrowser,
  UpdateTheme, UpdateAutoScroll, UpdateFollowPlayback, UpdatePlayerSize,
  AppName, AppVersion, OpenURL,
  GetConfigPath,
} from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
// Types: main.Song, main.AppState, main.Config
// Constructors: main.Song.createFrom({...}), main.Config.createFrom({...})
```
