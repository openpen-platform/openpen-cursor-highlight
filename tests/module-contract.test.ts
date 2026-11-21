import { describe, it, expect, vi } from 'vitest'
import type { ModuleSetupContext } from '@openpen/module-api'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import module, { MODULE_ID } from '../src/index'
import { settingsSchema, DEFAULT_SETTINGS } from '../src/live-settings'
import en from '../src/locales/en.json'
import zhHant from '../src/locales/zh-Hant.json'
import zhHans from '../src/locales/zh-Hans.json'
import ja from '../src/locales/ja.json'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', 'src')

describe('defineModule contract', () => {
  it('keeps the canonical plugin id', () => {
    expect(MODULE_ID).toBe('@openpen/cursor-highlight')
    expect(module.id).toBe('@openpen/cursor-highlight')
  })

  it('declares a version (required for plugins)', () => {
    expect(module.version).toBe('1.0.1')
  })

  it('carries the settings schema used to validate writes', () => {
    expect(module.settingsSchema).toBe(settingsSchema)
  })

  it('contributes exactly one HTML overlay (the cursor canvas)', () => {
    const overlays = module.contributes?.htmlOverlays
    expect(overlays).toHaveLength(1)
    expect(overlays?.[0]?.id).toBe('cursor-highlight')
    expect(overlays?.[0]?.component).toBeTruthy()
  })

  it('contributes one control-bar toggle in the effects group', () => {
    const bar = module.contributes?.controlBar
    expect(bar).toHaveLength(1)
    expect(bar?.[0]?.id).toBe('cursor-highlight')
    expect(bar?.[0]?.defaultGroup).toBe('effects')
    expect(bar?.[0]?.component).toBeTruthy()
  })

  it('contributes one settings panel with localised labels', () => {
    const panels = module.contributes?.settingsPanels
    expect(panels).toHaveLength(1)
    expect(panels?.[0]?.id).toBe('cursor-highlight-settings')
    expect(panels?.[0]?.component).toBeTruthy()
    const label = panels?.[0]?.label as Record<string, string>
    expect(label.en).toBeTruthy()
    expect(label['zh-Hant']).toBeTruthy()
    expect(label['zh-Hans']).toBeTruthy()
    expect(label.ja).toBeTruthy()
  })

  it('registers locale dictionaries for all four shipped locales', () => {
    const locales = module.contributes?.locales as Record<string, unknown>
    expect(Object.keys(locales).sort()).toEqual(
      ['en', 'ja', 'zh-Hans', 'zh-Hant'].sort(),
    )
  })
})

describe('settingsSchema', () => {
  it('produces the documented defaults when given an empty object', () => {
    const parsed = settingsSchema.parse({})
    expect(parsed).toEqual({
      enabled: false,
      color: '#ffcc00',
      size: 100,
      opacity: 0.6,
      ripple: true,
    })
    expect(parsed).toEqual(DEFAULT_SETTINGS)
  })

  it('defaults enabled to false so the overlay holds no listeners until toggled on', () => {
    expect(settingsSchema.parse({}).enabled).toBe(false)
  })

  it('does not reject the whole settings object over one out-of-range value (clamped on read instead)', () => {
    expect(() => settingsSchema.parse({ size: 15, opacity: 1.5 })).not.toThrow()
    expect(() => settingsSchema.parse({ size: 999, opacity: 0 })).not.toThrow()
  })
})

/** Flatten a nested locale dictionary into dotted keys. */
function leafKeys(dict: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? leafKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

function leafValue(dict: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict)
}

describe('toggle shortcut (AC#2)', () => {
  const shortcut = () => module.contributes!.shortcuts?.find((s) => s.id === 'toggle-cursor-highlight')

  it('registers a rebindable global shortcut with a label in all four languages', () => {
    const s = shortcut()!
    expect(s.keys).toBeTruthy()
    expect(s.scope).toBe('global')
    expect(s.userCustomizable).toBe(true)
    expect(Object.keys(s.label as Record<string, string>).sort()).toEqual(['en', 'ja', 'zh-Hans', 'zh-Hant'])
  })

  it('flips the persisted enabled flag each time it fires (off -> on -> off)', async () => {
    let current = { enabled: false }
    const updateSettings = vi.fn(async (patch: Partial<typeof current>) => {
      current = { ...current, ...patch }
    })
    module.setup!({
      getSettings: () => current,
      updateSettings,
      onSettingsChange: () => () => {},
      onDispose: () => {},
    } as unknown as ModuleSetupContext)
    shortcut()!.handler()
    expect(updateSettings).toHaveBeenLastCalledWith({ enabled: true })
    await Promise.resolve()
    shortcut()!.handler()
    expect(updateSettings).toHaveBeenLastCalledWith({ enabled: false })
  })
})

describe('locales (AC#4)', () => {
  const locales = { en, 'zh-Hant': zhHant, 'zh-Hans': zhHans, ja } as Record<string, Record<string, unknown>>

  it('every language has exactly the English key set, each with a non-empty string', () => {
    const base = leafKeys(en).sort()
    expect(base).toContain('options.label')
    expect(base).toContain('colors.ffcc00')
    for (const [name, dict] of Object.entries(locales)) {
      expect(leafKeys(dict).sort(), name).toEqual(base)
      for (const key of base) {
        const v = leafValue(dict, key)
        expect(typeof v === 'string' && v.trim().length > 0, `${name}:${key}`).toBe(true)
      }
    }
  })

  it('non-English languages translate the new strings instead of copying English', () => {
    for (const name of ['zh-Hant', 'zh-Hans', 'ja']) {
      for (const key of ['options.label', 'colors.ffcc00', 'colors.ffffff']) {
        expect(leafValue(locales[name], key), `${name}:${key}`).not.toBe(leafValue(en, key))
      }
    }
  })
})

describe('import boundary', () => {
  function allSourceText(): string {
    const files = readdirSync(srcDir, { recursive: true }) as string[]
    return files
      .filter((f) => /\.(ts|vue)$/.test(f))
      .map((f) => readFileSync(join(srcDir, f), 'utf8'))
      .join('\n')
  }

  it('never imports the host registry', () => {
    expect(allSourceText()).not.toMatch(/['"][^'"]*\/host\/registry['"]/)
  })

  it('never imports vue-i18n directly (i18n goes through ctx.t)', () => {
    expect(allSourceText()).not.toMatch(/vue-i18n/)
  })
})
