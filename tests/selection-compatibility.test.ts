import { describe, expect, it, vi } from 'vitest'
import {
  ensureSelectionCompatibility,
  ensureSelectionReasoning,
  mayNeedReasoningCompatibility,
} from '../src/client/selection-compatibility.ts'

function namespace(profile: Record<string, unknown>, revision = 3) {
  const value = { providers: { bankofai: profile } }
  return { ns: 'llm-pi-ai', schema: {}, value, user: value, applies: 'live', secrets: [], revision }
}

describe('selection compatibility preflight', () => {
  it('limits automatic checks to known replay-required DeepSeek dialects', () => {
    expect(mayNeedReasoningCompatibility('bankofai', 'deepseek-v4-flash', 'V4 Flash')).toBe(true)
    expect(mayNeedReasoningCompatibility('deepseek', 'deepseek-chat', 'DeepSeek Chat')).toBe(false)
    expect(mayNeedReasoningCompatibility('bankofai', 'gateway-reasoner', 'Reasoner')).toBe(false)
    expect(mayNeedReasoningCompatibility('bankofai', 'gpt-5.6', 'GPT')).toBe(false)
  })

  it('repairs only the selected model before switching', async () => {
    const view = namespace({
      api: 'openai-completions',
      baseURL: 'https://api.bankofai.io/v1',
      models: [{ id: 'deepseek-v4-flash' }, { id: 'deepseek-v3' }],
    })
    const describe = vi.fn(async () => ({ result: { ok: true, value: { namespaces: [view] } } }))
    const mutate = vi.fn(async () => ({ result: { ok: true, value: view } }))
    await expect(ensureSelectionCompatibility({ settings: { describe, mutate } } as never, 'bankofai', 'deepseek-v4-flash'))
      .resolves.toEqual(['deepseek-v4-flash'])
    expect(mutate).toHaveBeenCalledWith({
      ns: 'llm-pi-ai',
      ops: [{
        op: 'set',
        path: ['providers', 'bankofai'],
        value: {
          api: 'openai-completions',
          baseURL: 'https://api.bankofai.io/v1',
          models: [
            {
              id: 'deepseek-v4-flash',
              compat: {
                thinkingFormat: 'deepseek',
                requiresReasoningContentOnAssistantMessages: true,
                supportsDeveloperRole: false,
              },
            },
            { id: 'deepseek-v3' },
          ],
        },
      }],
      expectedRevision: 3,
    })
  })

  it('leaves unsupported protocols and inherited routes untouched', async () => {
    const responses = namespace({ api: 'openai-responses', models: [{ id: 'deepseek-v4-flash' }] })
    const responsesMutate = vi.fn()
    await expect(ensureSelectionCompatibility({
      settings: {
        describe: vi.fn(async () => ({ result: { ok: true, value: { namespaces: [responses] } } })),
        mutate: responsesMutate,
      },
    } as never, 'bankofai', 'deepseek-v4-flash')).resolves.toEqual([])
    expect(responsesMutate).not.toHaveBeenCalled()

    const inherited = { ...responses, user: { providers: {} } }
    await expect(ensureSelectionCompatibility({
      settings: {
        describe: vi.fn(async () => ({ result: { ok: true, value: { namespaces: [inherited] } } })),
        mutate: vi.fn(),
      },
    } as never, 'bankofai', 'deepseek-v4-flash')).resolves.toEqual([])
  })

  it('adds universal reasoning to declared and inherited catalog models', async () => {
    const declared = namespace({ api: 'openai-responses', models: [{ id: 'gpt-custom' }] })
    const mutate = vi.fn(async (_request: unknown) => ({ result: { ok: true, value: declared } }))
    await expect(ensureSelectionReasoning({ settings: {
      describe: vi.fn(async () => ({ result: { ok: true, value: { namespaces: [declared] } } })),
      mutate,
    } } as never, 'bankofai', 'gpt-custom')).resolves.toBe(true)
    const declaredMutation = mutate.mock.calls[0]?.[0] as unknown as { ops: Array<{ value: { models: Array<{ reasoningEfforts: unknown }> } }> }
    expect(declaredMutation.ops[0]?.value.models[0]?.reasoningEfforts).toMatchObject({
      off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max',
    })

    const inherited = { ...declared, user: { providers: {} }, value: { providers: { openai: { api: 'openai-responses' } } } }
    const inheritedMutate = vi.fn(async (_request: unknown) => ({ result: { ok: true, value: inherited } }))
    await expect(ensureSelectionReasoning({ settings: {
      describe: vi.fn(async () => ({ result: { ok: true, value: { namespaces: [inherited] } } })),
      mutate: inheritedMutate,
    } } as never, 'openai', 'gpt-5.6')).resolves.toBe(true)
    const inheritedMutation = inheritedMutate.mock.calls[0]?.[0] as unknown as { ops: Array<{ value: { modelOverrides: Record<string, { reasoningEfforts: Record<string, unknown> }> } }> }
    expect(inheritedMutation.ops[0]?.value.modelOverrides['gpt-5.6']?.reasoningEfforts.max).toBe('max')
  })
})
