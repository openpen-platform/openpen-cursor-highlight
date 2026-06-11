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

export const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default('#ffcc00'),
  size: z.number().min(16).max(160).default(100),
  opacity: z.number().min(0.1).max(1).default(0.6),
  ripple: z.boolean().default(true),
})

export type CursorHighlightSettings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: CursorHighlightSettings = {
  enabled: false,
  color: '#ffcc00',
  size: 100,
  opacity: 0.6,
  ripple: true,
}
