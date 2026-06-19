---
name: notifications
description: "OS actionable vote notifications — architecture, platform behaviour, config fields, and known limits"
metadata:
  type: project
---

## What it does

At a configurable playback threshold (default 80%), the app sends a native OS notification
with the song title and 5 action buttons (vote 1–5). Clicking a button from the
notification submits the vote via the same `SubmitVote` path as the in-app buttons.

## Architecture

### Go side (`app.go`)

- `initNotifications()` — called from `startup()`. Initialises the Wails notification
  service, requests macOS permission (no-op elsewhere), registers the `"vote"` category
  with 5 `NotificationAction` buttons (id/title "1"–"5"), and installs
  `runtime.OnNotificationResponse` callback.
- `OnNotificationResponse` callback — filters for `ActionIdentifier` "1"–"5", then emits
  `runtime.EventsEmit(ctx, "notification:vote", songID, actionID)` to the frontend.
- `NotifyNearEnd(songID, title string, currentVote int) error` — sends the notification:
  - `Title`: "Rate this track"
  - `Subtitle`: song title (macOS/Linux only)
  - `Body`: "Your vote: N" if already voted, empty otherwise
  - `CategoryID`: "vote"

### Frontend — `SongItem.tsx`

- `durationMsRef` — populated by `widget.getDuration()` in the READY handler.
- `nearEndFiredRef` — prevents repeat triggers; reset on PLAY and FINISH events.
- `nearEndThresholdRef` — mirrors the `nearEndThreshold` prop so the PLAY_PROGRESS
  closure always reads the latest value without re-binding the event.
- PLAY_PROGRESS check: `position / duration >= nearEndThresholdRef.current` → calls
  `onNearEnd(song.id)`.

### Frontend — `VotingPage.tsx`

- `handleNearEnd(id)` — guards on `notificationsEnabled` and `notificationSkipVoted`,
  then calls `NotifyNearEnd(id, title, currentVote)`.
- `EventsOn('notification:vote', (songId, actionId) => handleVote(songId, parseInt(actionId)))` —
  wires the OS action button response back into the standard vote flow.
- Passes `nearEndThreshold={notificationThreshold / 100}` to each SongItem.

## Config fields (all in `models.go` / `config.go`)

| Field | Type | Default | Meaning |
|-------|------|---------|---------|
| `NotificationsEnabled` | `*bool` | `true` | Master on/off toggle |
| `NotificationThreshold` | `int` | `80` | % of song duration at which to notify (50–95) |
| `NotificationSkipVoted` | `*bool` | `false` | Suppress notification if song already has a vote |

Persisted via the standard `UpdateNotificationsEnabled` / `UpdateNotificationThreshold` /
`UpdateNotificationSkipVoted` bound methods (immediate save, same pattern as other
settings).

## Platform behaviour

| Platform | Action buttons | Permission | Notes |
|----------|---------------|------------|-------|
| macOS | Full UNUserNotification. 2 buttons visible inline, rest in "…" dropdown. | One-time system prompt on first launch | Notification style must be set to **Alert** (not Banner) in System Settings → Notifications → OSC Voting for the notification to stay on screen. `NSUserNotificationAlertStyle` plist key does **not** work with the modern UNUserNotification API — user must set it manually. |
| Windows 10/11 | Windows Toast with up to 5 action buttons | None required | Needs valid AppUserModelId |
| Linux | libnotify/D-Bus; GNOME 42+ and KDE support actions | None required | Action buttons best-effort — silently ignored on many DEs |

## Linux vote popup (`vote_dialog.py`)

GNOME caps notification actions at 3, so on Linux the notification registers a single
`vote-linux` "Vote…" action; `OnNotificationResponse` (action `rate`) calls
`showLinuxVoteDialog`, which runs the embedded `vote_dialog.py` via `python3 -c`
(embedded with `//go:embed`, so nothing extra is shipped). Args: `title currentVote theme`.
Fallback chain if `python3` absent: `zenity --list` → `runtime.WindowShow`.

Key implementation facts / gotchas:
- **Background must be painted in code, not CSS.** `set_app_paintable(True)` (needed for the
  RGBA visual / transparent rounded corners) makes GTK skip rendering the CSS `window`
  background entirely — so the popup looked transparent on a real compositor. `_on_draw`
  paints the rounded card + border itself with a cairo rounded-rect path. The CSS `window`
  rule remains only as the fallback for the no-RGBA-visual path.
- **Rounded corners** come from that cairo path (`r=13`), NOT CSS `border-radius` (which is
  ignored under `app_paintable`).
- **Close button** is a circular button overlaid via `Gtk.Overlay` in the top-right corner
  (`halign=END, valign=START`), not inline in the title row — that previously made the right
  margin look wider and aligned `✕` with the title.
- **Theme**: `DARK`/`LIGHT` palettes mirror `frontend/src/App.css` tokens. `"system"` is
  resolved in Go via `IsSystemDark()` (gsettings) before launching — NOT inside the script.
  The script's own `gtk-application-prefer-dark-theme` probe is unreliable and is only a last
  resort, because it doesn't reflect GNOME's `color-scheme`.
- **Positioning** is a per-DE heuristic on `XDG_CURRENT_DESKTOP` using `monitor.get_workarea()`
  (respects panels): GNOME → top-centre, KDE/Plasma → bottom-right, others → top-right. There
  is no API to query the notification daemon's actual placement.
- Notification **Body** ("Your vote: N") is omitted on Linux (the popup shows the current vote
  as a highlighted button) but kept on Windows/macOS where toast buttons can't indicate it.

## Frontend theme application (`theme.ts`)

`applyTheme(theme)` sets `data-theme` on `<html>`. On Linux, `"system"` is resolved via the
`IsSystemDark()` Go binding (gsettings) — WebKitGTK ignores `prefers-color-scheme` — and
re-polled every 5s. **Race fix:** a module-level `_generation` counter is bumped per call;
async system-theme resolves capture their generation and bail if superseded. Without it,
switching from `system` to an explicit theme left an in-flight `IsSystemDark()` (or a late
poll tick) to apply its stale result and revert the theme a few seconds later.

## SC Widget `getDuration`

`getDuration(callback: (ms: number) => void)` was added to the `SCWidget` interface in
`frontend/src/types.ts` as it wasn't typed originally. It is a real SC Widget API method.
