---
name: known-issues-and-fixes
description: Bugs encountered during development and how they were resolved
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

## Comment button silent failure at non-zero position

**Symptom:** Comment button did nothing when song was at any position > 0. Worked fine at position 0.

**Root cause:** `PLAY_PROGRESS` delivers `currentPosition` as a JavaScript float (e.g. `45123.456`). Wails serialises it as a JSON float. Go's `json.Unmarshal` refuses to decode a fractional number into an `int` type — the IPC call threw a silent error (unhandled Promise rejection).

**Fix 1 (position 0 worked):** `0` serialises as an integer JSON value, so it unmarshalled fine.

**Fix:** Two-part:
1. TypeScript: `Math.round(positionRef.current)` before calling Go
2. Go: changed `OpenCommentInBrowser` parameter from `int` to `float64`

## Comment button unreliable for playing song (earlier bug)

**Symptom:** `widget.getPosition(callback)` — the callback fired unreliably in Wails WKWebView, especially when the track was at a non-zero position.

**Fix:** Replaced `getPosition()` with continuous `PLAY_PROGRESS` event tracking stored in a `positionRef`. Comment button reads the ref synchronously — no async callback.

## SC track URL tracking params breaking comment URL

**Symptom:** Some SC track URLs contain `?si=xxx&utm_source=clipboard`. Appending `?t=45` created malformed URL `...?si=xxx&utm_source=clipboard?t=45`.

**Fix:** Strip everything from `?` onward before appending the time anchor:
```go
if idx := strings.Index(trackURL, "?"); idx != -1 {
    base = trackURL[:idx]
}
```

## AppleScript tab-reuse approach abandoned

**Attempt:** Used AppleScript (`osascript`) to find an existing SoundCloud tab in Chrome/Safari and navigate it in-place (to avoid opening multiple tabs).

**Problem:** macOS shows a permission dialog: "OSC Vote wants to control Google Chrome." User didn't want to grant Automation access.

**Decision:** Reverted to simple `runtime.BrowserOpenURL`. Multiple SC tabs is the accepted behaviour.

## Wails-generated bindings overwrite manual edits

**Problem:** `wails dev` auto-regenerates `wailsjs/go/main/App.d.ts` and `wailsjs/go/models.ts`. Any manual edits are lost on rebuild.

**Rule:** Never manually maintain these files. Always import from them using the auto-generated `main.*` namespace. If new Go types/fields are added, run `wails dev` once and the TypeScript types update automatically.

## configFilePath naming conflict

**Problem:** During initial build, `config.go` referenced a function `configFilePath` that didn't exist. Named it `appConfigFilePath()` to avoid conflict with any internal symbol.

## wails init created nested subdirectory

**Problem:** Running `wails init -n osc` inside `/osc/` created `/osc/osc/` nested directory.
**Fix:** Move all files up one level.

## SC Comment URL format

Use `#t={mins}m{secs:02d}s` (fragment, SC's timed-comment anchor format) rather than `?t={secs}` (query param). The query param format was used initially but `#t=` is SC's canonical timed-comment deeplink format.

## Wails dev hot-reload and Go type changes

When Go structs change (e.g. adding fields to Config), `wails dev` auto-regenerates `models.ts` immediately. No manual sync needed. However, if TypeScript code references the new fields before regeneration, there will be a brief TS error. Safe to ignore — it resolves on next hot reload.
