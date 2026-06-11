<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppButton } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import type { CursorHighlightSettings } from './live-settings'

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))

const enabled = ref(false)
let unsub: (() => void) | null = null

onMounted(() => {
  enabled.value = ctx.getSettings<CursorHighlightSettings>().enabled
  unsub = ctx.onSettingsChange<CursorHighlightSettings>((s) => {
    enabled.value = s.enabled
  })
})

onUnmounted(() => unsub?.())

async function toggle() {
  await ctx.updateSettings<CursorHighlightSettings>({ enabled: !enabled.value })
}
</script>

<template>
  <AppButton
    :active="enabled"
    :tooltip="label"
    :aria-label="label"
    data-testid="controlbar-cursor-highlight-btn"
    @click="toggle"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.6 5.6l1.4 1.4" />
      <path d="M17 17l1.4 1.4" />
      <path d="M18.4 5.6L17 7" />
      <path d="M7 17l-1.4 1.4" />
    </svg>
  </AppButton>
</template>
