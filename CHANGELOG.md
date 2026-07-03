# Changelog

All notable changes to OSC Voting are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **How this feeds releases:** the section whose heading matches the `VERSION`
> file is extracted by `.github/workflows/release.yml` and placed at the top of
> the GitHub release description (above the install instructions and the
> auto-generated "What's Changed" list). Keep the `[Unreleased]` section current
> as you work; when cutting a release, rename it to the new version + date so the
> heading matches `VERSION` (e.g. `## [1.1.0] - 2026-07-01`).

## [1.2.0] - 2026-07-03

### Added

- login screen note that sign-in uses your `onesynthchallenge.org` account, with a link to the site.
- links to the Documentation site, the KVR OSC portal, and the KVR OSC SoundCloud profile.

### Fixed

- Other-track dim/blur no longer stays stuck after opening a comment or switching
  away from the app.
- Spacebar reliably toggles play/pause again after returning from the browser
  (previously it could re-open the last comment).
- Corrected the OneSynthChallenge link text to `onesynthchallenge.org`.

## [1.1.0] - 2026-06-19

### Added

- **Vote reminders** — optional end-of-track notification with 1–5 vote buttons;
  configurable threshold, can skip already-voted tracks.
- **Linux vote popup** — styled popup with all five vote options (works around
  GNOME's 3-button limit), light/dark themed, positioned per desktop.

### Changed

- **Linux** — runs under XWayland (`GDK_BACKEND=x11`) for GPU-accelerated
  rendering and correct popup focus/positioning.

### Fixed

- **Linux** — theme no longer flickers back to light after switching.
- Other-track dim/blur no longer blinks when moving between vote buttons.

## [1.0.0] - 2026-06-17

First public release. Earlier version history is available from the
[git tags](https://github.com/michal-bartak/OSC-Voting/tags).
