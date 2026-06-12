# OSC Voting

> :sparkles: The application is written with use of AI

> :heart: This application uses an API originally developed and maintained by the OSC creators for their own application. All credits and thanks go to the original authors for making this interface available and for their work.

A desktop app for voting in the [One Synth Challenge](https://onesynthchallenge.org) (OSC) organized by [KVR Audio forum](https://www.kvraudio.com/forum/viewforum.php?f=1)

## Features

- **Inline playback** — SoundCloud player embedded per song, no browser switching
- **Transport controls** — play/pause, stop, previous and next buttons in a bottom bar
- **Keyboard shortcut** — Space bar toggles play/pause
- **Auto-advance** — next song starts automatically when the current one ends
- **Sort songs** — order by default, votes (high/low), or title A–Z
- **Vote buttons** — 1–5 points inline; click the active score again to clear the vote; other tracks dim while hovering to keep focus on the song being rated
- **Timed comments** — 💬 button opens the SC track in your browser at the exact timestamp you're listening at
- **Loop mode** — loop the current song, the whole playlist, or play straight through
- **Dark / Light / System theme** — follows your OS or set it manually in settings; the SoundCloud player inverts to match, while album art always shows in natural colors
- **Auto-scroll** — scrolls to the first unvoted song on load (toggle in options)
- **Persistent session** — stays logged in between launches
- **Auto-login** — saves credentials and logs in automatically on next launch

> Due to SoundCloud limitations, comment has to be added on SC page, thus, comment icon opens it in the browser

> Due to SoundCloud limitations, opened comment page starts the song playbeck. Prace SPACE bar to stop it immediatelly (or mute the browser)

![Screenshot](docs/screenshot.gif)

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
Internet Browsers and some other apps that participate in Apple's quarantine system adds quarantine flags to downloaded but unsigned files (like **OSC Voting**). It may be worked around several ways:

**Option 1 - download with curl (recommended, no quarantine flag is set):**
```bash
curl -LJO https://github.com/michal-bartak/OSC-Votes/releases/latest/download/OSC-Voting-vX.X.X-macos-universal.dmg
```
Open the downloaded `.dmg` normally — no further steps needed.

**Option 2 — already downloaded via browser:**
Open the .dmg, drag the app to Applications, then run once in Terminal:
```bash
xattr -d com.apple.quarantine /Applications/OSC-Voting.app
```
After that you can run app normally. You won't need to do this again.

### Linux
The packages declare runtime dependencies, so your package manager will install them automatically.

**Debian / Ubuntu:**
```bash
sudo apt install ./OSC-Voting-vX.X.X-linux-amd64.deb
```

**Fedora / RHEL / openSUSE:**
```bash
sudo dnf install ./OSC-Voting-vX.X.X-linux-amd64.rpm
```

If the app fails to start despite the package being installed, install the runtime libraries manually:
```bash
sudo apt install libgtk-3-0 libwebkit2gtk-4.1-0          # Debian/Ubuntu 24.04+
sudo dnf install gtk3 webkit2gtk4.1                       # Fedora 38+
sudo dnf install gtk3 webkit2gtk3                         # Fedora 37 and older / RHEL 9
```

## Building from source

**Requirements:**
- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+ with npm](https://nodejs.org)
- [Wails v2](https://wails.io): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

```bash
git clone https://github.com/michal-bartak/OSC-Votings.git
cd OSC-Votings
wails build -platform windows/amd64    # or: darwin/universal  linux/amd64
```

Output binary lands in `build/bin/`.

For live development with hot reload:
```bash
wails dev
```
