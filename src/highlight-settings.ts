/**
 * Allowed ranges, defaults and the clamps every reader applies. The settings
 * schema is deliberately unbounded for size / opacity (an out-of-range saved
 * value would otherwise fail validation and discard the whole settings
 * object), so the range is enforced on read, here, in one place.
 */
export const SIZE_MIN = 16
export const SIZE_MAX = 160
export const SIZE_DEFAULT = 100

export const OPACITY_MIN = 0.1
export const OPACITY_MAX = 1
export const OPACITY_DEFAULT = 0.6

export const COLOR_DEFAULT = '#ffcc00'

/** One-click colors offered by the control-bar panel (custom colors stay in the settings page). */
export const COLOR_PRESETS: readonly string[] = [
  '#ffcc00',
  '#ff3b30',
  '#34c759',
  '#0a84ff',
  '#bf5af2',
  '#ffffff',
]

/** Round to an integer and clamp into 16..160; non-finite input falls back to the default. */
export function clampSize(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return SIZE_DEFAULT
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(value)))
}

/** Clamp into 0.1..1 (rounded to 2 decimals); non-finite input falls back to the default. */
export function clampGlowOpacity(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return OPACITY_DEFAULT
  return Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, Math.round(value * 100) / 100))
}

/** A non-empty string is kept as is; anything else falls back to the default color. */
export function normalizeColor(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : COLOR_DEFAULT
}
