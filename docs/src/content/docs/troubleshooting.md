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

## Linux — vote notification popup

When a track nears its end, the app sends a notification with vote buttons. Because GNOME caps notification actions at three buttons, on Linux the notification shows a single **Vote…** action that opens a small custom popup with all five vote buttons.

That popup is rendered with **Python 3 + PyGObject (GTK 3)**, which ship by default on GNOME-based desktops (including Fedora Workstation). If they are missing, the app falls back to a `zenity` dialog, and if that is absent too, it simply brings the main window to the front.

To get the styled popup on a minimal install, ensure the GTK bindings are present:

```bash
sudo dnf install python3-gobject gtk3          # Fedora / RHEL
sudo apt install python3-gi gir1.2-gtk-3.0     # Debian / Ubuntu
```

The popup follows the app's theme (Light/Dark, or System). It is placed to match where your desktop shows notifications — top-centre on GNOME, near the tray on KDE Plasma, top-right elsewhere. These are per-desktop defaults; if you have relocated notifications in your desktop settings, the popup may not line up exactly, since there is no standard way to query the notification daemon's position.
