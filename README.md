# OSC Voting

A companiond desktop app for voting in the [One Synth Challenge](https://onesynthchallenge.org) (OSC) — a synth music competition hosted on the [KVR Audio forum](https://www.kvraudio.com/forum/viewforum.php?f=1).

> Uses the OSC site's API. All credit to the OSC creators for building and running the platform.

<img src="docs/screenshot.gif" width="40%">
<img src="docs/screenshot-minimal.png" width="50%">

## Features

- **Voting** — Pick vote for any song at any time without effort
- **Comments** — 💬 opens the SoundCloud track page in your browser at the current playback position
- **Playlist playback** — Auto advance to the next song, looping the playlist or the current song
- **Transport bar** — play/pause, stop, previous/next, loop mode (song / playlist / off)
- **Player size** — three sizes available (Minimal / Medium / Large)
- **Keyboard shortcut** — Space toggles play/pause

- **Follow playback** — list scrolls to the currently playing song on auto-advance (optional). Button to jump to played song at any time
- **Jump to unvoted** — jumps to the first unvoted song on application start (optional). Button to jump to the first unvoted song at any time
- **Sort** — by default order, votes (high/low), or title
- **Auto-login** — saves credentials and restores the session on next launch
- **Theme** — Dark / Light / System

> :bulb: Voting comments are posted on the SoundCloud page (SC doesn't expose a comments API), so the 💬 button opens it in a browser. Note: the SC page will start playing the track — press Space or mute the browser tab.

## Download

Get the latest release from the [Releases page](../../releases).

| Platform | File |
|----------|------|
| Windows | `OSC-Voting-vX.X.X-windows-amd64.zip` → extract, run `OSC-Voting.exe` |
| macOS | `OSC-Voting-vX.X.X-macos-universal.dmg` → open, drag to Applications |
| Linux (Debian/Ubuntu) | `OSC-Voting-vX.X.X-linux-amd64.deb` → `sudo apt install ./OSC-Voting-*.deb` |
| Linux (Fedora/RHEL) | `OSC-Voting-vX.X.X-linux-amd64.rpm` → `sudo dnf install ./OSC-Voting-*.rpm` |

## Installing

### Windows
SmartScreen may warn on first launch. Click **More info → Run anyway**.

### macOS
The app is unsigned, so macOS quarantines it when downloaded via a browser.

**Option 1 — download with curl (recommended):**
```bash
curl -LJO https://github.com/michal-bartak/OSC-Voting/releases/latest/download/OSC-Voting-vX.X.X-macos-universal.dmg
```
Open the `.dmg` normally — no further steps needed.

**Option 2 — already downloaded via browser:**
Open the `.dmg`, drag the app to Applications, then run once in Terminal:
```bash
xattr -d com.apple.quarantine /Applications/OSC-Voting.app
```

### Linux
The packages declare runtime dependencies, so your package manager will pull them in automatically.

```bash
# Debian / Ubuntu
sudo apt install ./OSC-Voting-vX.X.X-linux-amd64.deb

# Fedora / RHEL / openSUSE
sudo dnf install ./OSC-Voting-vX.X.X-linux-amd64.rpm
```

If the app fails to start, install the runtime libraries manually:
```bash
sudo apt install libgtk-3-0 libwebkit2gtk-4.1-0          # Debian/Ubuntu 24.04+
sudo dnf install gtk3 webkit2gtk4.1                       # Fedora 38+
sudo dnf install gtk3 webkit2gtk3                         # Fedora 37 / RHEL 9
```

## Building from source

**Requirements:**
- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org)
- [Wails v2](https://wails.io): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

**Linux build dependencies:**
```bash
# Debian/Ubuntu 24.04+
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev build-essential pkg-config

# Fedora 38+
sudo dnf install gtk3-devel webkit2gtk4.1-devel gcc-c++ pkgconf-pkg-config
```

On older distros shipping only WebKit 4.0 (Ubuntu 22.04, RHEL 9), remove `"build:tags": "webkit2_41"` from `wails.json` and install `libwebkit2gtk-4.0-dev` / `webkit2gtk3-devel` instead.

```bash
git clone https://github.com/michal-bartak/OSC-Voting.git
cd OSC-Voting
wails build -platform linux/amd64   # or: darwin/universal  windows/amd64
```

Output lands in `build/bin/`. For development with hot reload:
```bash
wails dev
```

---

*Built by Michal Bartak, assisted by [Claude](https://claude.ai).*
