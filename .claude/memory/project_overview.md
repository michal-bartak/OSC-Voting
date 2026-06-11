---
name: project-overview
description: "What OSC Voting is, its purpose, tech stack, and how to build/run it"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

OSC Voting is a multiplatform desktop app (macOS/Linux/Windows) built with Wails v2 that replaces the drag-and-drop voting UI at onesynthchallenge.org/voting. Users listen to SoundCloud songs and assign 1–5 points to each.

**Why:** The web UI uses drag-and-drop which is awkward; the desktop app provides inline vote buttons, continuous SoundCloud playback with auto-advance, and timed comment deeplinks.

**Tech stack:**
- Framework: Wails v2 (Go backend + React+TypeScript frontend, single self-contained binary)
- Go: net/http with cookiejar for auth, goquery for HTML scraping
- Frontend: React + TypeScript + Vite (via Wails scaffold)
- SoundCloud: HTML5 Widget API (per-song iframes, postMessage events)

**Key commands:**
```bash
~/go/bin/wails dev                          # dev mode with hot reload (add ~/go/bin to PATH to use bare `wails`)
~/go/bin/wails build -clean                 # production build (darwin/arm64 by default)
~/go/bin/wails build -platform darwin/universal  # universal macOS binary
~/go/bin/wails build -platform linux/amd64
```

**Output binaries:**
- macOS: `build/bin/OSC-Voting.app` (bundle) → binary inside: `Contents/MacOS/OSC-Voting`
- Windows: `build/bin/OSC-Voting.exe`
- Linux: `build/bin/OSC-Voting`

**Post-build icon fix (macOS):** Wails generates a single-size icns; replace and re-sign:
```bash
cp build/appicon.icns "build/bin/OSC-Voting.app/Contents/Resources/iconfile.icns"
codesign --force --sign - "build/bin/OSC-Voting.app"
open "build/bin/OSC-Voting.app"
```

**App name — rename touch-points (3 places):**
1. `wails.json`: `name`, `outputfilename`, `info.productName` — OS-level names (bundle, exe, taskbar, CFBundleName)
2. `app.go`: `const appName = "OSC Voting"` + bound method `AppName()` — GUI header reads from this; also used as native window `Title` prefix in `main.go`
3. `frontend/index.html`: `<title>OSC Voting</title>` — **invisible in desktop builds** (no browser tab bar in Wails WKWebView/WebView2); update manually on rename for consistency

All build templates and the workflow derive from `wails.json` via `jq`. Future renames: update all three.

**Version:** Tracked in `VERSION` file, embedded at compile time via `//go:embed VERSION` in `version.go`. Currently 0.1.1. Shown in window title bar. `wails.json` `productVersion` is kept in sync manually for local dev; CI auto-syncs it via `jq` step before `wails build`.

**macOS Gatekeeper:** Downloaded builds are quarantined. Users must run:
```bash
xattr -d com.apple.quarantine ~/Downloads/OSC-Voting.app
```

**Config/session storage:** `~/.config/osc/` (0o600 permissions)
- `session.json` — persisted session cookie
- `config.json` — user preferences + credentials
