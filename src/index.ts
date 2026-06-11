/**
 * @openpen/cursor-highlight — a coloured glow that follows the cursor.
 *
 * Contributes:
 *   - A persistent HTML overlay (`canvas.html.overlay`) that owns its own
 *     `mousemove` + `requestAnimationFrame` loop. A canvas layer is the wrong
 *     slot here: its `render(ctx)` only runs on host redraw and never receives
 *     cursor coordinates, so a static cursor would not be tracked.
 *   - A control-bar toggle button (on/off, reflecting the persisted `enabled`).
 *   - A settings panel (color / size / opacity / click ripple).
 *
 * The overlay is mounted at all times; it does nothing — and holds no global
 * listeners — while `enabled` is false. Toggling `enabled` is the only thing
 * that attaches / detaches the `mousemove` + `mousedown` listeners.
 */
import { defineModule } from '@openpen/module-api'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import { settingsSchema } from './live-settings'
import CursorHighlightOverlay from './CursorHighlightOverlay.vue'
import CursorHighlightToggle from './CursorHighlightToggle.vue'
import CursorHighlightSettingsPanel from './CursorHighlightSettingsPanel.vue'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

export default defineModule({
  id: MODULE_ID,
  version: '1.0.0',
  settingsSchema,

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
