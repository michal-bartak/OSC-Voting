WAILS := $(shell which wails 2>/dev/null || echo ~/go/bin/wails)

# On Linux, XWayland gives WebKit2GTK GPU-accelerated CSS filters.
# Native Wayland's DMA-buf path falls back to software rendering for blur/opacity.
ifeq ($(shell uname), Linux)
	ENV := GDK_BACKEND=x11
endif

.PHONY: dev run build build-linux build-windows build-all

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
