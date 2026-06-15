---
name: user-preferences
description: "How Michal likes to work, communication preferences, and feedback patterns"
metadata: 
  node_type: memory
  type: user
  originSessionId: 19358bd9-1049-44e2-98d1-de520d816356
---

Michal Bartak is building OSC Voting as a personal tool for a music challenge he participates in. He is comfortable with technical decisions and gives clear, concise feedback.

**Communication style:**
- Prefers short, direct responses — doesn't need lengthy explanations
- Gives terse feedback like "it's ok", "make it bigger", "does not work" — act on these directly
- Asks clarifying questions himself when needed; doesn't need hand-holding
- Uses plan mode for significant features; approves plans before execution

**Decision patterns:**
- Prefers simplicity over cleverness — rejected the local SSE server approach for tab reuse in favour of the simpler "just open a new browser tab" approach
- Rejected AppleScript for tab reuse because it required macOS Automation permission — privacy/permission-prompt concern
- Chose React+TypeScript when given a choice for the frontend
- Wants single self-contained executables (no server/client split, no runtime deps on end-user machine)

**Feedback given:**
- "I don't like this approach" → immediately revert, don't argue
- "make it even bigger" → keep going until they say it's ok
- Appreciates when something "just works" silently (e.g. auto-login without showing a login page)
- Prefers `cursor: default` on disabled/inactive elements — not `cursor: not-allowed`

**Technical background:**
- Comfortable with the full stack (Go, TypeScript, desktop app concepts)
- Understands Wails, SoundCloud Widget API, browser security model
- Participates in One Synth Challenge (onesynthchallenge.org) — electronic music production competition

**Project context:**
- Personal tool, single-user; developed on macOS, now primary dev machine is Windows
- Votes on ~20 SoundCloud tracks per challenge round
- Wants to add timed comments to tracks while listening
