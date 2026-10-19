import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply, Config } from '../src/index.js'

afterEach(() => vi.useRealTimers())

describe('plugin lifecycle', () => {
  it.each(['native', 'forms'])('mounts and drains timers, routes and settings on %s settings', async mode => {
    vi.useFakeTimers()
    const effects = []
    const routes = new Set()
    const disposeSettings = vi.fn()
    const settings = mode === 'native' ? {
      register: vi.fn(() => ({ get: () => ({}), dispose: disposeSettings })),
      get: () => ({}), mutate: vi.fn(),
    } : { describe: () => [], mutate: vi.fn() }
    const ctx = {
      settings,
      effect(factory) { effects.push(factory()) },
      on: () => () => {},
      webServer: { register(route) { routes.add(route.path); return () => routes.delete(route.path) } },
    }
    apply(ctx, { openrouterMedia: { enabled: false } })
    expect(routes).toContain('/model-palette/api/config')
    expect(routes).toContain('/model-palette/api/free-sync')
    expect(vi.getTimerCount()).toBe(2)
    for (const dispose of effects.reverse()) await dispose()
    expect(routes.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    if (mode === 'native') expect(disposeSettings).toHaveBeenCalledOnce()
  })

  it('keeps retry and free-sync sections visible to SettingsForms', () => {
    const schema = Config
    expect(schema.dict.requestRetries.meta.volatile).toBe(true)
    expect(schema.dict.freeSync.meta.volatile).toBe(true)
  })
})
