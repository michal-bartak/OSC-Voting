---
title: Troubleshooting
description: Solutions for known issues with OSC Voting
---

## Linux — Wayland rendering performance

The shipped `.desktop` file launches the app under XWayland (`GDK_BACKEND=x11`), which gives WebKit2GTK proper GPU-accelerated rendering for CSS effects and fixes multi-monitor positioning issues on some compositors. **This is handled automatically when you install via the provided package — no manual steps needed.**

:::note
After installing or updating the `.desktop` file, a **log out and back in** is required for GNOME Shell to pick up the change. Launching from *Settings → Apps* does not need a re-login and can be used to verify it works immediately.
:::

If you are running the binary directly without the `.desktop` file (e.g. from a terminal or custom launcher), animations may appear sluggish and multi-monitor positioning may be off. Prefix the command with the env var:

```bash
GDK_BACKEND=x11 OSC-Voting
```
