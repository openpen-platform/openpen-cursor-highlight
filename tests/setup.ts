/**
 * jsdom has no 2D canvas backend, so `HTMLCanvasElement.getContext` throws a
 * noisy "Not implemented" each call. The overlay already null-guards a missing
 * context (`if (!ctx2d) return`); returning null here exercises that same path
 * quietly. Listener / ripple-DOM lifecycle is what these tests assert, not pixel
 * output, so a null context is the faithful stand-in.
 */
HTMLCanvasElement.prototype.getContext = () => null as never
