---
title: Installation
nav_order: 2
---

# Installation

## Download

Get the latest release from the [Releases page](https://github.com/michal-bartak/OSC-Voting/releases).

| Platform | File |
|----------|------|
| Windows | `OSC-Voting-vX.X.X-windows-amd64.zip` → extract, run `OSC-Voting.exe` |
| macOS | `OSC-Voting-vX.X.X-macos-universal.dmg` → open, drag to Applications |
| Linux (Debian/Ubuntu) | `OSC-Voting-vX.X.X-linux-amd64.deb` → `sudo apt install ./OSC-Voting-*.deb` |
| Linux (Fedora/RHEL) | `OSC-Voting-vX.X.X-linux-amd64.rpm` → `sudo dnf install ./OSC-Voting-*.rpm` |

## Windows

SmartScreen may warn on first launch. Click **More info → Run anyway**.

## macOS

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

## Linux

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
