import { describe, expect, it, vi } from 'vitest'
import { createSettingsBackend } from '../src/compat/settings-backend.js'
import { registerRequestRetrySettings } from '../src/request-retry-settings.js'

describe('settings backend', () => {
  it('forwards native registration, reads, mutations and revisions with the service receiver', async () => {
    const settings = {
      value: { freeSync: {} },
      register() { return { get: () => this.value } },
      get() { return this.value },
      describe() { return [{ ns: 'dsh-model-palette', value: this.value, revision: 7 }] },
      async mutate(ns, ops, revision) { this.last = { ns, ops, revision } },
    }
    const backend = createSettingsBackend({ settings })
    expect(backend.mode).toBe('native')
    expect(registerRequestRetrySettings(backend).get()).toBe(settings.value)
    expect(backend.get('dsh-model-palette')).toBe(settings.value)
    expect(backend.snapshot('dsh-model-palette')).toEqual({ ns: 'dsh-model-palette', value: settings.value, revision: 7 })
    await backend.mutate('llm-pi-ai', [], 3)
    expect(settings.last).toEqual({ ns: 'llm-pi-ai', ops: [], revision: 3 })
  })

  it('reads the owning instance live even when the canonical instance also exists', async () => {
    const own = { ns: 'my-palette', value: { requestRetries: { providers: {} } } }
    const settings = {
      describe: vi.fn(() => [{ ns: 'dsh-model-palette', value: {} }, own]),
      mutate: vi.fn(async () => {}),
    }
    const backend = createSettingsBackend({ settings, fiber: { entry: { options: { id: own.ns } } } })
    const handle = registerRequestRetrySettings(backend)
    expect(handle.get()).toBe(own.value)
    own.value = { requestRetries: { providers: { custom: { maxRetries: 2 } } } }
    expect(handle.get()).toBe(own.value)
    expect(backend.get('dsh-model-palette')).toBe(own.value)
    await backend.mutate('dsh-model-palette', [], 5)
    expect(settings.mutate).toHaveBeenCalledWith('my-palette', [], 5)
    expect(settings.describe).toHaveBeenCalledWith({ redactSecrets: false })
  })

  it('refuses substring matches, missing namespaces and unsupported services', async () => {
    const mutate = vi.fn()
    const backend = createSettingsBackend({ settings: {
      describe: () => [{ ns: 'unrelated-llm-pi-ai-backup', value: {} }], mutate,
    } })
    expect(backend.get('llm-pi-ai')).toBeUndefined()
    await expect(backend.mutate('llm-pi-ai', [])).rejects.toThrow('not loaded')
    expect(mutate).not.toHaveBeenCalled()
    expect(() => createSettingsBackend({ settings: {} })).toThrow('describe/mutate')
  })
})
