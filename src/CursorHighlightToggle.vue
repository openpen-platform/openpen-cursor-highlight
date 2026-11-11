<script setup lang="ts">
/*
 * CursorHighlightToggle — cursor-highlight on/off button + caret + options popover.
 *
 * Same pattern as the host's shape and eraser buttons (and the arrow and
 * spotlight plugins): an `AppButtonDropdown` whose main button toggles the
 * highlight and whose caret opens a popover with the adjustments. Popover
 * lifecycle (mutual exclusion with other popovers, outside-click, placement,
 * vertical bars) is handled by the dropdown's inner AppPopover.
 */
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { MODAL_MANAGER_KEY, SNAP_EDGE_KEY, useModuleContext } from '@openpen/module-api'
import { AppButtonDropdown } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import type { CursorHighlightSettings } from './live-settings'
import CursorHighlightOptions from './CursorHighlightOptions.vue'

const POPOVER_ID = 'openpen-cursor-highlight-options'

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))
const optionsLabel = computed(() => ctx.t('options.label'))

const snapEdge = inject(SNAP_EDGE_KEY)
const modalManager = inject(MODAL_MANAGER_KEY)
// Anchor coordinates go stale when the bar snaps to another edge.
watch(() => snapEdge?.value, () => { modalManager?.close(POPOVER_ID) })

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

/** Opening the options also turns the highlight on, so the adjustments are visible as they are made. */
async function enableIfNeeded() {
  if (!enabled.value) await ctx.updateSettings<CursorHighlightSettings>({ enabled: true })
}
</script>

<template>
  <AppButtonDropdown
    :popover-id="POPOVER_ID"
    popover-placement="auto"
    :active="enabled"
    :main-tooltip="label"
    :main-aria-label="label"
    :caret-aria-label="optionsLabel"
    main-testid="controlbar-cursor-highlight-btn"
    caret-testid="controlbar-cursor-highlight-caret"
    @main-click="toggle"
    @caret-click="enableIfNeeded"
  >
    <template #main-content>
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
    </template>
    <template #popover-content>
      <CursorHighlightOptions />
    </template>
  </AppButtonDropdown>
</template>
