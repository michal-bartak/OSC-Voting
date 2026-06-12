//go:build !linux

package main

// IsSystemDark is only used on Linux; other platforms rely on prefers-color-scheme in the webview.
func (a *App) IsSystemDark() bool {
	return false
}
