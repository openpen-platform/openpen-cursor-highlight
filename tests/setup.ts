/**
 * jsdom has no 2D canvas backend, so `HTMLCanvasElement.getContext` throws a
 * noisy "Not implemented" each call. The overlay already null-guards a missing
 * context (`if (!ctx2d) return`); returning null here exercises that same path
 * quietly. Listener / ripple-DOM lifecycle is what these tests assert, not pixel
 * output, so a null context is the faithful stand-in.
 */
HTMLCanvasElement.prototype.getContext = () => null as never

/**
 * jsdom has no ResizeObserver; the uikit slider (reka-ui) constructs one on
 * mount. The tests assert emitted values, not layout, so an inert stand-in is
 * faithful.
 */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= ResizeObserverStub
