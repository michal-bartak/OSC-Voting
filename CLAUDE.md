# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

OSC Voting is a desktop app (Wails v2 + React + TypeScript) for voting on tracks in the OneSynthChallenge. It scrapes the OSC website, renders SoundCloud embeds, and submits votes via the site's API.

## Commands

### Development
```
wails dev          # hot-reload dev server (Go + Vite HMR)
```

### Build
```
wails build        # production binary with embedded frontend
```

### Frontend only (from frontend/)
```
npm run build      # tsc + vite build
```

There are no tests and no linter configured.

## Architecture

**Wails** bridges Go (backend) and React (frontend) — Go methods on `*App` are auto-exposed to TypeScript via generated bindings in `frontend/wailsjs/go/`. Never edit those generated files manually; they regenerate on `wails dev/build`.

### Go backend

| File | Role |
|------|------|
| `main.go` | Wails entry point, window config |
| `app.go` | All bound methods: Login, Logout, IsLoggedIn, GetSongs, SubmitVote, UpdateTheme, UpdateAutoScroll, OpenCommentInBrowser |
| `client.go` | `http.Client` with cookie jar; session save/load/clear to `~/.config/osc-voting/session.json` |
| `parser.go` | HTML scraper (goquery) for `/voting` page — extracts songs from score panels and `challengeNumber` from inline JS |
| `config.go` | Read/write `~/.config/osc-voting/config.json` |
| `models.go` | Shared structs: `Song`, `AppState`, `Config` |
| `version.go` | Embeds `VERSION` file at compile time via `//go:embed` |

### Config struct fields (all `omitempty` except `autoScrollToUnvoted`)
- `email`, `password` — persisted on successful login
- `displayEmail` — if set, shown in the Settings popup instead of the real email; real email is never overwritten when this is present
- `theme` — `"day"` | `"night"` | `"system"`
- `autoScrollToUnvoted` — bool

### Frontend

**Page routing** is in `App.tsx`: on mount it calls `IsLoggedIn()`, tries auto-login from config if not, then renders `LoginPage` or `VotingPage`.

**VotingPage** owns all playback state (`playingId`, `isPaused`) and passes `isPlaying={playingId === song.id}` down to each `SongItem`. The `BottomBar` and `SongItem` both feed events back up via callbacks.

**SongItem** embeds a SoundCloud iframe and wraps it with the SC Widget API (`window.SC.Widget`). Important caveat: **the SC Widget `PLAY` event does not fire reliably in Wails/WebView2 on Windows** when the user clicks play inside the embed. The workaround is a `window blur` listener — when `document.activeElement === iframeRef.current`, the user clicked inside that iframe and we call `onPlay(song.id)` directly. The SC Widget API is still used for `pause()`, `play()`, `seekTo()`, `getCurrentSound()`, and `PLAY_PROGRESS` tracking.

The SC Widget API script is loaded from `https://w.soundcloud.com/player/api.js` in `index.html`. The embed color is set via the `color=` URL parameter in `embedUrl` (currently `%23888888`).

**Dark mode** in the SC iframe is achieved with `filter: invert(0.9) hue-rotate(180deg)` on the `sc-iframe` element (class `sc-player-wrap--dark`).

### Wails bindings in TypeScript
```typescript
import { Login, Logout, IsLoggedIn, GetSongs, GetConfig, SaveConfig,
         SubmitVote, UpdateTheme, UpdateAutoScroll, OpenCommentInBrowser,
         GetConfigPath, AppName } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
// Types: main.Song, main.AppState, main.Config
// Constructors: main.Song.createFrom({...}), main.Config.createFrom({...})
```

### Vote flow
1. User clicks a vote button → optimistic state update in React
2. `SubmitVote(songID, points)` POSTs to `/save-vote` with `challengeNumber` (scraped from the voting page and held in `App.challengeNumber`)
3. On error: state reverts to previous vote

### Comment flow
`positionRef.current` is updated by `PLAY_PROGRESS` events in ms. `OpenCommentInBrowser(url, ms)` converts to `#t=Xm00s` and opens in the system browser via `runtime.BrowserOpenURL`.
