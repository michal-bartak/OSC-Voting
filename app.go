package main

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	goruntime "runtime"
	"strconv"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed vote_dialog.py
var linuxVoteScript string

const appName = "OSC Voting"

type pendingSong struct {
	title       string
	currentVote int
}

// App is the main application struct bound to the Wails frontend.
type App struct {
	ctx             context.Context
	httpClient      *http.Client
	challengeNumber int
	pendingSongs    sync.Map // songID → pendingSong
}

func NewApp() *App {
	client, err := newHTTPClient()
	if err != nil {
		log.Fatal(err)
	}
	return &App{httpClient: client}
}

func (a *App) AppName() string    { return appName }
func (a *App) AppVersion() string { return appVersion }

func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.loadSession()
	a.initNotifications()
}

func (a *App) initNotifications() {
	if err := runtime.InitializeNotifications(a.ctx); err != nil {
		log.Printf("notifications: init failed: %v", err)
		return
	}
	if _, err := runtime.RequestNotificationAuthorization(a.ctx); err != nil {
		log.Printf("notifications: authorization request failed: %v", err)
	}

	if goruntime.GOOS == "linux" {
		// GNOME shows at most 3 action buttons; use a single trigger that opens a zenity dialog.
		if err := runtime.RegisterNotificationCategory(a.ctx, runtime.NotificationCategory{
			ID:      "vote-linux",
			Actions: []runtime.NotificationAction{{ID: "rate", Title: "Vote…"}},
		}); err != nil {
			log.Printf("notifications: register category failed: %v", err)
			return
		}
	} else {
		if err := runtime.RegisterNotificationCategory(a.ctx, runtime.NotificationCategory{
			ID: "vote",
			Actions: []runtime.NotificationAction{
				{ID: "1", Title: "1"},
				{ID: "2", Title: "2"},
				{ID: "3", Title: "3"},
				{ID: "4", Title: "4"},
				{ID: "5", Title: "5"},
			},
		}); err != nil {
			log.Printf("notifications: register category failed: %v", err)
			return
		}
	}

	runtime.OnNotificationResponse(a.ctx, func(result runtime.NotificationResult) {
		if result.Error != nil {
			return
		}
		r := result.Response
		if goruntime.GOOS == "linux" && r.ActionIdentifier == "rate" {
			go a.showLinuxVoteDialog(r.ID)
			return
		}
		// Only forward our numbered vote actions; ignore the default "clicked notification" action.
		if r.ActionIdentifier < "1" || r.ActionIdentifier > "5" {
			return
		}
		runtime.EventsEmit(a.ctx, "notification:vote", r.ID, r.ActionIdentifier)
	})
}

func (a *App) showLinuxVoteDialog(songID string) {
	defer a.pendingSongs.Delete(songID)
	v, ok := a.pendingSongs.Load(songID)
	if !ok {
		return
	}
	song := v.(pendingSong)

	// Primary: custom GTK3 popup via embedded Python script.
	// Force GDK_BACKEND=x11 so the window runs under XWayland: Wayland's
	// compositor otherwise withholds focus from undecorated popup windows,
	// making the vote buttons non-interactive.
	// Pass the app's theme so the popup matches light/dark; "system" lets the
	// script follow the desktop's GTK preference.
	theme := "system"
	if cfg, err := a.GetConfig(); err == nil && cfg.Theme != "" {
		theme = cfg.Theme
	}

	if pythonPath, err := exec.LookPath("python3"); err == nil {
		var stdout bytes.Buffer
		cmd := exec.Command(pythonPath, "-c", linuxVoteScript, song.title, strconv.Itoa(song.currentVote), theme)
		cmd.Stdout = &stdout
		cmd.Env = append(os.Environ(), "GDK_BACKEND=x11")
		_ = cmd.Run() // non-zero exit = user cancelled; still check stdout
		vote := strings.TrimSpace(stdout.String())
		if vote >= "1" && vote <= "5" {
			runtime.EventsEmit(a.ctx, "notification:vote", songID, vote)
		}
		return
	}

	// Fallback: zenity list dialog.
	if zenityPath, err := exec.LookPath("zenity"); err == nil {
		args := []string{
			"--list", "--radiolist",
			"--column=", "--column=Vote",
			"--title=Rate this track",
			"--text=" + song.title,
			"--hide-header",
			"--width=180", "--height=260",
		}
		for i := 1; i <= 5; i++ {
			sel := "FALSE"
			if i == song.currentVote {
				sel = "TRUE"
			}
			args = append(args, sel, strconv.Itoa(i))
		}
		out, err := exec.Command(zenityPath, args...).Output()
		if err != nil {
			return
		}
		vote := strings.TrimSpace(string(out))
		if vote >= "1" && vote <= "5" {
			runtime.EventsEmit(a.ctx, "notification:vote", songID, vote)
		}
		return
	}

	// Last resort: bring the app window to the foreground.
	runtime.WindowShow(a.ctx)
}

func (a *App) NotifyNearEnd(songID, title string, currentVote int) error {
	categoryID := "vote"
	if goruntime.GOOS == "linux" {
		a.pendingSongs.Store(songID, pendingSong{title: title, currentVote: currentVote})
		categoryID = "vote-linux"
	}
	opts := runtime.NotificationOptions{
		ID:         songID,
		Title:      "Rate this track",
		Subtitle:   title,
		CategoryID: categoryID,
	}
	// On Linux the current vote is shown visually (highlighted button) in the
	// popup, so the redundant body text is omitted. On Windows/macOS the toast
	// buttons can't indicate it, so keep the text there.
	if currentVote > 0 && goruntime.GOOS != "linux" {
		opts.Body = fmt.Sprintf("Your vote: %d", currentVote)
	}
	return runtime.SendNotificationWithActions(a.ctx, opts)
}

func (a *App) UpdateNotificationsEnabled(enabled bool) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.NotificationsEnabled = boolPtr(enabled)
	return a.SaveConfig(*cfg)
}

func (a *App) UpdateNotificationThreshold(pct int) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.NotificationThreshold = pct
	return a.SaveConfig(*cfg)
}

func (a *App) UpdateNotificationSkipVoted(val bool) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.NotificationSkipVoted = boolPtr(val)
	return a.SaveConfig(*cfg)
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
	cfg.AutoScrollToUnvoted = boolPtr(enabled)
	return a.SaveConfig(*cfg)
}

// UpdateFollowPlayback persists only the followPlayback field.
func (a *App) UpdateFollowPlayback(enabled bool) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.FollowPlayback = boolPtr(enabled)
	return a.SaveConfig(*cfg)
}

// UpdatePlayerSize persists only the playerSize field.
func (a *App) UpdatePlayerSize(size string) error {
	cfg, err := a.GetConfig()
	if err != nil {
		return err
	}
	cfg.PlayerSize = size
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
