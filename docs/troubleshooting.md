---
title: Troubleshooting
nav_order: 4
---

# Troubleshooting

## Linux — multi-monitor rendering issues on Wayland

On some multi-monitor Wayland setups (e.g. Ubuntu 24.04) the window may open on the wrong display or render incorrectly. The app runs natively on Wayland by default; forcing the GTK backend to X11 (via XWayland) resolves it.

**One-off (terminal):**
```bash
GDK_BACKEND=x11 OSC-Voting
```

**Permanent, per-app — edit the `.desktop` file:**
```bash
sudo nano /usr/share/applications/osc-voting.desktop
```
Change the `Exec=` line from:
```
Exec=OSC-Voting
```
to:
```
Exec=env GDK_BACKEND=x11 OSC-Voting
```
Save and log out/in. The launcher will now always start the app under XWayland while leaving everything else unaffected.
