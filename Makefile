WAILS := $(shell which wails 2>/dev/null || echo ~/go/bin/wails)

# On Linux, XWayland gives WebKit2GTK GPU-accelerated CSS filters.
# Native Wayland's DMA-buf path falls back to software rendering for blur/opacity.
ifeq ($(shell uname), Linux)
	ENV := GDK_BACKEND=x11
endif

.PHONY: dev run build build-linux build-windows build-all docs docs-build docs-preview

dev:
	$(ENV) $(WAILS) dev

run:
	$(ENV) ./build/bin/OSC-Voting

build:
	$(WAILS) build -clean

build-linux:
	$(WAILS) build -clean -platform linux/amd64

build-windows:
	$(WAILS) build -clean -platform windows/amd64

build-all:
	$(WAILS) build -clean -platform darwin/universal
	$(WAILS) build -clean -platform linux/amd64
	$(WAILS) build -clean -platform windows/amd64

# GitHub Pages docs (Astro Starlight, in docs/).
# Served at http://localhost:4321/OSC-Voting/ (matches the production base path).
docs:
	cd docs && { [ -d node_modules ] || npm ci; } && npm run dev

# Build the static site into docs/dist/
docs-build:
	cd docs && npm run build

# Serve the built static site exactly as GitHub Pages will
docs-preview: docs-build
	cd docs && npm run preview
