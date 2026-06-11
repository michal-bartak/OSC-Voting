package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func appConfigFilePath() string {
	return filepath.Join(configDir(), "config.json")
}

func (a *App) GetConfigPath() string {
	return appConfigFilePath()
}

func (a *App) GetConfig() (*Config, error) {
	data, err := os.ReadFile(appConfigFilePath())
	if os.IsNotExist(err) {
		return &Config{AutoScrollToUnvoted: false}, nil
	}
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return &Config{AutoScrollToUnvoted: false}, nil
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
