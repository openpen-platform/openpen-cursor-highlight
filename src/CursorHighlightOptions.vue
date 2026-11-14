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
import { AppPopoverPanel, AppPopoverRow, AppSlider, AppSwatchPicker } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
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

const swatches = computed(() =>
  COLOR_PRESETS.map((hex) => ({
    value: hex,
    label: ctx.t(`colors.${hex.slice(1)}`),
    testid: `cursor-highlight-swatch-${hex.slice(1)}`,
  })),
)

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
  <AppPopoverPanel data-testid="controlbar-cursor-highlight-popover">
    <AppPopoverRow :label="colorLabel">
      <AppSwatchPicker
        :model-value="color"
        :colors="swatches"
        :ariaLabel="colorLabel"
        @update:model-value="setColor"
      />
    </AppPopoverRow>
    <AppPopoverRow :label="sizeLabel">
      <AppSlider
        :model-value="size"
        :min="SIZE_MIN"
        :max="SIZE_MAX"
        :step="1"
        :value-label="`${size}px`"
        :ariaLabel="sizeLabel"
        data-testid="cursor-highlight-size-slider"
        @update:model-value="setSize"
      />
    </AppPopoverRow>
    <AppPopoverRow :label="opacityLabel">
      <AppSlider
        :model-value="opacityPercent"
        :min="Math.round(OPACITY_MIN * 100)"
        :max="Math.round(OPACITY_MAX * 100)"
        :step="1"
        :value-label="`${opacityPercent}%`"
        :ariaLabel="opacityLabel"
        data-testid="cursor-highlight-opacity-slider"
        @update:model-value="setOpacityPercent"
      />
    </AppPopoverRow>
  </AppPopoverPanel>
</template>
