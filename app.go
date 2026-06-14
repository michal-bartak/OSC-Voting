package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const appName = "OSC Voting"

// App is the main application struct bound to the Wails frontend.
type App struct {
	ctx             context.Context
	httpClient      *http.Client
	challengeNumber int
}

func NewApp() *App {
	client, err := newHTTPClient()
	if err != nil {
		log.Fatal(err)
	}
	return &App{httpClient: client}
}

func (a *App) AppName() string { return appName }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.loadSession()
}

func (a *App) IsLoggedIn() bool {
	resp, err := a.httpClient.Get(oscBaseURL + "/voting")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	return resp.Request.URL.Path == "/voting"
}

func (a *App) Login(email, password string) error {
	formData := url.Values{
		"email":           {email},
		"password":        {password},
		"secondary_email": {""},
	}
	resp, err := a.httpClient.PostForm(oscBaseURL+"/", formData)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.Request.URL.Path != "/voting" {
		return fmt.Errorf("invalid credentials")
	}
	if err := a.saveSession(); err != nil {
		return err
	}
	// Persist credentials so the app can auto-login after session expiry.
	if cfg, err := a.GetConfig(); err == nil {
		cfg.Email = email
		cfg.Password = password
		if err := a.SaveConfig(*cfg); err != nil {
			log.Printf("warning: could not save credentials: %v", err)
		}
	}
	return nil
}

func (a *App) Logout() {
	a.clearSession()
	a.challengeNumber = 0
}

func (a *App) GetSongs() (*AppState, error) {
	resp, err := a.httpClient.Get(oscBaseURL + "/voting")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.Request.URL.Path != "/voting" {
		return nil, fmt.Errorf("session expired — please log in again")
	}
	state, err := parseVotingPage(resp.Body)
	if err != nil {
		return nil, err
	}
	a.challengeNumber = state.ChallengeNumber
	return state, nil
}

func (a *App) SubmitVote(songID string, points int) error {
	if a.challengeNumber == 0 {
		return fmt.Errorf("challenge number not loaded — call GetSongs first")
	}
	payload := map[string]interface{}{
		"track_id":         songID,
		"score":            points,
		"challenge_number": a.challengeNumber,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", oscBaseURL+"/save-vote", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Referer", oscBaseURL+"/voting")
	req.Header.Set("Origin", oscBaseURL)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode != 200 {
		return fmt.Errorf("save-vote returned status %d", resp.StatusCode)
	}
	return nil
}

// UpdateTheme persists only the theme field without touching other config values.
func (a *App) UpdateTheme(theme string) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.Theme = theme
	return a.SaveConfig(*cfg)
}

// UpdateAutoScroll persists only the autoScrollToUnvoted field.
func (a *App) UpdateAutoScroll(enabled bool) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.AutoScrollToUnvoted = enabled
	return a.SaveConfig(*cfg)
}

func (a *App) OpenCommentInBrowser(trackURL string, positionMs float64) {
	totalSecs := int(positionMs) / 1000
	mins := totalSecs / 60
	secs := totalSecs % 60
	base := trackURL
	if idx := strings.Index(trackURL, "?"); idx != -1 {
		base = trackURL[:idx]
	}
	fullURL := fmt.Sprintf("%s#t=%dm%02ds", base, mins, secs)
	runtime.BrowserOpenURL(a.ctx, fullURL)
}
