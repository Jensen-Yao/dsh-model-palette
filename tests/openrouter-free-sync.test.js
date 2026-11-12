import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreeSyncRuntime, mergeFreeSyncModels } from '../src/openrouter-free-sync.js'
import { createSettingsBackend } from '../src/compat/settings-backend.js'

const catalog = { data: [{ id: 'vendor/model:free', architecture: { input_modalities: ['text'], output_modalities: ['text'] }, context_length: 8192 }] }
beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => Response.json(catalog))))
afterEach(() => vi.unstubAllGlobals())

function settingsStub(value) {
  const revisions = new Map()
  return {
    get(ns) {
      if (ns === 'dsh-model-palette') return value.plugin
      if (ns === 'llm-pi-ai') return value.llm
      return undefined
    },
    snapshot(ns) { return { value: this.get(ns), revision: revisions.get(ns) ?? 0 } },
    describe() { return ['dsh-model-palette', 'llm-pi-ai'].map(ns => ({ ns, ...this.snapshot(ns) })) },
    async mutate(ns, ops, expectedRevision) {
      if (expectedRevision !== undefined && expectedRevision !== (revisions.get(ns) ?? 0)) throw new Error('settings revision conflict')
      const target = ns === 'dsh-model-palette' ? value.plugin : ns === 'llm-pi-ai' ? value.llm : undefined
      if (target === undefined) throw new Error(`unknown namespace ${ns}`)
      for (const op of ops) {
        let node = target
        for (const [index, part] of op.path.entries()) {
          if (index === op.path.length - 1) {
            if (op.op === 'unset') delete node[part]
            else node[part] = structuredClone(op.value)
          } else {
            node[part] = node[part] ?? {}
            node = node[part]
          }
        }
      }
      revisions.set(ns, (revisions.get(ns) ?? 0) + 1)
      return structuredClone(target)
    },
  }
}

function ctxStub(value) {
  return { settings: settingsStub(value), logger: { warn() {}, info() {} } }
}

describe('mergeFreeSyncModels', () => {
  it('replaces the list with the live free catalog and drops stale entries', () => {
    const previous = [
      { id: 'a/old:free', name: 'Old', contextWindow: 1000, maxTokens: 100, input: ['text'] },
      { id: 'z-ai/glm-5.2:free', name: 'GLM', contextWindow: 1, maxTokens: 1, input: [], reasoningEfforts: { high: 'high' } },
    ]
    const live = [
      { id: 'z-ai/glm-5.2:free', name: 'Z.ai: GLM 5.2 (free)', contextWindow: 256000, maxTokens: 230400, input: ['text'] },
      { id: 'nvidia/nemotron:free', name: 'Nemotron (free)', contextWindow: 262144, maxTokens: 4096, input: ['text'] },
    ]
    const result = mergeFreeSyncModels(previous, live, 'openai-completions')
    expect(result.models.map(model => model.id)).toEqual(['z-ai/glm-5.2:free', 'nvidia/nemotron:free'])
    expect(result.added).toBe(1)
    expect(result.removed).toBe(1)
    const glm = result.models[0]
    expect(glm.reasoningEfforts).toEqual({ high: 'high' })
    expect(glm.contextWindow).toBe(1)
    expect(glm.maxTokens).toBe(1)
    expect(glm.input).toEqual(['text'])
    expect(glm.compat).toBeUndefined()
  })

  it('fills missing capacity and DeepSeek compatibility for new deepseek free models', () => {
    const live = [
      { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash (free)', contextWindow: 1000000, maxTokens: 384000, input: ['text'] },
    ]
    const result = mergeFreeSyncModels([], live, 'openai-completions')
    expect(result.models).toHaveLength(1)
    expect(result.models[0].compat).toMatchObject({
      thinkingFormat: 'deepseek',
      requiresReasoningContentOnAssistantMessages: true,
      supportsDeveloperRole: false,
    })
    expect(result.added).toBe(1)
    expect(result.removed).toBe(0)
  })

  it('keeps manual compat on non-deepseek models and never invents fields', () => {
    const previous = [{ id: 'x/y:free', name: 'Y', compat: { supportsDeveloperRole: true } }]
    const live = [{ id: 'x/y:free', name: 'Y (free)', contextWindow: 4096, maxTokens: 1024, input: ['text', 'image'] }]
    const result = mergeFreeSyncModels(previous, live, 'openai-completions')
    expect(result.models[0].compat).toEqual({ supportsDeveloperRole: true })
    expect(result.models[0].input).toEqual(['text', 'image'])
  })

  it('prefills reasoning efforts for catalog-declared reasoning free models without overwriting manual values', () => {
    const previous = [{ id: 'a/manual:free', name: 'Manual', reasoningEfforts: { low: 'low' } }]
    const live = [
      { id: 'a/manual:free', name: 'Manual (free)', input: ['text'], reasoning: true },
      { id: 'b/thinker:free', name: 'Thinker (free)', input: ['text'], reasoning: true },
      { id: 'c/plain:free', name: 'Plain (free)', input: ['text'] },
    ]
    const result = mergeFreeSyncModels(previous, live, 'openai-completions')
    expect(result.models[0].reasoningEfforts).toEqual({ low: 'low' })
    expect(result.models[1].reasoningEfforts).toEqual({ off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high' })
    expect(result.models[2].reasoningEfforts).toBeUndefined()
  })
})

describe('free sync runtime', () => {
  it('syncs the provider models through the settings path and records state', async () => {
    const value = {
      plugin: { freeSync: { providers: { 'openrouter-free': { enabled: true, intervalHours: 6 } }, state: {} } },
      llm: { providers: { 'openrouter-free': { api: 'openai-completions', baseURL: 'https://openrouter.ai/api/v1', models: [{ id: 'stale:free', name: 'Stale' }] } } },
    }
    const ctx = ctxStub(value)
    const native = { ...settingsStub(value), register() {} }
    const runtime = createFreeSyncRuntime(ctx, createSettingsBackend({ settings: native }))
    const summary = await runtime.syncProvider('openrouter-free')
    expect(summary.total).toBeGreaterThan(0)
    expect(value.llm.providers['openrouter-free'].models.length).toBe(summary.total)
    expect(value.plugin.freeSync.state['openrouter-free'].total).toBe(summary.total)
    await runtime.dispose()
  })

  it('refuses providers whose baseURL is not openrouter.ai', async () => {
    const value = {
      plugin: { freeSync: { providers: { evil: { enabled: true, intervalHours: 6 } }, state: {} } },
      llm: { providers: { evil: { api: 'openai-completions', baseURL: 'https://api.example.com/v1', models: [] } } },
    }
    const runtime = createFreeSyncRuntime(ctxStub(value), settingsStub(value))
    await expect(runtime.syncProvider('evil')).rejects.toThrow('openrouter.ai')
    expect(value.plugin.freeSync.state.evil.error).toContain('openrouter.ai')
    await runtime.dispose()
  })

  it('syncs manually without an enabled free-sync rule but still guards the route', async () => {
    const value = {
      plugin: { freeSync: { providers: {}, state: {} } },
      llm: { providers: { 'openrouter-free': { api: 'openai-completions', baseURL: 'https://openrouter.ai/api/v1', models: [{ id: 'stale:free', name: 'Stale' }] } } },
    }
    const ctx = ctxStub(value)
    const native = { ...settingsStub(value), register() {} }
    const runtime = createFreeSyncRuntime(ctx, createSettingsBackend({ settings: native }))
    await expect(runtime.syncProvider('openrouter-free')).rejects.toThrow('not enabled')
    const summary = await runtime.syncProvider('openrouter-free', { manual: true })
    expect(summary.total).toBeGreaterThan(0)
    expect(value.llm.providers['openrouter-free'].models.length).toBe(summary.total)
    await runtime.dispose()
  })

  it('is due when never synced and not due inside the interval window', () => {
    const value = {
      plugin: {
        freeSync: {
          providers: { a: { enabled: true, intervalHours: 6 }, b: { enabled: true, intervalHours: 6 } },
          state: { b: { lastSyncAt: new Date().toISOString() } },
        },
      },
      llm: {},
    }
    const runtime = createFreeSyncRuntime(ctxStub(value), settingsStub(value))
    const settings = value.plugin
    expect(runtime.isDue(settings, 'a')).toBe(true)
    expect(runtime.isDue(settings, 'b')).toBe(false)
    expect(runtime.dueProviders(settings)).toEqual(['a', 'b'])
    void runtime.dispose()
  })

  function enabledValue() {
    return {
      plugin: { freeSync: { providers: { free: { enabled: true, intervalHours: 6 } }, state: {} } },
      llm: { providers: { free: { baseURL: 'https://openrouter.ai/api/v1', models: [{ id: 'vendor/model:free', contextWindow: 100 }] } } },
    }
  }

  it('coalesces concurrent syncs and preserves edits made while fetching', async () => {
    const value = enabledValue()
    let finish
    fetch.mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const runtime = createFreeSyncRuntime(ctxStub(value), settingsStub(value))
    const first = runtime.syncProvider('free')
    const second = runtime.syncProvider('free')
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    value.llm.providers.free.models[0].contextWindow = 777
    finish(Response.json(catalog))
    await expect(first).resolves.toMatchObject({ provider: 'free', total: 1 })
    await second
    expect(value.llm.providers.free.models[0].contextWindow).toBe(777)
    await runtime.dispose()
  })

  it('rejects a competing provider edit queued after the final profile read', async () => {
    const value = enabledValue()
    const settings = settingsStub(value)
    const mutate = settings.mutate.bind(settings)
    let compete = true
    settings.mutate = async (ns, ops, revision) => {
      if (ns === 'llm-pi-ai' && compete) {
        compete = false
        await mutate(ns, [{ op: 'set', path: ['providers', 'free', 'models'], value: [{ id: 'manual', contextWindow: 42 }] }])
      }
      return mutate(ns, ops, revision)
    }
    const runtime = createFreeSyncRuntime(ctxStub(value), settings)
    await expect(runtime.syncProvider('free')).rejects.toThrow('revision conflict')
    expect(value.llm.providers.free.models).toEqual([{ id: 'manual', contextWindow: 42 }])
    await runtime.dispose()
  })

  it('keeps models when the upstream catalog is empty or the provider changes', async () => {
    const value = enabledValue()
    const runtime = createFreeSyncRuntime(ctxStub(value), settingsStub(value))
    fetch.mockResolvedValueOnce(Response.json({ data: [] }))
    await expect(runtime.syncProvider('free')).rejects.toThrow('keeping the configured list')
    expect(value.llm.providers.free.models).toHaveLength(1)
    fetch.mockImplementationOnce(async () => {
      value.plugin.freeSync.providers.free.enabled = false
      return Response.json(catalog)
    })
    await expect(runtime.syncProvider('free')).rejects.toThrow('changed during free sync')
    expect(value.llm.providers.free.models[0].contextWindow).toBe(100)
    await runtime.dispose()
  })

  it('aborts pending catalog requests on disposal without writing models or state', async () => {
    const value = enabledValue()
    const settings = settingsStub(value)
    const mutate = vi.spyOn(settings, 'mutate')
    fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    const runtime = createFreeSyncRuntime(ctxStub(value), settings)
    const outcome = runtime.syncProvider('free').catch(error => error)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    await runtime.dispose()
    expect(await outcome).toBeInstanceOf(Error)
    expect(mutate).not.toHaveBeenCalled()
    await expect(runtime.syncProvider('free')).rejects.toThrow('disposed')
  })

  it('contains scheduled read failures and honors startup-only intervals', async () => {
    const warn = vi.fn()
    const runtime = createFreeSyncRuntime({ logger: { warn } }, { get: async () => { throw new Error('unavailable') } })
    await expect(runtime.syncDueProviders('startup')).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('settings failed'))
    expect(runtime.isDue({ freeSync: { providers: { free: { enabled: true, intervalHours: 0 } }, state: {} } }, 'free')).toBe(true)
    expect(runtime.isDue({ freeSync: { providers: { free: { enabled: true, intervalHours: 0 } }, state: { free: { lastSyncAt: '2020-01-01' } } } }, 'free')).toBe(false)
    await runtime.dispose()
  })

  it('runs a zero-hour schedule at startup and manually, but not on interval ticks', async () => {
    const value = enabledValue()
    value.plugin.freeSync.providers.free.intervalHours = 0
    value.plugin.freeSync.state.free = { lastSyncAt: '2020-01-01' }
    const runtime = createFreeSyncRuntime(ctxStub(value), settingsStub(value))
    await runtime.syncDueProviders('interval')
    expect(fetch).not.toHaveBeenCalled()
    await runtime.syncDueProviders('startup')
    expect(fetch).toHaveBeenCalledOnce()
    await runtime.syncProvider('free')
    expect(fetch).toHaveBeenCalledTimes(2)
    await runtime.dispose()
  })
})
