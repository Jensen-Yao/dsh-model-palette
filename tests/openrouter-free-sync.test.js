import { describe, expect, it } from 'vitest'
import { createFreeSyncRuntime, mergeFreeSyncModels } from '../src/openrouter-free-sync.js'

function settingsStub(value) {
  return {
    get(ns) {
      if (ns === 'dsh-model-palette') return value.plugin
      if (ns === 'llm-pi-ai') return value.llm
      return undefined
    },
    async mutate(ns, ops) {
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
})

describe('free sync runtime', () => {
  it('syncs the provider models through the settings path and records state', async () => {
    const value = {
      plugin: { freeSync: { providers: { 'openrouter-free': { enabled: true, intervalHours: 6 } }, state: {} } },
      llm: { providers: { 'openrouter-free': { api: 'openai-completions', baseURL: 'https://openrouter.ai/api/v1', models: [{ id: 'stale:free', name: 'Stale' }] } } },
    }
    const ctx = ctxStub(value)
    const runtime = createFreeSyncRuntime(ctx)
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
    const runtime = createFreeSyncRuntime(ctxStub(value))
    await expect(runtime.syncProvider('evil')).rejects.toThrow('openrouter.ai')
    expect(value.plugin.freeSync.state.evil.error).toContain('openrouter.ai')
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
    const runtime = createFreeSyncRuntime(ctxStub(value))
    const settings = value.plugin
    expect(runtime.isDue(settings, 'a')).toBe(true)
    expect(runtime.isDue(settings, 'b')).toBe(false)
    expect(runtime.dueProviders(settings)).toEqual(['a', 'b'])
    void runtime.dispose()
  })
})
