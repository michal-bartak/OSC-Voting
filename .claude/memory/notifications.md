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

## SC Widget `getDuration`

`getDuration(callback: (ms: number) => void)` was added to the `SCWidget` interface in
`frontend/src/types.ts` as it wasn't typed originally. It is a real SC Widget API method.
