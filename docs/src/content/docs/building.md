---
title: Building from Source
description: How to build OSC Voting from source using Go, Node.js, and Wails
---

## Requirements

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org)
- [Wails v2](https://wails.io): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Linux build dependencies

```bash
# Debian/Ubuntu 24.04+
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev build-essential pkg-config

# Fedora 38+
sudo dnf install gtk3-devel webkit2gtk4.1-devel gcc-c++ pkgconf-pkg-config
```

:::note
On older distros shipping only WebKit 4.0 (Ubuntu 22.04, RHEL 9), remove `"build:tags": "webkit2_41"` from `wails.json` and install `libwebkit2gtk-4.0-dev` / `webkit2gtk3-devel` instead.
:::

## Commands

```bash
git clone https://github.com/michal-bartak/OSC-Voting.git
cd OSC-Voting
make build        # build for the current platform
make dev          # hot-reload dev server
```

Or invoke Wails directly:
```bash
wails build -platform linux/amd64   # or: darwin/universal  windows/amd64
wails dev
```

Output lands in `build/bin/`. The Makefile also provides `make build-linux` and `make build-windows` for cross-platform targets, though cross-compilation requires the matching toolchain and is best left to CI.
