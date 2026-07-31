package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// repoURL is the canonical GitHub repository; the update check parses OWNER/REPO from it.
const repoURL = "https://github.com/michal-bartak/OSC-Voting"

// updateAPIBase is the GitHub REST API root; overridable in tests.
var updateAPIBase = "https://api.github.com"

// updateHTTPTimeout bounds the whole release lookup so a slow network never blocks the UI.
const updateHTTPTimeout = 6 * time.Second

type ghRelease struct {
	TagName string `json:"tag_name"`
	HTMLURL string `json:"html_url"`
}

// checkForUpdate queries GitHub for the latest release of repoURL and compares it against
// currentVersion. A repo with no releases (404) is reported as "up to date" (not an error).
// Network/parse failures return an error. Uses http.DefaultClient (NOT the app's cookie-jar
// client) so no OSC session cookies are ever sent to GitHub.
func checkForUpdate(ctx context.Context, currentVersion string) (UpdateInfo, error) {
	info := UpdateInfo{CurrentVersion: strings.TrimSpace(currentVersion)}
	owner, repo, ok := ownerRepo(repoURL)
	if !ok {
		return info, fmt.Errorf("not a GitHub repo URL: %q", repoURL)
	}

	ctx, cancel := context.WithTimeout(ctx, updateHTTPTimeout)
	defer cancel()
	url := fmt.Sprintf("%s/repos/%s/%s/releases/latest", updateAPIBase, owner, repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return info, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "OSC-Voting")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return info, err
	}
	defer resp.Body.Close()

	// No releases published yet — treat as up to date, not an error.
	if resp.StatusCode == http.StatusNotFound {
		return info, nil
	}
	if resp.StatusCode != http.StatusOK {
		return info, fmt.Errorf("github releases: HTTP %d", resp.StatusCode)
	}

	var rel ghRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return info, err
	}

	info.LatestVersion = strings.TrimPrefix(strings.TrimSpace(rel.TagName), "v")
	info.ReleaseURL = rel.HTMLURL
	info.UpdateAvailable = compareVersions(info.LatestVersion, info.CurrentVersion) > 0
	return info, nil
}

// ownerRepo extracts OWNER, REPO from a https://github.com/OWNER/REPO URL.
func ownerRepo(url string) (owner, repo string, ok bool) {
	rest, found := strings.CutPrefix(strings.TrimSpace(url), "https://github.com/")
	if !found {
		return "", "", false
	}
	parts := strings.SplitN(strings.Trim(rest, "/"), "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", false
	}
	return parts[0], strings.TrimSuffix(parts[1], ".git"), true
}

// compareVersions compares two MAJOR.MINOR.PATCH strings (leading "v" and any "-prerelease" or
// "+build" suffix are ignored). Returns -1, 0, or 1. Missing components are treated as 0, and a
// non-numeric component sorts as 0, so a malformed remote tag can't spuriously look "newer".
func compareVersions(a, b string) int {
	an, bn := parseVersion(a), parseVersion(b)
	for i := 0; i < 3; i++ {
		if an[i] != bn[i] {
			if an[i] > bn[i] {
				return 1
			}
			return -1
		}
	}
	return 0
}

func parseVersion(s string) [3]int {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "v")
	// Drop any prerelease/build metadata: 0.4.0-rc1 / 0.4.0+build → 0.4.0.
	if i := strings.IndexAny(s, "-+"); i >= 0 {
		s = s[:i]
	}
	var out [3]int
	for i, part := range strings.SplitN(s, ".", 3) {
		if i > 2 {
			break
		}
		n, err := strconv.Atoi(strings.TrimSpace(part))
		if err == nil && n > 0 {
			out[i] = n
		}
	}
	return out
}
