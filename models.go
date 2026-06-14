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
	AutoScrollToUnvoted bool   `json:"autoScrollToUnvoted"`
	Email               string `json:"email,omitempty"`
	Password            string `json:"password,omitempty"`
	Theme               string `json:"theme,omitempty"`        // "day" | "night" | "system" (default)
	DisplayEmail        string `json:"displayEmail,omitempty"` // if set, shown instead of real email in UI
	PlayerSize          string `json:"playerSize,omitempty"`   // "minimal" | "small" | "medium" | "large" (default)
}
