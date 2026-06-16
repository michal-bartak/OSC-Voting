WAILS := $(shell which wails 2>/dev/null || echo ~/go/bin/wails)

.PHONY: dev build build-linux build-windows build-all

dev:
	$(WAILS) dev

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
