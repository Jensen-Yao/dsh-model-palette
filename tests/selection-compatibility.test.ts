import { describe, expect, it, vi } from 'vitest'
import {
  ensureSelectionCompatibility,
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
})
