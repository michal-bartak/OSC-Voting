---
name: api-reference
description: "OSC site API endpoints, auth, voting, session cookie details"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

Base URL: `https://www.onesynthchallenge.org` (constant `oscBaseURL` in client.go)

## Auth — POST /
```
Content-Type: application/x-www-form-urlencoded
Body: email=...&password=...&secondary_email=
```
Success: 302 redirect to `/voting` + `Set-Cookie: sessionid=...` (HttpOnly, SameSite=Lax, ~20 day expiry)
Failure: stays on `/` (final URL path != "/voting")

## Song list + current votes — GET /voting
Returns full HTML page. Songs are in:
```html
<div id="star5">  <!-- voted 5 pts -->
  <li class="track" data-track-id="1100" data-track-url="https://soundcloud.com/..." data-track-title="Artist - Title">
<div id="star4"> ... <div id="star1">
<div id="unvotedPanel">  <!-- unvoted -->
```
Challenge number in `<script>challengeNumber = 207;</script>` — extracted by regex.
Parser: `parseVotingPage()` in parser.go using goquery.

## Vote — POST /save-vote
```json
{"track_id": "1100", "score": 5, "challenge_number": 207}
```
Reset/unvote: same with `"score": 0`
Headers required: `Content-Type: application/json`, `Referer: .../voting`, `Origin: ...`

## Session persistence
- Cookie jar persisted to `~/.config/osc/session.json` as JSON map `{name: value}`
- `loadSession()` restores on startup; `saveSession()` writes after login
- `IsLoggedIn()`: GET /voting, checks `resp.Request.URL.Path == "/voting"` after redirects

## Challenge number
Stored in `App.challengeNumber` after first `GetSongs()` call. Required for `SubmitVote`. Error if 0.
