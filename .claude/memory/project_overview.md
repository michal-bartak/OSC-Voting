---
name: project-overview
description: "What OSC Vote is, its purpose, tech stack, and how to build/run it"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

OSC Vote is a multiplatform desktop app (macOS/Linux/Windows) built with Wails v2 that replaces the drag-and-drop voting UI at onesynthchallenge.org/voting. Users listen to SoundCloud songs and assign 1–5 points to each.

**Why:** The web UI uses drag-and-drop which is awkward; the desktop app provides inline vote buttons, continuous SoundCloud playback with auto-advance, and timed comment deeplinks.

**Tech stack:**
- Framework: Wails v2 (Go backend + React+TypeScript frontend, single self-contained binary)
- Go: net/http with cookiejar for auth, goquery for HTML scraping
- Frontend: React + TypeScript + Vite (via Wails scaffold)
- SoundCloud: HTML5 Widget API (per-song iframes, postMessage events)

**Key commands:**
```powershell
# Windows (current):
cd O:\GitRepo\OSC-Votes
wails dev                              # dev mode with hot reload
wails build -platform windows/amd64

# macOS (previous):
# cd /Users/michalbartak/GitRepo/osc
# wails dev
# wails build -platform darwin/universal
# wails build -platform linux/amd64
```

Output binary: `build/bin/OSC Vote.app` (macOS), `build/bin/OSC Vote.exe` (Windows)

**Version:** Tracked in `VERSION` file, embedded at compile time via `//go:embed VERSION` in `version.go`. Currently 0.1.0. Shown in window title bar.

**Config/session storage:** `~/.config/osc/` (0o600 permissions)
- `session.json` — persisted session cookie
- `config.json` — user preferences + credentials
