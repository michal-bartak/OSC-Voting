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

## Getting the source

```bash
git clone https://github.com/michal-bartak/OSC-Voting.git
cd OSC-Voting
make build        # build for the current platform
```

Output lands in `build/bin/`.

## Make commands

The `Makefile` wraps the common Wails and docs workflows.

### App

| Command | Description |
|---------|-------------|
| `make dev` | Hot-reload dev server (Go + Vite HMR). On Linux it sets `GDK_BACKEND=x11` so WebKit2GTK gets GPU-accelerated CSS filters. |
| `make run` | Run the already-built binary from `build/bin/`. |
| `make build` | Production build for the current platform (`wails build -clean`). |
| `make build-linux` | Cross-build for `linux/amd64`. |
| `make build-windows` | Cross-build for `windows/amd64`. |
| `make build-all` | Build for macOS, Linux, and Windows in one go. |

:::note
Cross-compilation (`build-linux`, `build-windows`, `build-all`) requires the matching toolchain for each target and is best left to CI.
:::

### Documentation site

This site is an [Astro Starlight](https://starlight.astro.build) project in `docs/`. These targets manage it (they auto-run `npm ci` on first use):

| Command | Description |
|---------|-------------|
| `make docs` | Hot-reload dev server for live editing. Served at `http://localhost:4321/OSC-Voting/`. |
| `make docs-build` | Build the static site into `docs/dist/` and stop — no server. Useful to confirm the build succeeds. |
| `make docs-preview` | Build, then serve the result exactly as GitHub Pages will. Use this as a final check before pushing. |

## Invoking Wails directly

If you'd rather skip the Makefile:

```bash
wails build -platform linux/amd64   # or: darwin/universal  windows/amd64
wails dev
```

Output lands in `build/bin/`. The Makefile also provides `make build-linux` and `make build-windows` for cross-platform targets, though cross-compilation requires the matching toolchain and is best left to CI.

## Cutting a release

Releases are produced by the **Release** GitHub Actions workflow
(`.github/workflows/release.yml`), triggered manually from the Actions tab. It
builds all three platforms (Windows `.exe`/`.msi`, macOS `.dmg`, Linux
`.deb`/`.rpm`) and publishes a GitHub release.

The release description is assembled from three parts: the matching
**`CHANGELOG.md`** section (top), the install instructions, and GitHub's
auto-generated **"What's Changed"** list.

To cut a release:

1. **Update `CHANGELOG.md`** — rename the `## [Unreleased]` heading to
   `## [X.Y.Z] - YYYY-MM-DD` and start a fresh empty `## [Unreleased]` above it.
   The heading must match the `VERSION` file exactly (that's how the workflow
   finds the section to inject).
2. **Bump `VERSION`** to `X.Y.Z`.
3. Commit, then create and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
   (the workflow verifies the tag equals `v` + `VERSION`).
4. Run the **Release** workflow, entering the tag. Use the *draft* option to
   review the generated release before publishing.
