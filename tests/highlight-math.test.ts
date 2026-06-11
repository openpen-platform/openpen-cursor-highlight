import { describe, it, expect } from 'vitest'
import {
  glowGeometry,
  clampOpacity,
  canvasPixelSize,
  needsCanvasResize,
  rippleProgress,
  rippleFrame,
  DPR_EPSILON,
  RIPPLE_DURATION_MS,
  RIPPLE_START_RADIUS,
  RIPPLE_SCALE_MAX,
} from '../src/highlight-math'

describe('constants', () => {
  it('match the documented design defaults', () => {
    expect(RIPPLE_DURATION_MS).toBe(400)
    expect(RIPPLE_START_RADIUS).toBe(5)
    expect(RIPPLE_SCALE_MAX).toBe(15)
    expect(DPR_EPSILON).toBe(0.01)
  })
})

describe('glowGeometry', () => {
  it('derives radius as half the diameter and core at 40% of radius', () => {
    expect(glowGeometry(100)).toEqual({ radius: 50, coreRadius: 20 })
  })

  it('handles the schema min diameter (16)', () => {
    expect(glowGeometry(16)).toEqual({ radius: 8, coreRadius: 3.2 })
  })

  it('handles the schema max diameter (160)', () => {
    expect(glowGeometry(160)).toEqual({ radius: 80, coreRadius: 32 })
  })

  it('floors the input diameter at 1 so a zero/negative size never collapses to 0 radius', () => {
    // Math.max(size, 1) clamps the diameter, not the radius.
    expect(glowGeometry(0)).toEqual({ radius: 0.5, coreRadius: 0.2 })
    expect(glowGeometry(-50)).toEqual({ radius: 0.5, coreRadius: 0.2 })
  })
})

describe('clampOpacity', () => {
  it('passes interior values through unchanged', () => {
    expect(clampOpacity(0.6)).toBe(0.6)
    expect(clampOpacity(0.1)).toBe(0.1)
    expect(clampOpacity(1)).toBe(1)
    expect(clampOpacity(0)).toBe(0)
  })

  it('clamps below 0 to 0 and above 1 to 1', () => {
    expect(clampOpacity(-0.5)).toBe(0)
    expect(clampOpacity(2)).toBe(1)
  })

  it('treats NaN as fully transparent', () => {
    expect(clampOpacity(Number.NaN)).toBe(0)
  })
})

describe('canvasPixelSize', () => {
  it('scales the CSS box by the device pixel ratio (high-DPR backing store)', () => {
    expect(canvasPixelSize(200, 100, 2)).toEqual({ width: 400, height: 200 })
    expect(canvasPixelSize(200, 100, 3)).toEqual({ width: 600, height: 300 })
  })

  it('is identity at dpr 1', () => {
    expect(canvasPixelSize(200, 100, 1)).toEqual({ width: 200, height: 100 })
  })

  it('rounds up fractional results so a fractional CSS box never clips', () => {
    expect(canvasPixelSize(100.4, 50.1, 1.5)).toEqual({ width: 151, height: 76 })
  })

  it('falls back to dpr 1 when dpr is non-positive', () => {
    expect(canvasPixelSize(200, 100, 0)).toEqual({ width: 200, height: 100 })
    expect(canvasPixelSize(200, 100, -2)).toEqual({ width: 200, height: 100 })
  })

  it('never returns negative dimensions', () => {
    expect(canvasPixelSize(-10, -10, 2)).toEqual({ width: 0, height: 0 })
  })
})

describe('needsCanvasResize', () => {
  const base = { cssWidth: 100, cssHeight: 50, dpr: 2 }

  it('is false when nothing changed', () => {
    expect(needsCanvasResize(base, { ...base })).toBe(false)
  })

  it('is true on a CSS width or height change', () => {
    expect(needsCanvasResize(base, { ...base, cssWidth: 101 })).toBe(true)
    expect(needsCanvasResize(base, { ...base, cssHeight: 51 })).toBe(true)
  })

  it('is true when DPR moves more than DPR_EPSILON (cross-monitor move)', () => {
    expect(needsCanvasResize(base, { ...base, dpr: 2.5 })).toBe(true)
  })

  it('is false when DPR jitter is within DPR_EPSILON', () => {
    expect(needsCanvasResize(base, { ...base, dpr: 2 + DPR_EPSILON / 2 })).toBe(false)
  })

  it('treats a DPR delta exactly at DPR_EPSILON as not worth a resize', () => {
    // Guard uses strict `>`, so a delta equal to the epsilon must not resize.
    expect(needsCanvasResize(base, { ...base, dpr: 2 + DPR_EPSILON })).toBe(false)
  })
})

describe('rippleProgress', () => {
  it('is 0 at the start, 0.5 at the midpoint, 1 at the end', () => {
    expect(rippleProgress(0, 400)).toBe(0)
    expect(rippleProgress(200, 400)).toBe(0.5)
    expect(rippleProgress(400, 400)).toBe(1)
  })

  it('clamps past the duration to 1', () => {
    expect(rippleProgress(1000, 400)).toBe(1)
  })

  it('clamps a negative elapsed to 0', () => {
    expect(rippleProgress(-50, 400)).toBe(0)
  })

  it('defaults to RIPPLE_DURATION_MS', () => {
    expect(rippleProgress(200)).toBe(0.5)
  })

  it('returns 1 for a non-positive duration', () => {
    expect(rippleProgress(10, 0)).toBe(1)
  })
})

describe('rippleFrame', () => {
  it('starts at the start radius with full opacity', () => {
    expect(rippleFrame(0, 5, 15)).toEqual({ radius: 5, opacity: 1 })
  })

  it('ends at start * scaleMax with zero opacity', () => {
    expect(rippleFrame(1, 5, 15)).toEqual({ radius: 75, opacity: 0 })
  })

  it('interpolates radius and opacity linearly at the midpoint', () => {
    // radius = 5 * (1 + 14 * 0.5) = 40; opacity = 1 - 0.5
    expect(rippleFrame(0.5, 5, 15)).toEqual({ radius: 40, opacity: 0.5 })
  })

  it('uses RIPPLE_START_RADIUS / RIPPLE_SCALE_MAX by default', () => {
    expect(rippleFrame(0)).toEqual({ radius: 5, opacity: 1 })
    expect(rippleFrame(1)).toEqual({ radius: 75, opacity: 0 })
  })

  it('clamps t outside [0,1]', () => {
    expect(rippleFrame(-1, 5, 15)).toEqual({ radius: 5, opacity: 1 })
    expect(rippleFrame(2, 5, 15)).toEqual({ radius: 75, opacity: 0 })
  })
})
