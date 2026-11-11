<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { MODULE_ID } from './module-id'
import {
  type CursorHighlightSettings,
  DEFAULT_SETTINGS,
} from './live-settings'
import { clampGlowOpacity, clampSize, normalizeColor } from './highlight-settings'
import {
  canvasPixelSize,
  clampOpacity,
  glowGeometry,
  needsCanvasResize,
  rippleFrame,
  rippleProgress,
} from './highlight-math'

const ctx = useModuleContext(MODULE_ID)

const canvasEl = ref<HTMLCanvasElement | null>(null)
const rippleLayer = ref<HTMLDivElement | null>(null)

const live: CursorHighlightSettings = { ...DEFAULT_SETTINGS }

let cx = 0
let cy = 0
let haveCursor = false
let glowRaf: number | null = null
let listening = false

const surface = { cssWidth: 0, cssHeight: 0, dpr: 1 }

/** Active ripple DOM nodes paired with their animation start time. */
interface ActiveRipple {
  node: HTMLDivElement
  start: number
}
const ripples: ActiveRipple[] = []
let rippleRaf: number | null = null

function syncCanvasSurface(): boolean {
  const canvas = canvasEl.value
  if (!canvas) return false
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const next = { cssWidth: rect.width, cssHeight: rect.height, dpr }
  if (!needsCanvasResize(surface, next) && canvas.width > 0) return true
  const { width, height } = canvasPixelSize(next.cssWidth, next.cssHeight, dpr)
  canvas.width = width
  canvas.height = height
  surface.cssWidth = next.cssWidth
  surface.cssHeight = next.cssHeight
  surface.dpr = dpr
  return true
}

function clearCanvas(ctx2d: CanvasRenderingContext2D): void {
  const canvas = canvasEl.value
  if (!canvas) return
  // Clear the full backing store in device pixels. The backing store rounds up
  // (canvasPixelSize uses Math.ceil), so clearing the float CSS box * dpr would
  // leave a ~1px sliver uncleared at fractional DPRs (e.g. 125%).
  ctx2d.setTransform(1, 0, 0, 1, 0, 0)
  ctx2d.clearRect(0, 0, canvas.width, canvas.height)
}

function drawGlow(): void {
  glowRaf = null
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) return

  if (!syncCanvasSurface()) return
  clearCanvas(ctx2d)
  if (!haveCursor || !live.enabled) return

  ctx2d.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0)

  const { radius, coreRadius } = glowGeometry(live.size)
  const alpha = clampOpacity(live.opacity)
  const gradient = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, radius)
  gradient.addColorStop(0, hexToRgba(live.color, alpha))
  gradient.addColorStop(clampStop(coreRadius / radius), hexToRgba(live.color, alpha * 0.85))
  gradient.addColorStop(1, hexToRgba(live.color, 0))

  ctx2d.fillStyle = gradient
  ctx2d.beginPath()
  ctx2d.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx2d.fill()
}

function clampStop(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}

/**
 * Resolve a `#rgb` / `#rrggbb` colour to an `rgba()` string at `alpha`.
 * Falls back to the configured colour as-is for any other (named / functional)
 * value so an unexpected colour string still paints rather than throwing.
 */
function hexToRgba(color: string, alpha: number): string {
  const hex = color.trim()
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)
  if (!match) return color
  let r: number
  let g: number
  let b: number
  if (match[1].length === 3) {
    r = parseInt(match[1][0] + match[1][0], 16)
    g = parseInt(match[1][1] + match[1][1], 16)
    b = parseInt(match[1][2] + match[1][2], 16)
  } else {
    r = parseInt(match[1].slice(0, 2), 16)
    g = parseInt(match[1].slice(2, 4), 16)
    b = parseInt(match[1].slice(4, 6), 16)
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function onMouseMove(e: MouseEvent): void {
  cx = e.clientX
  cy = e.clientY
  haveCursor = true
  if (glowRaf === null) glowRaf = requestAnimationFrame(drawGlow)
}

function onMouseDown(e: MouseEvent): void {
  if (!live.enabled || !live.ripple) return
  spawnRipple(e.clientX, e.clientY)
}

function spawnRipple(x: number, y: number): void {
  const layer = rippleLayer.value
  if (!layer) return
  const rect = layer.getBoundingClientRect()
  const node = document.createElement('div')
  node.className = 'ch-ripple'
  node.style.borderColor = live.color
  node.style.left = `${x - rect.left}px`
  node.style.top = `${y - rect.top}px`
  layer.appendChild(node)
  ripples.push({ node, start: performance.now() })
  if (rippleRaf === null) rippleRaf = requestAnimationFrame(stepRipples)
}

function stepRipples(now: number): void {
  rippleRaf = null
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i]
    const t = rippleProgress(now - r.start)
    const frame = rippleFrame(t)
    const diameter = frame.radius * 2
    r.node.style.width = `${diameter}px`
    r.node.style.height = `${diameter}px`
    r.node.style.opacity = String(frame.opacity)
    if (t >= 1) {
      r.node.remove()
      ripples.splice(i, 1)
    }
  }
  if (ripples.length > 0) rippleRaf = requestAnimationFrame(stepRipples)
}

function clearAllRipples(): void {
  if (rippleRaf !== null) {
    cancelAnimationFrame(rippleRaf)
    rippleRaf = null
  }
  for (const r of ripples) r.node.remove()
  ripples.length = 0
}

function startListening(): void {
  if (listening) return
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  listening = true
  if (glowRaf === null) glowRaf = requestAnimationFrame(drawGlow)
}

function stopListening(): void {
  if (!listening) return
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  listening = false
  haveCursor = false
  if (glowRaf !== null) {
    cancelAnimationFrame(glowRaf)
    glowRaf = null
  }
  clearAllRipples()
  const canvas = canvasEl.value
  const ctx2d = canvas?.getContext('2d')
  if (canvas && ctx2d) clearCanvas(ctx2d)
}

function applySettings(s: CursorHighlightSettings): void {
  const wasEnabled = live.enabled
  live.enabled = s.enabled
  live.color = normalizeColor(s.color)
  live.size = clampSize(s.size)
  live.opacity = clampGlowOpacity(s.opacity)
  live.ripple = s.ripple
  if (s.enabled && !wasEnabled) startListening()
  else if (!s.enabled && wasEnabled) stopListening()
  else if (s.enabled && glowRaf === null) glowRaf = requestAnimationFrame(drawGlow)
}

let unsub: (() => void) | null = null

onMounted(() => {
  applySettings(ctx.getSettings<CursorHighlightSettings>())
  unsub = ctx.onSettingsChange<CursorHighlightSettings>(applySettings)
})

onUnmounted(() => {
  unsub?.()
  stopListening()
})
</script>

<template>
  <div class="ch-overlay" aria-hidden="true">
    <canvas ref="canvasEl" class="ch-canvas" />
    <div ref="rippleLayer" class="ch-ripple-layer" />
  </div>
</template>

<style scoped>
/*
 * The overlay must never intercept input — the host paints on the layer below.
 * `!important` guarantees the highlight wins over any host-injected
 * `:deep(*) { pointer-events: auto }` regardless of selector specificity.
 */
.ch-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none !important;
  overflow: hidden;
}

.ch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none !important;
}

.ch-ripple-layer {
  position: absolute;
  inset: 0;
  pointer-events: none !important;
}

.ch-ripple-layer :deep(.ch-ripple) {
  position: absolute;
  left: 0;
  top: 0;
  border-style: solid;
  border-width: 2px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none !important;
  will-change: width, height, opacity;
}
</style>
