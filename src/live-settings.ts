/**
 * Cursor-highlight settings shape + a module-scoped live snapshot.
 *
 * The overlay component reads this snapshot every animation frame, and `setup()`
 * keeps it in sync via `ctx.onSettingsChange`. Toggling `enabled` here is what
 * starts / stops the overlay's mousemove listener — keeping the holder outside
 * the component means the toggle button, the overlay, and `setup()` all observe
 * one source of truth without prop-drilling.
 */
import { z } from '@openpen/module-api'
import {
  COLOR_DEFAULT,
  OPACITY_DEFAULT,
  SIZE_DEFAULT,
} from './highlight-settings'

export const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default(COLOR_DEFAULT),
  // Unbounded on purpose: an out-of-range saved value is clamped on read
  // (highlight-settings.ts) instead of failing validation and discarding the
  // whole settings object.
  size: z.number().default(SIZE_DEFAULT),
  opacity: z.number().default(OPACITY_DEFAULT),
  ripple: z.boolean().default(true),
})

export type CursorHighlightSettings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: CursorHighlightSettings = {
  enabled: false,
  color: COLOR_DEFAULT,
  size: SIZE_DEFAULT,
  opacity: OPACITY_DEFAULT,
  ripple: true,
}
