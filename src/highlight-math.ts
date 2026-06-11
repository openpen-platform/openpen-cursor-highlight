/**
 * Pure cursor-highlight math — no canvas, no DOM, no time. Kept side-effect
 * free so glow sizing, DPR canvas dimensions, and ripple animation progress
 * can be unit-tested in isolation.
 */

/** Below this device pixel ratio delta a canvas resize is not worth doing. */
export const DPR_EPSILON = 0.01

/**
 * Ripple lifetime in ms. PowerToys / Presentify click feedback lands in the
 * 250–400ms band; 400ms linear matches the design's grounded default.
 */
export const RIPPLE_DURATION_MS = 400

/** Ripple radius at t=0, in CSS px. */
export const RIPPLE_START_RADIUS = 5

/** Multiplier applied to the start radius at t=1 (≈15× → ~75px diameter growth). */
export const RIPPLE_SCALE_MAX = 15

/** The drawable glow geometry derived from the user's `size` setting. */
export interface GlowGeometry {
  /** Outer glow radius in CSS px (the gradient reaches zero alpha here). */
  radius: number
  /** Solid core radius in CSS px (full alpha inside this). */
  coreRadius: number
}

/**
 * Derive glow geometry from the configured diameter. `size` is a full diameter
 * (settings range 16–160); the glow is rendered as a soft radial gradient whose
 * core is ~40% of the radius and whose feathered edge reaches the full radius.
 */
export function glowGeometry(size: number): GlowGeometry {
  const radius = Math.max(size, 1) / 2
  return { radius, coreRadius: radius * 0.4 }
}

/** Clamp a user opacity into the canvas-safe [0,1] range. */
export function clampOpacity(opacity: number): number {
  if (Number.isNaN(opacity)) return 0
  return Math.min(Math.max(opacity, 0), 1)
}

/** Physical canvas pixel dimensions for a CSS box at a given device pixel ratio. */
export interface CanvasPixelSize {
  width: number
  height: number
}

/**
 * Physical backing-store size for a CSS-sized canvas at `dpr`. Used to set
 * `canvas.width/height`; the 2D context is then scaled by `dpr` so all drawing
 * stays in CSS px. Rounds up so a fractional CSS box never clips.
 */
export function canvasPixelSize(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): CanvasPixelSize {
  const ratio = dpr > 0 ? dpr : 1
  return {
    width: Math.max(0, Math.ceil(cssWidth * ratio)),
    height: Math.max(0, Math.ceil(cssHeight * ratio)),
  }
}

/**
 * Whether the canvas backing store must be rebuilt. True when the CSS box
 * changed or the device pixel ratio moved across screens (a DPR change with a
 * stale backing store is what makes the glow blurry after a cross-monitor move).
 */
export function needsCanvasResize(
  prev: { cssWidth: number; cssHeight: number; dpr: number },
  next: { cssWidth: number; cssHeight: number; dpr: number },
): boolean {
  return (
    prev.cssWidth !== next.cssWidth ||
    prev.cssHeight !== next.cssHeight ||
    Math.abs(prev.dpr - next.dpr) > DPR_EPSILON
  )
}

/** Normalised ripple progress in [0,1] for `elapsed` ms over `duration` ms. */
export function rippleProgress(
  elapsed: number,
  duration: number = RIPPLE_DURATION_MS,
): number {
  if (duration <= 0) return 1
  return Math.min(Math.max(elapsed / duration, 0), 1)
}

/** The visual state of a ripple at progress `t` (0→1). */
export interface RippleFrame {
  /** Current radius in CSS px (start radius scaled toward the max). */
  radius: number
  /** Current alpha (linear fade from 1 to 0). */
  opacity: number
}

/**
 * Ripple appearance at progress `t`: radius grows linearly from the start
 * radius to `start * RIPPLE_SCALE_MAX`, opacity fades linearly to 0.
 */
export function rippleFrame(
  t: number,
  startRadius: number = RIPPLE_START_RADIUS,
  scaleMax: number = RIPPLE_SCALE_MAX,
): RippleFrame {
  const clamped = Math.min(Math.max(t, 0), 1)
  const radius = startRadius * (1 + (scaleMax - 1) * clamped)
  return { radius, opacity: 1 - clamped }
}
