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

## [Unreleased]

### Added

- **Vote reminders** — an optional OS notification near the end of each track
  with 1–5 vote buttons. The playback threshold is configurable, and tracks you
  have already voted on can be skipped.
- **Linux vote popup** — a custom styled popup (opened from the notification's
  "Vote…" action, since GNOME limits notifications to three buttons) showing all
  five vote options, with light/dark theming, rounded corners, and a corner
  close button. Popup position match where each desktop shows
  notifications (GNOME top-centre, KDE bottom-right, others top-right)

### Changed

- **Linux** — the app now runs under XWayland (`GDK_BACKEND=x11`) for
  GPU-accelerated rendering and correct vote-popup focus and positioning.

### Fixed

- **Linux** — the app no longer briefly applies a theme and then reverts to
  light a few seconds later when the theme is changed.
- The dim/blur transition on other tracks no longer blinks when moving the
  cursor between vote buttons.

## [1.0.0] - 2026-06-17

First public release. Earlier version history is available from the
[git tags](https://github.com/michal-bartak/OSC-Voting/tags).
