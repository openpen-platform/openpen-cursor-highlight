<script setup lang="ts">
/*
 * CursorHighlightOptions — the adjustments shown in the control-bar popover:
 * color (one-click swatches), glow size and opacity.
 *
 * Colors are swatches rather than the browser's native color dialog: that
 * dialog opens its own window, which would sit outside the popover's
 * outside-click handling and may be hidden behind the always-on-top overlay.
 * Any custom color stays available in the plugin's settings page.
 *
 * Every change is written to this plugin's settings; the overlay in each
 * window follows through onSettingsChange, so the glow reshapes while a
 * slider moves.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppSlider } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import { vSliderName } from './slider-name'
import type { CursorHighlightSettings } from './live-settings'
import {
  COLOR_DEFAULT,
  COLOR_PRESETS,
  OPACITY_DEFAULT,
  OPACITY_MAX,
  OPACITY_MIN,
  SIZE_DEFAULT,
  SIZE_MAX,
  SIZE_MIN,
  clampGlowOpacity,
  clampSize,
  normalizeColor,
} from './highlight-settings'

const ctx = useModuleContext(MODULE_ID)

const color = ref(COLOR_DEFAULT)
const size = ref(SIZE_DEFAULT)
const opacity = ref(OPACITY_DEFAULT)
const opacityPercent = computed(() => Math.round(opacity.value * 100))

const colorLabel = computed(() => ctx.t('settings.color'))
const sizeLabel = computed(() => ctx.t('settings.size'))
const opacityLabel = computed(() => ctx.t('settings.opacity'))

function apply(s: Partial<CursorHighlightSettings>) {
  color.value = normalizeColor(s.color)
  size.value = clampSize(s.size as number)
  opacity.value = clampGlowOpacity(s.opacity as number)
}

let unsub: (() => void) | null = null
onMounted(() => {
  apply(ctx.getSettings<CursorHighlightSettings>())
  unsub = ctx.onSettingsChange<CursorHighlightSettings>(apply)
})
onUnmounted(() => unsub?.())

function colorName(hex: string): string {
  return ctx.t(`colors.${hex.slice(1)}`)
}

async function setColor(value: string) {
  color.value = value
  await ctx.updateSettings<CursorHighlightSettings>({ color: value })
}

async function setSize(value: number) {
  const next = clampSize(Number(value))
  size.value = next
  await ctx.updateSettings<CursorHighlightSettings>({ size: next })
}

async function setOpacityPercent(value: number) {
  const next = clampGlowOpacity(Number(value) / 100)
  opacity.value = next
  await ctx.updateSettings<CursorHighlightSettings>({ opacity: next })
}
</script>

<template>
  <div class="ch-popover" data-testid="controlbar-cursor-highlight-popover">
    <div class="ch-popover-head">
      <span class="ch-popover-title">{{ colorLabel }}</span>
    </div>
    <div class="ch-swatches" role="group" :aria-label="colorLabel">
      <button
        v-for="hex in COLOR_PRESETS"
        :key="hex"
        type="button"
        class="ch-swatch"
        :class="{ 'ch-swatch-active': hex.toLowerCase() === color.toLowerCase() }"
        :style="{ backgroundColor: hex }"
        :aria-label="colorName(hex)"
        :aria-pressed="hex.toLowerCase() === color.toLowerCase()"
        :data-testid="`cursor-highlight-swatch-${hex.slice(1)}`"
        @click="setColor(hex)"
      />
    </div>

    <div class="ch-popover-head ch-popover-gap">
      <span class="ch-popover-title">{{ sizeLabel }}</span>
      <span class="ch-popover-value" data-testid="cursor-highlight-size-value">{{ size }}px</span>
    </div>
    <div v-slider-name="sizeLabel">
    <AppSlider
      :model-value="size"
      :min="SIZE_MIN"
      :max="SIZE_MAX"
      :step="1"
      track-height="8px"
      track-radius="4px"
      thumb-width="24px"
      thumb-height="16px"
      thumb-radius="8px"
      :aria-label="sizeLabel"
      data-testid="cursor-highlight-size-slider"
      @update:model-value="setSize"
    />
    </div>

    <div class="ch-popover-head ch-popover-gap">
      <span class="ch-popover-title">{{ opacityLabel }}</span>
      <span class="ch-popover-value" data-testid="cursor-highlight-opacity-value">{{ opacityPercent }}%</span>
    </div>
    <div v-slider-name="opacityLabel">
    <AppSlider
      :model-value="opacityPercent"
      :min="Math.round(OPACITY_MIN * 100)"
      :max="Math.round(OPACITY_MAX * 100)"
      :step="1"
      track-height="8px"
      track-radius="4px"
      thumb-width="24px"
      thumb-height="16px"
      thumb-radius="8px"
      :aria-label="opacityLabel"
      data-testid="cursor-highlight-opacity-slider"
      @update:model-value="setOpacityPercent"
    />
    </div>
  </div>
</template>

<style scoped>
/*
 * Layout mirrors the host's stroke-width popup (same local copy as the arrow
 * and spotlight plugins): the host keeps its popover styles in a global
 * stylesheet plugins cannot import, so this is built on the public
 * --openpen-* tokens. One column in both bar orientations, so vertical bars
 * need no variant; AppPopover places it beside the bar. min-width gives
 * AppSlider (width: 100%) a reference width.
 */
.ch-popover {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ch-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ch-popover-gap {
  margin-top: 8px;
}

.ch-popover-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* text-muted fails 4.5:1 on the popup surface (2.5-3.7:1 measured); text-dim passes. */
  color: var(--openpen-color-text-dim);
}

.ch-popover-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
  font-variant-numeric: tabular-nums;
}

.ch-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ch-swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: 0 0 0 1px var(--openpen-color-text-dim);
  cursor: pointer;
}

.ch-swatch-active {
  border-color: var(--openpen-color-text-primary);
}
</style>
