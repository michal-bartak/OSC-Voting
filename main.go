package main

import (
	"embed"
	"os"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// On Linux, XWayland gives WebKit2GTK proper GPU acceleration for CSS
	// filters. Native Wayland uses DMA-buf which falls back to software
	// rendering for blur/opacity on many driver configurations.
	// Respect explicit user override via GDK_BACKEND env var.
	if runtime.GOOS == "linux" && os.Getenv("GDK_BACKEND") == "" {
		os.Setenv("GDK_BACKEND", "x11")
	}

	app := NewApp()

	width, height := 1200, 820
	if cfg, err := loadConfig(); err == nil {
		if cfg.WindowWidth >= 900 {
			width = cfg.WindowWidth
		}
		if cfg.WindowHeight >= 600 {
			height = cfg.WindowHeight
		}
	}

	err := wails.Run(&options.App{
		Title:     appName + " v" + appVersion,
		Width:     width,
		Height:    height,
		MinWidth:  900,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 18, G: 18, B: 18, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
