package main

type Song struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	SoundCloudURL string `json:"soundCloudUrl"`
	CurrentVote   int    `json:"currentVote"`
}

type AppState struct {
	Songs           []Song `json:"songs"`
	ChallengeNumber int    `json:"challengeNumber"`
}

type Config struct {
	AutoScrollToUnvoted   *bool  `json:"autoScrollToUnvoted,omitempty"`
	FollowPlayback        *bool  `json:"followPlayback,omitempty"`
	Email                 string `json:"email,omitempty"`
	Password              string `json:"password,omitempty"`
	Theme                 string `json:"theme,omitempty"`        // "day" | "night" | "system" (default)
	DisplayEmail          string `json:"displayEmail,omitempty"` // if set, shown instead of real email in UI
	PlayerSize            string `json:"playerSize,omitempty"`   // "minimal" | "medium" | "large" (default)
	WindowWidth           int    `json:"windowWidth,omitempty"`
	WindowHeight          int    `json:"windowHeight,omitempty"`
	NotificationsEnabled  *bool  `json:"notificationsEnabled,omitempty"`
	NotificationThreshold int    `json:"notificationThreshold,omitempty"` // 50-95, default 80
	NotificationSkipVoted *bool  `json:"notificationSkipVoted,omitempty"`
	CheckUpdatesOnStart   *bool  `json:"checkUpdatesOnStart,omitempty"` // default true; on-startup GitHub-Releases check
	UpdateSeenVersion     string `json:"updateSeenVersion,omitempty"`   // last version the startup popup showed (suppresses re-nagging)
}

// UpdateInfo is the result of a GitHub-Releases version check.
type UpdateInfo struct {
	CurrentVersion  string `json:"currentVersion"`
	LatestVersion   string `json:"latestVersion"`   // bare (no leading v); "" if no release found
	ReleaseURL      string `json:"releaseURL"`      // GitHub release page (html_url)
	UpdateAvailable bool   `json:"updateAvailable"` // LatestVersion is newer than CurrentVersion
}
