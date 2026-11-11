import type { Directive } from 'vue'

/**
 * Gives the slider thumb an accessible name.
 *
 * The uikit `AppSlider` puts a passed `aria-label` on its outer wrapper, while
 * the focusable element a screen reader announces is the inner thumb
 * (`role="slider"`), which stays unnamed (axe: `aria-input-field-name`). Put
 * this directive on an element wrapping one slider: `v-slider-name="label"`.
 * Remove it once the uikit labels the thumb itself.
 */
function apply(el: HTMLElement, name: string | undefined): void {
  const thumb = el.querySelector('[role="slider"]')
  if (!thumb) return
  if (name) thumb.setAttribute('aria-label', name)
  else thumb.removeAttribute('aria-label')
}

export const vSliderName: Directive<HTMLElement, string> = {
  mounted: (el, binding) => {
    apply(el, binding.value)
    // The thumb can render a tick after the wrapper; retry once.
    void Promise.resolve().then(() => apply(el, binding.value))
  },
  updated: (el, binding) => apply(el, binding.value),
}
