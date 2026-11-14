import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  clearModuleContext,
  setModuleContext,
  type ModuleSetupContext,
} from '@openpen/module-api'
import CursorHighlightOptions from '../src/CursorHighlightOptions.vue'
import { MODULE_ID } from '../src/module-id'
import {
  COLOR_DEFAULT,
  OPACITY_DEFAULT,
  SIZE_DEFAULT,
  clampGlowOpacity,
  clampSize,
  normalizeColor,
} from '../src/highlight-settings'

describe('clamps — AC#5 size 16..160, opacity 0.1..1', () => {
  it('keeps in-range values, clamps out-of-range ones, falls back to the default for non-numbers', () => {
    expect([clampSize(16), clampSize(100), clampSize(160)]).toEqual([16, 100, 160])
    expect([clampSize(5), clampSize(999)]).toEqual([16, 160])
    expect(clampSize(Number.NaN)).toBe(SIZE_DEFAULT)
    expect([clampGlowOpacity(0.1), clampGlowOpacity(0.6), clampGlowOpacity(1)]).toEqual([0.1, 0.6, 1])
    expect([clampGlowOpacity(0), clampGlowOpacity(5)]).toEqual([0.1, 1])
    expect(clampGlowOpacity(Number.NaN)).toBe(OPACITY_DEFAULT)
    expect(normalizeColor(undefined)).toBe(COLOR_DEFAULT)
    expect(normalizeColor('#ff3b30')).toBe('#ff3b30')
  })
})

describe('options panel — AC#1 adjustments apply immediately, AC#5 saved values clamped', () => {
  afterEach(() => clearModuleContext(MODULE_ID))

  function mountWith(saved: Record<string, unknown>) {
    const updateSettings = vi.fn(async () => {})
    const ctx = {
      moduleId: MODULE_ID,
      locale: 'en',
      getSettings: () => ({ enabled: true, ...saved }),
      updateSettings,
      onSettingsChange: () => () => {},
      t: (key: string) => key,
    } as unknown as ModuleSetupContext
    setModuleContext(MODULE_ID, ctx)
    return { wrapper: mount(CursorHighlightOptions), updateSettings }
  }

  it('a swatch writes the color and the sliders write size and opacity, each at once', async () => {
    const { wrapper, updateSettings } = mountWith({ color: '#ffcc00', size: 100, opacity: 0.6 })
    await nextTick()

    await wrapper.find('[data-testid="cursor-highlight-swatch-ff3b30"]').trigger('click')
    expect(updateSettings).toHaveBeenLastCalledWith({ color: '#ff3b30' })

    // Each slider thumb (the element a screen reader lands on) carries the field name.
    const thumbs = wrapper.findAll('[role="slider"]')
    expect(thumbs.map((t) => t.attributes('aria-label'))).toEqual(['settings.size', 'settings.opacity'])

    const [size, opacity] = wrapper.findAllComponents({ name: 'AppSlider' })
    size.vm.$emit('update:modelValue', 48)
    expect(updateSettings).toHaveBeenLastCalledWith({ size: 48 })
    opacity.vm.$emit('update:modelValue', 35)
    expect(updateSettings).toHaveBeenLastCalledWith({ opacity: 0.35 })
  })

  it('saved size 999 / opacity 5 show as 160px / 100%, and 5 / 0 as 16px / 10%', async () => {
    const hi = mountWith({ size: 999, opacity: 5 })
    await nextTick()
    expect(hi.wrapper.findAll('[role="slider"]')[0].attributes('aria-valuetext')).toBe('160px')
    expect(hi.wrapper.findAll('[role="slider"]')[1].attributes('aria-valuetext')).toBe('100%')
    hi.wrapper.unmount()

    const lo = mountWith({ size: 5, opacity: 0 })
    await nextTick()
    expect(lo.wrapper.findAll('[role="slider"]')[0].attributes('aria-valuetext')).toBe('16px')
    expect(lo.wrapper.findAll('[role="slider"]')[1].attributes('aria-valuetext')).toBe('10%')
  })
})
