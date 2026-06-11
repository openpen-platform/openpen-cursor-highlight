import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setModuleContext, clearModuleContext } from '@openpen/module-api'
import type { ModuleSetupContext } from '@openpen/module-api'
import CursorHighlightOverlay from '../src/CursorHighlightOverlay.vue'
import {
  DEFAULT_SETTINGS,
  type CursorHighlightSettings,
} from '../src/live-settings'
import { MODULE_ID } from '../src/module-id'

/**
 * A controllable in-memory stand-in for the host's ModuleSetupContext.
 * `setSettings` drives `onSettingsChange` subscribers the same way a real
 * `updateSettings()` write would, letting the test toggle `enabled` and watch
 * the overlay attach / detach its global listeners.
 */
function makeFakeContext(initial: CursorHighlightSettings) {
  let settings: CursorHighlightSettings = { ...initial }
  const subs = new Set<(s: CursorHighlightSettings) => void>()
  let unsubCalls = 0

  const ctx: ModuleSetupContext = {
    moduleId: MODULE_ID,
    locale: 'en',
    getSettings: <T = unknown>() => settings as unknown as T,
    updateSettings: async () => {},
    onSettingsChange: <T = unknown>(cb: (s: T) => void) => {
      const fn = cb as unknown as (s: CursorHighlightSettings) => void
      subs.add(fn)
      return () => {
        unsubCalls += 1
        subs.delete(fn)
      }
    },
    callMain: async () => undefined as never,
    onDispose: () => {},
    notify: () => ({ dismiss: () => {} }) as never,
    t: (key: string) => key,
  }

  return {
    ctx,
    setSettings(next: Partial<CursorHighlightSettings>) {
      settings = { ...settings, ...next }
      for (const cb of subs) cb(settings)
    },
    get subscriberCount() {
      return subs.size
    },
    get unsubCalls() {
      return unsubCalls
    },
  }
}

/** A controllable requestAnimationFrame: callbacks fire only when flushed. */
function installManualRaf() {
  let nextId = 1
  let queue = new Map<number, FrameRequestCallback>()
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb: FrameRequestCallback) => {
      const id = nextId++
      queue.set(id, cb)
      return id
    })
  const caf = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation((id: number) => {
      queue.delete(id)
    })
  return {
    raf,
    caf,
    /** Run every currently-queued callback once with timestamp `now`. */
    flush(now: number) {
      const pending = queue
      queue = new Map()
      for (const cb of pending.values()) cb(now)
    },
    get pendingCount() {
      return queue.size
    },
  }
}

let addSpy: ReturnType<typeof vi.spyOn>
let removeSpy: ReturnType<typeof vi.spyOn>

function listenerCount(type: 'mousemove' | 'mousedown'): number {
  const added = addSpy.mock.calls.filter((c) => c[0] === type).length
  const removed = removeSpy.mock.calls.filter((c) => c[0] === type).length
  return added - removed
}

beforeEach(() => {
  addSpy = vi.spyOn(window, 'addEventListener')
  removeSpy = vi.spyOn(window, 'removeEventListener')
})

afterEach(() => {
  clearModuleContext(MODULE_ID)
  vi.restoreAllMocks()
})

describe('overlay listener lifecycle', () => {
  it('attaches no mousemove/mousedown listeners while disabled', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: false })
    setModuleContext(MODULE_ID, fake.ctx)
    mount(CursorHighlightOverlay)

    expect(listenerCount('mousemove')).toBe(0)
    expect(listenerCount('mousedown')).toBe(0)
  })

  it('attaches both listeners exactly once when enabled at mount', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true })
    setModuleContext(MODULE_ID, fake.ctx)
    mount(CursorHighlightOverlay)

    expect(listenerCount('mousemove')).toBe(1)
    expect(listenerCount('mousedown')).toBe(1)
  })

  it('attaches on enable and detaches both listeners on disable', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: false })
    setModuleContext(MODULE_ID, fake.ctx)
    mount(CursorHighlightOverlay)

    fake.setSettings({ enabled: true })
    expect(listenerCount('mousemove')).toBe(1)
    expect(listenerCount('mousedown')).toBe(1)

    fake.setSettings({ enabled: false })
    expect(listenerCount('mousemove')).toBe(0)
    expect(listenerCount('mousedown')).toBe(0)
  })

  it('is idempotent: repeated enable=true does not double-register listeners', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true })
    setModuleContext(MODULE_ID, fake.ctx)
    mount(CursorHighlightOverlay)

    fake.setSettings({ enabled: true })
    fake.setSettings({ enabled: true })

    expect(listenerCount('mousemove')).toBe(1)
    expect(listenerCount('mousedown')).toBe(1)
    expect(
      addSpy.mock.calls.filter((c) => c[0] === 'mousemove').length,
    ).toBe(1)
  })

  it('removes both listeners and unsubscribes on unmount (0 residual)', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay)

    expect(fake.subscriberCount).toBe(1)

    wrapper.unmount()

    expect(listenerCount('mousemove')).toBe(0)
    expect(listenerCount('mousedown')).toBe(0)
    expect(fake.unsubCalls).toBe(1)
    expect(fake.subscriberCount).toBe(0)
  })
})

describe('ripple DOM lifecycle', () => {
  function rippleNodes(wrapper: ReturnType<typeof mount>): number {
    return wrapper.element.querySelectorAll('.ch-ripple').length
  }

  it('spawns a ripple node on mousedown when enabled + ripple on', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: true })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }))
    expect(rippleNodes(wrapper)).toBe(1)

    wrapper.unmount()
  })

  it('does not spawn a ripple when ripple is disabled', () => {
    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: false })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }))
    expect(rippleNodes(wrapper)).toBe(0)

    wrapper.unmount()
  })

  it('removes the ripple node once its animation completes (no leak)', () => {
    const manual = installManualRaf()
    const nowSpy = vi.spyOn(performance, 'now')
    nowSpy.mockReturnValue(0)

    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: true })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }))
    expect(rippleNodes(wrapper)).toBe(1)

    // First frame mid-animation: node still present.
    manual.flush(200)
    expect(rippleNodes(wrapper)).toBe(1)

    // Frame at/after RIPPLE_DURATION_MS: node removed + array spliced.
    manual.flush(400)
    expect(rippleNodes(wrapper)).toBe(0)
    // No further ripple frame should be queued once the array is empty.
    expect(manual.pendingCount).toBe(0)

    wrapper.unmount()
  })

  it('removes all ripple nodes and cancels the loop when disabled mid-animation', () => {
    const manual = installManualRaf()
    vi.spyOn(performance, 'now').mockReturnValue(0)

    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: true })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }))
    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 30, clientY: 40 }))
    expect(rippleNodes(wrapper)).toBe(2)

    fake.setSettings({ enabled: false })

    expect(rippleNodes(wrapper)).toBe(0)
    expect(manual.pendingCount).toBe(0)

    wrapper.unmount()
  })

  it('clears the full backing store at a fractional DPR (no edge ghost)', () => {
    // Drive the overlay with a recording 2D context + a fractional DPR so the
    // backing store (canvasPixelSize → Math.ceil) and the float CSS×DPR product
    // diverge. clearCanvas MUST clear the rounded-up backing store, otherwise a
    // ~1px sliver keeps a stale glow at DPRs like 125%.
    const dpr = 1.25
    const cssWidth = 801
    const cssHeight = 601
    const expected = {
      width: Math.ceil(cssWidth * dpr), // 1002 (float product is 1001.25)
      height: Math.ceil(cssHeight * dpr), // 752 (float product is 751.25)
    }

    const clearRectCalls: Array<[number, number, number, number]> = []
    const stubCtx = {
      setTransform: () => {},
      clearRect: (x: number, y: number, w: number, h: number) =>
        clearRectCalls.push([x, y, w, h]),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      set fillStyle(_v: unknown) {},
    } as unknown as CanvasRenderingContext2D

    const manual = installManualRaf()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(stubCtx)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: cssWidth,
      height: cssHeight,
      left: 0,
      top: 0,
      right: cssWidth,
      bottom: cssHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    const realDpr = window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: dpr,
    })

    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: false })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    manual.flush(0)

    expect(clearRectCalls.length).toBeGreaterThan(0)
    for (const [x, y, w, h] of clearRectCalls) {
      expect([x, y]).toEqual([0, 0])
      expect(w).toBe(expected.width)
      expect(h).toBe(expected.height)
    }

    wrapper.unmount()
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: realDpr,
    })
  })

  it('removes ripple nodes on unmount even mid-animation (no leak)', () => {
    installManualRaf()
    vi.spyOn(performance, 'now').mockReturnValue(0)

    const fake = makeFakeContext({ ...DEFAULT_SETTINGS, enabled: true, ripple: true })
    setModuleContext(MODULE_ID, fake.ctx)
    const wrapper = mount(CursorHighlightOverlay, { attachTo: document.body })

    window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20 }))
    expect(rippleNodes(wrapper)).toBe(1)

    const root = wrapper.element as HTMLElement
    wrapper.unmount()

    // After unmount the overlay's stopListening() must have cleared the ripple
    // nodes from the detached subtree.
    expect(root.querySelectorAll('.ch-ripple').length).toBe(0)
  })
})
