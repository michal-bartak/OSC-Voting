package main

import (
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/net/publicsuffix"
)

const oscBaseURL = "https://www.onesynthchallenge.org"

func configDir() string {
	home, _ := os.UserHomeDir()
	dirName := strings.ToLower(strings.ReplaceAll(appName, " ", "-"))
	return filepath.Join(home, ".config", dirName)
}

func sessionFilePath() string {
	return filepath.Join(configDir(), "session.json")
}

func newHTTPClient() (*http.Client, error) {
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		return nil, err
	}
	return &http.Client{Jar: jar}, nil
}

func (a *App) saveSession() error {
	if err := os.MkdirAll(configDir(), 0o755); err != nil {
		return err
	}
	u, _ := url.Parse(oscBaseURL)
	cookies := a.httpClient.Jar.Cookies(u)
	data := map[string]string{}
	for _, c := range cookies {
		data[c.Name] = c.Value
	}
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return os.WriteFile(sessionFilePath(), b, 0o600)
}

func (a *App) loadSession() {
	b, err := os.ReadFile(sessionFilePath())
	if err != nil {
		return
	}
	var data map[string]string
	if err := json.Unmarshal(b, &data); err != nil {
		return
	}
	u, _ := url.Parse(oscBaseURL)
	var cookies []*http.Cookie
	for name, value := range data {
		cookies = append(cookies, &http.Cookie{Name: name, Value: value, Path: "/"})
	}
	a.httpClient.Jar.SetCookies(u, cookies)
}

func (a *App) clearSession() {
	jar, _ := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	a.httpClient.Jar = jar
	os.Remove(sessionFilePath())
}
