import sys
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
    border-color: #666;
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
    background-color: transparent;
    border: none;
    color: #606060;
    font-size: 11px;
    min-width: 20px;
    min-height: 20px;
    padding: 0 3px;
    box-shadow: none;
    border-radius: 3px;
}
button.close-btn:hover {
    background-image: none;
    background-color: rgba(255,255,255,0.07);
    color: #aaaaaa;
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

        outer = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        outer.set_margin_top(8)
        outer.set_margin_bottom(10)
        outer.set_margin_start(10)
        outer.set_margin_end(10)
        self.add(outer)

        # Header: song title + close button
        header = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=4)

        lbl = Gtk.Label(label=title)
        lbl.set_ellipsize(Pango.EllipsizeMode.END)
        lbl.set_max_width_chars(32)
        lbl.set_hexpand(True)
        lbl.set_halign(Gtk.Align.START)
        lbl.get_style_context().add_class("song-title")

        x_btn = Gtk.Button(label="✕")
        x_btn.get_style_context().add_class("close-btn")
        x_btn.set_relief(Gtk.ReliefStyle.NONE)
        x_btn.connect("clicked", lambda *_: Gtk.main_quit())

        header.pack_start(lbl, True, True, 0)
        header.pack_end(x_btn, False, False, 0)
        outer.pack_start(header, False, False, 0)

        # Five vote buttons in a row
        btn_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
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
        # Paint window background transparent so the CSS window colour shows
        # cleanly without compositor compositing artifacts.
        cr.set_source_rgba(0, 0, 0, 0)
        cr.set_operator(1)  # cairo.OPERATOR_SOURCE
        cr.paint()
        cr.set_operator(2)  # cairo.OPERATOR_OVER
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
