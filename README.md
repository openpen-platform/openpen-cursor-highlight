# @openpen/cursor-highlight

A cursor highlight for [OpenPen](https://github.com/openpen-platform/openpen).

Draws a colored glow that follows the cursor so viewers can track it during
screen sharing or recording, with an optional ripple on each click made in
drawing mode.

## Install

Requires OpenPen 1.0.0 or later.

Install from the plugin catalog, then restart OpenPen:

```bash
npx openpen-cli plugin install @openpen/cursor-highlight
```

To install a build from source instead, build the plugin, then add the
directory to OpenPen and restart it:

```bash
npm install
npm run build
npx openpen-cli plugin add .
```

## Usage

1. Click the **Cursor highlight** button in the control bar's effects group,
   or press **Ctrl+Alt+H** (**⌘⌥H** on macOS), to turn the highlight on. The
   button is highlighted while it is on. The shortcut is not available on
   Linux Wayland sessions; use the button there.
2. Move the cursor. The glow follows it.
3. To adjust it on the spot, click the small caret next to the **Cursor
   highlight** button (this also turns the highlight on) and use the panel:
   pick a **Glow color** swatch, and drag **Glow size** and **Opacity**.
   Changes apply immediately and are kept across restarts.
4. While drawing mode is on, click anywhere to show a ripple at the click
   point, unless **Click ripple** is turned off in the settings. The ripple
   does not appear outside drawing mode, because clicks pass straight through
   to the app underneath and the plugin never receives them.
5. Click the button or press the shortcut again to turn the highlight off.
   While it is off the plugin does not track the cursor or clicks.

The highlight is off until you turn it on, and the on/off state is saved with
the other settings.

## Settings

The control-bar panel is for quick adjustments: it offers six preset color
swatches, plus **Glow size** and **Opacity**. The settings page, under the
**Cursor Highlight** panel, has the same size and opacity options, a color
picker for any custom glow color, and the **Click ripple** switch. A custom
color chosen in the settings page is applied as is; the panel shows no swatch
as selected for it.

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| **Glow color** | any color | `#ffcc00` | Color of the glow |
| **Glow size** | 16 to 160 | 100 | Size of the glow |
| **Opacity** | 10% to 100% | 60% | Opacity of the glow (stored as 0.1 to 1) |
| **Click ripple** | on, off | on | Show a ripple that expands and fades at each click in drawing mode |

A saved value outside the allowed range is clamped back into it.

The on/off state is also stored as a setting (`enabled`, default off). It is
changed with the control bar button or the shortcut rather than in the settings
panel. The shortcut can be rebound under **Settings → Shortcuts**.

## License

MIT
