package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func appConfigFilePath() string {
	return filepath.Join(configDir(), "config.json")
}

func (a *App) GetConfigPath() string {
	return appConfigFilePath()
}

func boolPtr(b bool) *bool { return &b }

func (a *App) GetConfig() (*Config, error) {
	data, err := os.ReadFile(appConfigFilePath())
	if os.IsNotExist(err) {
		return &Config{AutoScrollToUnvoted: boolPtr(true), FollowPlayback: boolPtr(true)}, nil
	}
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("config corrupted: %w", err)
	}
	if cfg.AutoScrollToUnvoted == nil {
		cfg.AutoScrollToUnvoted = boolPtr(true)
	}
	if cfg.FollowPlayback == nil {
		cfg.FollowPlayback = boolPtr(true)
	}
	return &cfg, nil
}

func (a *App) SaveConfig(cfg Config) error {
	if err := os.MkdirAll(configDir(), 0o755); err != nil {
		return err
	}
	data, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	return os.WriteFile(appConfigFilePath(), data, 0o600)
}
