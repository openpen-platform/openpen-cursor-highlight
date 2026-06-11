import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import module, { MODULE_ID } from '../src/index'
import { settingsSchema, DEFAULT_SETTINGS } from '../src/live-settings'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', 'src')

describe('defineModule contract', () => {
  it('keeps the canonical plugin id', () => {
    expect(MODULE_ID).toBe('@openpen/cursor-highlight')
    expect(module.id).toBe('@openpen/cursor-highlight')
  })

  it('declares a version (required for plugins)', () => {
    expect(module.version).toBe('1.0.0')
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

  it('enforces the size range (16–160)', () => {
    expect(() => settingsSchema.parse({ size: 15 })).toThrow()
    expect(() => settingsSchema.parse({ size: 161 })).toThrow()
    expect(settingsSchema.parse({ size: 16 }).size).toBe(16)
    expect(settingsSchema.parse({ size: 160 }).size).toBe(160)
  })

  it('enforces the opacity range (0.1–1)', () => {
    expect(() => settingsSchema.parse({ opacity: 0.05 })).toThrow()
    expect(() => settingsSchema.parse({ opacity: 1.5 })).toThrow()
    expect(settingsSchema.parse({ opacity: 0.1 }).opacity).toBe(0.1)
    expect(settingsSchema.parse({ opacity: 1 }).opacity).toBe(1)
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
