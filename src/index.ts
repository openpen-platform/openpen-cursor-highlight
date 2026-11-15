/**
 * @openpen/cursor-highlight — a coloured glow that follows the cursor.
 *
 * Contributes:
 *   - A persistent HTML overlay (`canvas.html.overlay`) that owns its own
 *     `mousemove` + `requestAnimationFrame` loop. A canvas layer is the wrong
 *     slot here: its `render(ctx)` only runs on host redraw and never receives
 *     cursor coordinates, so a static cursor would not be tracked.
 *   - A control-bar toggle button (on/off, reflecting the persisted `enabled`)
 *     with a caret that opens a popover for color / size / opacity.
 *   - A global shortcut that toggles `enabled`.
 *   - A settings panel (color / size / opacity / click ripple).
 *
 * The overlay is mounted at all times; it does nothing — and holds no global
 * listeners — while `enabled` is false. Toggling `enabled` is the only thing
 * that attaches / detaches the `mousemove` + `mousedown` listeners.
 */
import { defineModule, type ModuleSetupContext } from '@openpen/module-api'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import { settingsSchema, type CursorHighlightSettings } from './live-settings'
import CursorHighlightOverlay from './CursorHighlightOverlay.vue'
import CursorHighlightToggle from './CursorHighlightToggle.vue'
import CursorHighlightSettingsPanel from './CursorHighlightSettingsPanel.vue'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

// The shortcut handler has no context argument, so setup() hands it over.
let activeCtx: ModuleSetupContext | null = null

// The host delivers one shortcut press to exactly one window, so the handler
// runs once per press and needs no de-duplication of its own.

/** Flip the persisted `enabled` flag; every window (and the control-bar button) follows via onSettingsChange. */
function toggleHighlight(): void {
  if (!activeCtx) return
  const enabled = activeCtx.getSettings<CursorHighlightSettings>().enabled ?? false
  void activeCtx.updateSettings<CursorHighlightSettings>({ enabled: !enabled })
}

export default defineModule({
  id: MODULE_ID,
  version: '1.0.0',
  settingsSchema,

  setup(ctx) {
    activeCtx = ctx
    ctx.onDispose(() => {
      if (activeCtx === ctx) activeCtx = null
    })
  },

  contributes: {
    htmlOverlays: [
      {
        id: 'cursor-highlight',
        component: CursorHighlightOverlay,
      },
    ],
    controlBar: [
      {
        id: 'cursor-highlight',
        component: CursorHighlightToggle,
        defaultGroup: 'effects',
        groupHint: { separator: 'auto' },
      },
    ],
    shortcuts: [
      {
        id: 'toggle-cursor-highlight',
        // Host convention: CommandOrControl + modifier + letter. H = Highlight;
        // Alt instead of Shift because Shift combos are taken by the host.
        // Global scope: the glow is also used outside drawing mode, so the key
        // must work there too. Users can rebind it in Settings -> Shortcuts.
        keys: 'CommandOrControl+Alt+H',
        scope: 'global',
        label: {
          en: 'Toggle Cursor Highlight',
          'zh-Hant': '開關游標光暈',
          'zh-Hans': '开关光标光晕',
          ja: 'カーソルハイライトの切り替え',
        },
        userCustomizable: true,
        handler: toggleHighlight,
      },
    ],
    settingsPanels: [
      {
        id: 'cursor-highlight-settings',
        label: {
          en: 'Cursor Highlight',
          'zh-Hant': '游標光暈',
          'zh-Hans': '光标光晕',
          ja: 'カーソルハイライト',
        },
        component: CursorHighlightSettingsPanel,
      },
    ],
    locales: {
      en,
      'zh-Hant': zhHant,
      'zh-Hans': zhHans,
      ja,
    },
  },
})
