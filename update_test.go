package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCheckForUpdate(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/repos/michal-bartak/OSC-Voting/releases/latest" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"tag_name":"v1.3.0","html_url":"https://example.com/rel"}`))
	}))
	defer srv.Close()

	orig := updateAPIBase
	updateAPIBase = srv.URL
	defer func() { updateAPIBase = orig }()

	// Older running version → update available.
	info, err := checkForUpdate(context.Background(), "1.2.0")
	if err != nil {
		t.Fatalf("checkForUpdate: %v", err)
	}
	if !info.UpdateAvailable || info.LatestVersion != "1.3.0" || info.CurrentVersion != "1.2.0" {
		t.Errorf("update-available: got %+v", info)
	}
	if info.ReleaseURL != "https://example.com/rel" {
		t.Errorf("ReleaseURL = %q", info.ReleaseURL)
	}

	// Same version → up to date.
	info, err = checkForUpdate(context.Background(), "1.3.0")
	if err != nil {
		t.Fatalf("checkForUpdate: %v", err)
	}
	if info.UpdateAvailable {
		t.Errorf("expected up-to-date, got %+v", info)
	}
}

func TestCheckForUpdateNoReleases(t *testing.T) {
	// 404 (no releases published) → up to date, not an error.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	orig := updateAPIBase
	updateAPIBase = srv.URL
	defer func() { updateAPIBase = orig }()

	info, err := checkForUpdate(context.Background(), "1.2.0")
	if err != nil {
		t.Fatalf("checkForUpdate: %v", err)
	}
	if info.UpdateAvailable || info.LatestVersion != "" {
		t.Errorf("expected up-to-date with no latest, got %+v", info)
	}
}

func TestCompareVersions(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"1.2.0", "1.2.0", 0},
		{"1.2.1", "1.2.0", 1},
		{"1.2.0", "1.2.1", -1},
		{"2.0.0", "1.9.9", 1},
		{"1.10.0", "1.9.0", 1},       // numeric, not lexicographic
		{"v1.2.0", "1.2.0", 0},       // leading v ignored
		{"1.2.0-rc1", "1.2.0", 0},    // prerelease suffix dropped
		{"1.2.0+build5", "1.2.0", 0}, // build metadata dropped
		{"1.2", "1.2.0", 0},          // missing component = 0
		{"garbage", "0.0.0", 0},      // non-numeric = 0, can't look newer
	}
	for _, c := range cases {
		if got := compareVersions(c.a, c.b); got != c.want {
			t.Errorf("compareVersions(%q, %q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestOwnerRepo(t *testing.T) {
	cases := []struct {
		url         string
		owner, repo string
		ok          bool
	}{
		{"https://github.com/michal-bartak/OSC-Voting", "michal-bartak", "OSC-Voting", true},
		{"https://github.com/michal-bartak/OSC-Voting.git", "michal-bartak", "OSC-Voting", true},
		{"https://github.com/michal-bartak/OSC-Voting/", "michal-bartak", "OSC-Voting", true},
		{"https://example.com/foo/bar", "", "", false},
		{"https://github.com/onlyowner", "", "", false},
	}
	for _, c := range cases {
		owner, repo, ok := ownerRepo(c.url)
		if ok != c.ok || owner != c.owner || repo != c.repo {
			t.Errorf("ownerRepo(%q) = (%q, %q, %v), want (%q, %q, %v)",
				c.url, owner, repo, ok, c.owner, c.repo, c.ok)
		}
	}
}
