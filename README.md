# @openpen/cursor-highlight

A cursor highlight for [OpenPen](https://github.com/openpen-platform/openpen).

Draws a colored glow that follows the cursor so viewers can track it during
screen sharing or recording, with an optional ripple on every click.

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

1. Click the **Cursor highlight** button in the control bar's effects group to
   turn the highlight on. The button is highlighted while it is on.
2. Move the cursor. The glow follows it.
3. Click anywhere to show a ripple at the click point, unless **Click ripple**
   is turned off in the settings.
4. Click the button again to turn the highlight off. While it is off the
   plugin does not track the cursor or clicks.

The highlight is off until you turn it on, and the on/off state is saved with
the other settings.

## Settings

Open OpenPen's settings and choose the **Cursor Highlight** panel.

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| **Glow color** | any color | `#ffcc00` | Color of the glow |
| **Glow size** | 16 to 160 | 100 | Size of the glow |
| **Opacity** | 10% to 100% | 60% | Opacity of the glow (stored as 0.1 to 1) |
| **Click ripple** | on, off | on | Show a ripple that expands and fades at each click |

The on/off state is also stored as a setting (`enabled`, default off). It is
changed with the control bar button rather than in the settings panel.

## License

MIT
