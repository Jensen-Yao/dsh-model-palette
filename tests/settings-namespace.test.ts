import { describe, expect, it } from 'vitest'
import { settingsEntry } from '../src/settings-namespace.ts'
import z from '@deepseek-ai/schemastery'

describe('settings entry resolution', () => {
  it('prefers exact ids and resolves a single renamed schema', () => {
    const renamed = { ns: 'models', schema: { dict: { providers: {} } } }
    const exact = { ns: 'llm-pi-ai', schema: {} }
    expect(settingsEntry([renamed, exact], 'llm-pi-ai')).toBe(exact)
    expect(settingsEntry([renamed], 'llm-pi-ai')).toBe(renamed)
    const palette = { ns: 'palette', schema: { dict: { requestRetries: {}, freeSync: {} } } }
    expect(settingsEntry([palette], 'dsh-model-palette')).toBe(palette)
  })

  it('reads the actual Schemastery uid/refs envelope returned by SettingsForms', () => {
    const entry = { ns: 'profile-models', schema: z.object({ providers: z.dict(z.any()) }).toJSON() }
    expect(settingsEntry([entry], 'llm-pi-ai')).toBe(entry)
    const palette = { ns: 'profile-palette', schema: z.object({ requestRetries: z.any(), freeSync: z.any() }).toJSON() }
    expect(settingsEntry([palette], 'dsh-model-palette')).toBe(palette)
  })

  it('refuses ambiguous entries and ignores names that merely contain the namespace', () => {
    const entries = ['a', 'b'].map(ns => ({ ns, schema: { dict: { providers: {} } } }))
    expect(() => settingsEntry(entries, 'llm-pi-ai')).toThrow('Multiple settings entries')
    expect(settingsEntry([{ ns: 'other-llm-pi-ai', value: { providers: {} } }], 'llm-pi-ai')).toBeUndefined()
    expect(settingsEntry(entries, 'custom')).toBeUndefined()
  })
})
