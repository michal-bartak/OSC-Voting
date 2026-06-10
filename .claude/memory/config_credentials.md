---
name: config-credentials
description: "Config file location, credential storage design, auto-login startup flow"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

## Config file

Path: `~/.config/osc/config.json` (permissions 0o600)
Format:
```json
{
  "autoScrollToUnvoted": true,
  "email": "user@example.com",
  "password": "plaintext"
}
```

Passwords stored as plaintext — acceptable for a personal single-user desktop app. File permissions (0o600) restrict access to the owner only.

## Config struct (models.go)
```go
type Config struct {
    AutoScrollToUnvoted bool   `json:"autoScrollToUnvoted"`
    Email               string `json:"email,omitempty"`
    Password            string `json:"password,omitempty"`
}
```

`omitempty` means empty credentials are not written as `""` to JSON.

## Credential saving

`Login()` in `app.go` saves credentials automatically on every successful login:
```go
if cfg, err := a.GetConfig(); err == nil {
    cfg.Email = email
    cfg.Password = password
    a.SaveConfig(*cfg)
}
```

This means both the initial login page and the SettingsPopup save credentials via the same path — no duplicate logic.

## IMPORTANT: SaveConfig must preserve all fields

When calling `SaveConfig` from the frontend (e.g. toggling auto-scroll), always pass all Config fields including stored email/password, otherwise they get overwritten with empty strings:
```typescript
await SaveConfig(main.Config.createFrom({
  autoScrollToUnvoted: checked,
  email: storedEmail,      // ← must preserve
  password: storedPassword // ← must preserve
}));
```

`storedEmail` and `storedPassword` are kept in VotingPage component state, loaded on mount from `GetConfig()`.

## Auto-login startup flow (App.tsx)

```
IsLoggedIn()
  → true: show VotingPage
  → false:
      GetConfig()
        → has email + password: Login(email, password)
            → success: show VotingPage
            → failure: show LoginPage with { initialEmail, initialError: "Session expired..." }
        → no credentials: show LoginPage
```

## Session file

Path: `~/.config/osc/session.json` (permissions 0o600)
Format: `{"sessionid": "abc123..."}`
Loaded on startup by `loadSession()` in `client.go` before any requests.

## configDir() helper

Defined in `client.go`:
```go
func configDir() string {
    home, _ := os.UserHomeDir()
    return filepath.Join(home, ".config", "osc")
}
```
