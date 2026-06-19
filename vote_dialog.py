import sys
import os
import math
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, Pango

title   = sys.argv[1] if len(sys.argv) > 1 else ""
current = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 0
theme   = sys.argv[3] if len(sys.argv) > 3 else "system"


def _resolve_dark(name):
    if name == "day":
        return False
    if name == "night":
        return True
    # "system" (or anything unknown): follow the desktop's GTK preference.
    try:
        return bool(Gtk.Settings.get_default()
                    .get_property("gtk-application-prefer-dark-theme"))
    except Exception:
        return True


# Palettes mirror the app's theme tokens (frontend/src/App.css).
DARK = {
    "win_bg": "#1a1a1a", "win_border": "#3c3c3c",
    "title": "#b0b0b0",
    "btn_bg": "#2e2e2e", "btn_c": "#ffffff", "btn_border": "#4a4a4a",
    "btn_hover_bg": "#3d3d3d", "btn_hover_border": "#666666", "btn_press_bg": "#222222",
    "active_bg": "#ff5500", "active_border": "#cc4400", "active_c": "#ffffff", "active_hover_bg": "#e64d00",
    "close_bg": "#333333", "close_c": "#999999", "close_hover_bg": "#ff3b30", "close_hover_c": "#ffffff",
}
LIGHT = {
    "win_bg": "#ffffff", "win_border": "#e0e3e8",
    "title": "#666666",
    "btn_bg": "#eeeff2", "btn_c": "#111111", "btn_border": "#d0d4db",
    "btn_hover_bg": "#e3e6ec", "btn_hover_border": "#b0b5bf", "btn_press_bg": "#d8dbe0",
    "active_bg": "#ff5500", "active_border": "#cc4400", "active_c": "#ffffff", "active_hover_bg": "#e64d00",
    "close_bg": "#e0e3e8", "close_c": "#888888", "close_hover_bg": "#ff3b30", "close_hover_c": "#ffffff",
}

dark = _resolve_dark(theme)
P = DARK if dark else LIGHT


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0)


# background-image: none is required to override GTK's default gradient theme.
CSS = ("""
window {
    background-color: %(win_bg)s;
    border: 1px solid %(win_border)s;
    border-radius: 13px;
}
label.song-title {
    color: %(title)s;
    font-size: 12px;
}
button {
    background-image: none;
    background-color: %(btn_bg)s;
    color: %(btn_c)s;
    font-size: 15px;
    font-weight: bold;
    border-radius: 5px;
    border: 1.5px solid %(btn_border)s;
    padding: 0;
    box-shadow: none;
    text-shadow: none;
    outline: none;
    min-width: 44px;
    min-height: 40px;
}
button:hover {
    background-image: none;
    background-color: %(btn_hover_bg)s;
    border-color: %(btn_hover_border)s;
}
button:active {
    background-image: none;
    background-color: %(btn_press_bg)s;
}
button.vote-active {
    background-image: none;
    background-color: %(active_bg)s;
    border-color: %(active_border)s;
    color: %(active_c)s;
}
button.vote-active:hover {
    background-image: none;
    background-color: %(active_hover_bg)s;
}
button.close-btn {
    background-image: none;
    background-color: %(close_bg)s;
    border: none;
    color: %(close_c)s;
    font-size: 10px;
    min-width: 19px;
    min-height: 19px;
    padding: 0;
    box-shadow: none;
    /* circle: radius must be >= half the diameter */
    border-radius: 10px;
}
button.close-btn:hover {
    background-image: none;
    background-color: %(close_hover_bg)s;
    color: %(close_hover_c)s;
}
""" % P).encode()


class VotePopup(Gtk.Window):
    def __init__(self):
        super().__init__(type=Gtk.WindowType.TOPLEVEL)
        # POPUP_MENU type hint reliably suppresses window decorations under
        # GNOME/Mutter with XWayland; set_decorated(False) alone is not enough.
        self.set_type_hint(Gdk.WindowTypeHint.POPUP_MENU)
        self.set_keep_above(True)
        self.set_resizable(False)
        self.set_skip_taskbar_hint(True)
        self.set_skip_pager_hint(True)

        self._bg = _hex_to_rgb(P["win_bg"])
        self._border = _hex_to_rgb(P["win_border"])

        # Enable RGBA visual for potential compositor transparency support.
        screen = self.get_screen()
        visual = screen.get_rgba_visual()
        if visual:
            self.set_visual(visual)
            self.set_app_paintable(True)
            self.connect("draw", self._on_draw)

        provider = Gtk.CssProvider()
        provider.load_from_data(CSS)
        Gtk.StyleContext.add_provider_for_screen(
            screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

        # Overlay lets the close button float in the very corner instead of
        # sitting inline with the title (which made the right margin look wider
        # and aligned the [x] with the track name).
        overlay = Gtk.Overlay()
        self.add(overlay)

        outer = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        outer.set_margin_top(9)
        outer.set_margin_bottom(15)
        outer.set_margin_start(15)
        outer.set_margin_end(15)
        overlay.add(outer)

        # Header: song title only (close button is overlaid in the corner)
        header = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=4)

        lbl = Gtk.Label(label=title)
        lbl.set_ellipsize(Pango.EllipsizeMode.END)
        lbl.set_max_width_chars(32)
        lbl.set_hexpand(True)
        lbl.set_halign(Gtk.Align.START)
        # Reserve space on the right so a long title ellipsizes before it would
        # run under the corner close button.
        lbl.set_margin_end(10)
        lbl.get_style_context().add_class("song-title")

        header.pack_start(lbl, True, True, 0)
        outer.pack_start(header, False, False, 0)

        # Circular close button, anchored to the top-right corner (macOS-style).
        x_btn = Gtk.Button(label="✕")
        x_btn.get_style_context().add_class("close-btn")
        x_btn.set_halign(Gtk.Align.END)
        x_btn.set_valign(Gtk.Align.START)
        x_btn.set_margin_top(3)
        x_btn.set_margin_end(3)
        x_btn.set_size_request(19, 19)
        x_btn.connect("clicked", lambda *_: Gtk.main_quit())
        overlay.add_overlay(x_btn)

        # Five vote buttons in a row
        btn_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=11)
        for i in range(1, 6):
            b = Gtk.Button(label=str(i))
            b.set_size_request(44, 40)
            if i == current:
                b.get_style_context().add_class("vote-active")
            b.connect("clicked", self._on_vote, i)
            btn_row.pack_start(b, True, True, 0)
        outer.pack_start(btn_row, False, False, 0)

        self.connect("key-press-event", self._on_key)

    def _on_draw(self, widget, cr):
        # set_app_paintable(True) makes GTK skip rendering the CSS `window`
        # background, so WE own all background painting here. Draw the rounded
        # card + border ourselves; the corners outside the radius stay
        # transparent (RGBA visual). Returning False lets the default handler
        # paint the child widgets on top. (The CSS `window` rule is the
        # fallback for the no-RGBA-visual path where app_paintable is off.)
        w = widget.get_allocated_width()
        h = widget.get_allocated_height()
        r = 13

        cr.set_source_rgba(0, 0, 0, 0)
        cr.set_operator(1)  # cairo.OPERATOR_SOURCE: clear to transparent
        cr.paint()
        cr.set_operator(2)  # cairo.OPERATOR_OVER

        # Rounded-rect path, inset 0.5px so the 1px stroke stays crisp.
        deg = math.pi / 180.0
        x0, y0 = 0.5, 0.5
        x1, y1 = w - 0.5, h - 0.5
        cr.new_sub_path()
        cr.arc(x1 - r, y0 + r, r, -90 * deg, 0 * deg)
        cr.arc(x1 - r, y1 - r, r, 0 * deg, 90 * deg)
        cr.arc(x0 + r, y1 - r, r, 90 * deg, 180 * deg)
        cr.arc(x0 + r, y0 + r, r, 180 * deg, 270 * deg)
        cr.close_path()

        cr.set_source_rgba(self._bg[0], self._bg[1], self._bg[2], 1.0)
        cr.fill_preserve()
        cr.set_line_width(1)
        cr.set_source_rgba(self._border[0], self._border[1], self._border[2], 1.0)
        cr.stroke()
        return False

    def _on_vote(self, widget, n):
        print(n, flush=True)
        Gtk.main_quit()

    def _on_key(self, widget, event):
        if event.keyval == 65307:  # Escape
            Gtk.main_quit()


win = VotePopup()
win.connect("destroy", Gtk.main_quit)
win.show_all()
win.present()

# Position the popup to match where the desktop shows notifications. There is
# no standard API to query the notification daemon's placement, so this is a
# per-desktop heuristic based on each DE's default corner.
display = Gdk.Display.get_default()
monitor = display.get_primary_monitor()
area    = monitor.get_workarea()  # excludes panels/docks, unlike get_geometry()
w, h    = win.get_size()
margin  = 12
desktop = os.environ.get("XDG_CURRENT_DESKTOP", "").lower()

if "gnome" in desktop:
    # GNOME Shell shows notifications at the top centre.
    x = area.x + (area.width - w) // 2
    y = area.y + margin
elif "kde" in desktop or "plasma" in desktop:
    # KDE Plasma shows them near the system tray (bottom-right by default).
    x = area.x + area.width - w - margin
    y = area.y + area.height - h - margin
else:
    # XFCE, Cinnamon, MATE, Budgie, LXQt, elementary, …: top-right by default.
    x = area.x + area.width - w - margin
    y = area.y + margin

win.move(x, y)

Gtk.main()
