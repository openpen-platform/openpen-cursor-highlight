<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppSlider, AppToggle } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import type { CursorHighlightSettings } from './live-settings'

const ctx = useModuleContext(MODULE_ID)

const color = ref('#ffcc00')
const size = ref(100)
const opacity = ref(0.6)
const ripple = ref(true)
let unsub: (() => void) | null = null

onMounted(() => {
  const s = ctx.getSettings<CursorHighlightSettings>()
  color.value = s.color
  size.value = s.size
  opacity.value = s.opacity
  ripple.value = s.ripple
  unsub = ctx.onSettingsChange<CursorHighlightSettings>((next) => {
    color.value = next.color
    size.value = next.size
    opacity.value = next.opacity
    ripple.value = next.ripple
  })
})

onUnmounted(() => unsub?.())

const colorLabel = computed(() => ctx.t('settings.color'))
const sizeLabel = computed(() => ctx.t('settings.size'))
const opacityLabel = computed(() => ctx.t('settings.opacity'))
const rippleLabel = computed(() => ctx.t('settings.ripple'))

const opacityPercent = computed(() => Math.round(opacity.value * 100))

async function setColor(value: string) {
  color.value = value
  await ctx.updateSettings<CursorHighlightSettings>({ color: value })
}

async function setSize(value: number) {
  size.value = value
  await ctx.updateSettings<CursorHighlightSettings>({ size: value })
}

async function setOpacity(value: number) {
  // Slider emits integer percent; map to a 2-decimal [0,1] fraction so float
  // division never stores noisy values like 0.5700000000000001.
  const next = Math.round(value) / 100
  opacity.value = next
  await ctx.updateSettings<CursorHighlightSettings>({ opacity: next })
}

async function setRipple(value: boolean) {
  ripple.value = value
  await ctx.updateSettings<CursorHighlightSettings>({ ripple: value })
}
</script>

<template>
  <div class="ch-settings">
    <div class="ch-row">
      <div class="ch-row-label">{{ colorLabel }}</div>
      <input
        class="ch-color"
        type="color"
        :value="color"
        :aria-label="colorLabel"
        @input="setColor(($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="ch-row">
      <div class="ch-row-label">{{ sizeLabel }}</div>
      <AppSlider
        :model-value="size"
        :min="16"
        :max="160"
        :step="1"
        width="120px"
        :aria-label="sizeLabel"
        @update:model-value="setSize"
      />
    </div>
    <div class="ch-row">
      <div class="ch-row-label">{{ opacityLabel }}</div>
      <AppSlider
        :model-value="opacityPercent"
        :min="10"
        :max="100"
        :step="1"
        width="120px"
        :aria-label="opacityLabel"
        @update:model-value="setOpacity"
      />
    </div>
    <div class="ch-row">
      <div class="ch-row-label">{{ rippleLabel }}</div>
      <AppToggle
        :model-value="ripple"
        :aria-label="rippleLabel"
        @update:model-value="setRipple"
      />
    </div>
  </div>
</template>

<style scoped>
.ch-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ch-row-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
}

.ch-color {
  width: 32px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>
