---
name: ui-decisions
description: "Design decisions, component patterns, CSS conventions, and UX choices"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

## Visual design

- Dark theme throughout: background `#111`/`#1a1a1a`/`#1e1e1e`, borders `#2a2a2a`/`#333`
- Accent color: `#ff5500` (SoundCloud orange) for active states, hover effects, focus rings
- Text: `#fff` (primary), `#ddd` (secondary), `#888` (muted), `#666` (very muted)
- Error color: `#ff6b6b`
- Border radius: 6–12px; cards use 12px, buttons use 5–6px

## Dark / Light / System theme

Three modes: `day`, `night`, `system`. Implemented via CSS custom properties on `[data-theme]` attribute. `VotingPage` tracks `isDark` via `MutationObserver` on `document.documentElement` and passes it down as a prop to `SongItem`.

The SC player iframe has no native dark mode. When `isDark` is true, `filter: invert(0.9) hue-rotate(180deg)` is applied to the iframe via `.sc-player-wrap--dark .sc-iframe`. `hue-rotate(180deg)` preserves the orange accent color after inversion.

## SC player artwork layout

Artwork is always rendered as a native `<img>` element **outside** the iframe (so it is never subject to the dark mode filter). The embed always uses `show_artwork=false`. Layout:

```
.sc-player-wrap (flex row, border-radius, overflow:hidden)
  .sc-artwork  (120×120px img, margin-right:-4px, z-index:1)
  .sc-iframe   (flex:1)
```

The overlap workaround (`margin-right: -4px`) has been reverted. The underlying artifact (white pixels at the left iframe edge on light→dark switch) is fixed by locking `.sc-iframe { background-color: #ffffff }` — see known issues.

Artwork URL: from `getCurrentSound()` on `READY` event. Falls back to `sound.user.avatar_url` when the track has no artwork set. Both use `-large` suffix replaced with `-t200x200`.

## SC iframe height

Controlled by `PlayerSize`: `minimal=20`, `medium=95`, `large=120`. The "small" size was removed (SC player can't adapt). `large` is the default.

## Player size slider

Three sizes: Minimal / Medium / Large. Range input (`max=2`) with custom tick labels. CSS uses `--slider-pct` CSS variable for the filled-track gradient. The `-webkit-slider-runnable-track` pseudo-element must have explicit `height: 4px` to correctly center the 16px thumb (without it, WebKit uses a different default track height and the `margin-top: -6px` centering math is off).

## Vote buttons

1–5 inline buttons per song. Clicking the active score again resets to 0 (unvote). Optimistic update in React state with revert on network error.

When hovering anywhere within `.song-actions` (vote buttons + comment button), all other `.song-item` cards dim via CSS `:has()`:
```css
.song-list:has(.song-actions:hover) .song-item:not(:has(.song-actions:hover)) {
  opacity: 0.35;
  filter: blur(1px);
}
```
The hover target is `.song-actions` (the wrapper div), not individual `.vote-btn` elements — this prevents flicker when the pointer moves between buttons.

## Comment button

💬 emoji button, 30×30px, same row as vote buttons. Opens SC track page at current timestamp in system browser.

## Track description popup

`ⓘ` button overlaid on the artwork image (top-right corner, `position: absolute` inside `.sc-artwork-wrap`). Only rendered when the SC Widget `READY` event returns a non-empty `description` from `getCurrentSound()`. Clicking opens a modal popup (reuses `.modal-overlay`) with the song title and scrollable description text (`white-space: pre-wrap`, vertical scroll only).

Button style: transparent background, no border, white `ⓘ` glyph with `text-shadow` for visibility on any artwork. In medium/large mode the button is always visible. In minimal mode it is hidden (`opacity: 0`) and revealed on `hover` over `.sc-artwork-wrap` via CSS, centered on the image (`top: 50%; left: 50%; transform: translate(-50%, -50%)`). No separate button element is added to the minimal layout — the artwork overlay is the only entry point.

## Song list scroll

Uses native browser scroll on a flex column. `scrollToFirstUnvoted()` uses `scrollIntoView({ behavior: 'smooth', block: 'center' })` targeting `#song-item-{id}`.

## Currently-playing highlight

`.song-item--playing` class: left border `3px solid #ff5500`, slightly warm background `#1f1a18`, title color `#ff7733`.

## Header layout

```
[OSC Voting] [Challenge #N]          [X/Y voted] [ⓘ] [⚙] [Log out]
```

`ⓘ` opens the About popup. `⚙` opens the Settings popup. Both use `.settings-btn` CSS class (same style).

## Text/element selection

`body { user-select: none; -webkit-user-select: none }` — prevents accidental text/UI selection via touchpad gestures. The `-webkit-` prefix is required for WebKit (macOS/Wails). Input fields re-enable selection automatically.

## Modal (SettingsPopup)

- Full-screen overlay `rgba(0,0,0,0.6)` at z-index 100
- Click outside to dismiss; Escape key to dismiss
- 360px centered card, same visual style as login card
- Two-button footer: Cancel (secondary) + Save (primary orange)
- Inline error below password field, same as LoginPage

## App icon

Custom 1024×1024 PNG at `build/appicon.png`: dark `#1a1a1a` rounded square, 5 orange `#ff5500` equalizer bars of varying heights + 5 small dots underneath. Generated with Python/Pillow.

## Wails window

Title: `"OSC Voting v" + appVersion` (from VERSION file)
Size: 1200×820, min 900×600
Background: `rgba(18, 18, 18, 1)` to avoid white flash on load

## Auto-scroll feature

Config-backed toggle in Settings. On load, if enabled, waits 150ms then scrolls to first unvoted song. Also scrolls when toggled on. Does NOT scroll on every vote. **Default: true.**

## Follow playback

Config-backed toggle in Settings. When enabled, automatically scrolls to the next song when it starts playing — but **only on automatic progression** (`handleFinish`), not when the user manually clicks play. Uses `followPlaybackRef` so `handleFinish` always reads the latest value. **Default: true.**

## About popup

340px modal. Shows: app name + version badge, short description, two link buttons (OSC website + GitHub), author (`Michal "MaXyM" Bartak` / `assisted by Claude AI`), OSC courtesy note. Links open via `OpenURL()` Go binding (`runtime.BrowserOpenURL`). Version loaded via `AppVersion()` binding on mount.
