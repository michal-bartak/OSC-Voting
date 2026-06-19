import sys
import math
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, Pango

title   = sys.argv[1] if len(sys.argv) > 1 else ""
current = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 0

# background-image: none is required to override GTK's default gradient theme.
CSS = b"""
window {
    background-color: #1a1a1a;
    border: 1px solid #3c3c3c;
    border-radius: 13px;
}
label.song-title {
    color: #b0b0b0;
    font-size: 12px;
}
button {
    background-image: none;
    background-color: #2e2e2e;
    color: #ffffff;
    font-size: 15px;
    font-weight: bold;
    border-radius: 5px;
    border: 1.5px solid #4a4a4a;
    padding: 0;
    box-shadow: none;
    text-shadow: none;
    outline: none;
    min-width: 44px;
    min-height: 40px;
}
button:hover {
    background-image: none;
    background-color: #3d3d3d;
    border-color: #666666;
}
button:active {
    background-image: none;
    background-color: #222;
}
button.vote-active {
    background-image: none;
    background-color: #ff5500;
    border-color: #cc4400;
    color: #ffffff;
}
button.vote-active:hover {
    background-image: none;
    background-color: #e64d00;
}
button.close-btn {
    background-image: none;
    background-color: #333333;
    border: none;
    color: #999999;
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
    background-color: #ff3b30;
    color: #ffffff;
}
"""


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
        # dark card + border ourselves; the corners outside the radius stay
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

        cr.set_source_rgba(0x1a / 255, 0x1a / 255, 0x1a / 255, 1.0)  # #1a1a1a
        cr.fill_preserve()
        cr.set_line_width(1)
        cr.set_source_rgba(0x3c / 255, 0x3c / 255, 0x3c / 255, 1.0)  # #3c3c3c
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

# Position near GNOME notification: top-centre of the primary monitor
display = Gdk.Display.get_default()
monitor = display.get_primary_monitor()
geo     = monitor.get_geometry()
w, _h   = win.get_size()
win.move(geo.x + (geo.width - w) // 2, geo.y + 72)

Gtk.main()
