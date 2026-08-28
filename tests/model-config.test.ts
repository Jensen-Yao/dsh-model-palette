import { describe, expect, it } from 'vitest'
import {
  applyMissingPresets,
  applyReasoningCompatibilityDefaults,
  applyReasoningDispatchDefaults,
  applyUniversalReasoningDefaults,
  applyUniversalReasoningToProvider,
  deriveCredentialRef,
  duplicateModelIds,
  duplicateModelTemplate,
  mergeDiscoveredModels,
  mergeDiscoveredModelsWithPresets,
  nextProviderCopyId,
  repairProviderCompatibility,
  ensureModelReasoning,
  hasUniversalReasoningEfforts,
  inputMode,
  setCompatField,
  setInputModality,
  setInputMode,
  setReasoningEffort,
  setReasoningMode,
  synchronizeOpenRouterFreeModels,
} from '../src/client/model-config.ts'
import { BUNDLED_PRESET_REGISTRY } from '../src/client/model-presets.ts'

describe('model configuration helpers', () => {
  it('derives portable credential refs', () => {
    expect(deriveCredentialRef('bank-of-ai')).toBe('BANK_OF_AI_API_KEY')
  })

  it('allocates provider copy ids without overwriting an existing route', () => {
    expect(nextProviderCopyId('bankofai', ['bankofai', 'bankofai-copy'])).toBe('bankofai-copy-2')
  })

  it('copies model parameters without copying the route identity', () => {
    expect(duplicateModelTemplate({ id: 'source', name: 'Source', contextWindow: 100, compat: { thinkingFormat: 'deepseek' } })).toEqual({
      contextWindow: 100,
      compat: { thinkingFormat: 'deepseek' },
    })
  })

  it('reports duplicate model ids after trimming', () => {
    expect(duplicateModelIds([{ id: 'same' }, { id: ' same ' }, { id: 'other' }])).toEqual(['same'])
  })

  it('preserves unrelated model fields while editing input and compatibility', () => {
    const model = { id: 'custom', reasoningEfforts: { high: 'high' }, compat: { maxTokensField: 'max_tokens' } }
    const withInput = setInputModality(model, 'image', true)
    const withCompat = setCompatField(withInput, 'supportsDeveloperRole', false)
    expect(withCompat).toEqual({
      id: 'custom',
      reasoningEfforts: { high: 'high' },
      input: ['image'],
      compat: { maxTokensField: 'max_tokens', supportsDeveloperRole: false },
    })
  })

  it('represents inherited, text, visual, and image-only input modes', () => {
    expect(inputMode({})).toBe('inherit')
    expect(inputMode(setInputMode({}, 'text'))).toBe('text')
    expect(inputMode(setInputMode({}, 'text-image'))).toBe('text-image')
    expect(inputMode(setInputMode({}, 'image'))).toBe('image')
    expect(setInputMode({ defaultInput: ['text', 'image'] }, 'inherit', 'defaultInput')).toEqual({})
  })

  it('repairs DeepSeek reasoning replay compatibility for custom OpenAI gateways', () => {
    const result = repairProviderCompatibility({
      api: 'openai-completions',
      models: [{ id: 'deepseek-v4-flash' }],
    })
    expect(result).toMatchObject({ changed: true, repairedModels: ['deepseek-v4-flash'] })
    expect(result.profile.models).toEqual([{
      id: 'deepseek-v4-flash',
      compat: {
        thinkingFormat: 'deepseek',
        requiresReasoningContentOnAssistantMessages: true,
        supportsDeveloperRole: false,
      },
    }])
  })

  it('repairs an explicitly marked DeepSeek dialect even when the model id is a gateway alias', () => {
    const result = applyReasoningCompatibilityDefaults('openai-completions', {
      id: 'v4-flash',
      compat: { thinkingFormat: 'deepseek' },
    })
    expect(result).toEqual({
      changed: true,
      model: {
        id: 'v4-flash',
        compat: {
          thinkingFormat: 'deepseek',
          requiresReasoningContentOnAssistantMessages: true,
          supportsDeveloperRole: false,
        },
      },
    })
  })

  it('does not rewrite ordinary models or explicit compatibility choices', () => {
    expect(repairProviderCompatibility({
      api: 'openai-completions',
      models: [{ id: 'gpt-5.6' }],
    }).changed).toBe(false)
    expect(repairProviderCompatibility({
      api: 'openai-completions',
      models: [{ id: 'deepseek-v4-flash', compat: { thinkingFormat: 'openai' } }],
    }).changed).toBe(false)
    expect(applyReasoningCompatibilityDefaults('openai-responses', { id: 'deepseek-v4-flash' })).toEqual({
      changed: false,
      model: { id: 'deepseek-v4-flash' },
    })
  })

  it('keeps manual values while filling only missing DeepSeek fields', () => {
    const result = applyReasoningCompatibilityDefaults('openai-completions', {
      id: 'deepseek-v4-flash',
      compat: { supportsDeveloperRole: true, requiresReasoningContentOnAssistantMessages: false },
    })
    expect(result.model).toEqual({
      id: 'deepseek-v4-flash',
      compat: {
        supportsDeveloperRole: true,
        requiresReasoningContentOnAssistantMessages: false,
        thinkingFormat: 'deepseek',
      },
    })
  })

  it('enables every reasoning level with provider-aware compatibility defaults', () => {
    const deepseek = applyUniversalReasoningDefaults('bankofai', {
      api: 'openai-completions', baseURL: 'https://api.bankofai.example/v1',
    }, { id: 'deepseek-v4-flash' })
    expect(hasUniversalReasoningEfforts(deepseek)).toBe(true)
    expect(deepseek.compat).toEqual({
      thinkingFormat: 'deepseek',
      supportsReasoningEffort: true,
      requiresReasoningContentOnAssistantMessages: true,
      supportsDeveloperRole: false,
    })

    const openrouter = applyUniversalReasoningDefaults('openrouter', {
      api: 'openai-completions', baseURL: 'https://openrouter.ai/api/v1',
    }, { id: 'openai/gpt-test' })
    expect(openrouter.compat).toEqual({ thinkingFormat: 'openrouter' })
  })

  it('adds provider dispatch compatibility without replacing preset effort maps', () => {
    const result = applyReasoningDispatchDefaults('qwen-token-plan', {
      api: 'openai-completions', baseURL: 'https://example.com/v1',
    }, { id: 'qwen3.7-plus', reasoningEfforts: { high: 'HIGH' } })
    expect(result).toEqual({
      id: 'qwen3.7-plus',
      reasoningEfforts: { high: 'HIGH' },
      compat: { thinkingFormat: 'qwen', supportsReasoningEffort: false },
    })
  })

  it('supports inherit, disabled, all, and manual reasoning maps', () => {
    const all = setReasoningMode({ id: 'gpt' }, 'all')
    expect(hasUniversalReasoningEfforts(all)).toBe(true)
    expect(setReasoningMode(all, 'disabled').reasoningEfforts).toBe(false)
    expect(setReasoningMode(all, 'inherit')).toEqual({ id: 'gpt' })
    expect(setReasoningEffort({ id: 'gpt' }, 'high', true, 'high-plus')).toEqual({
      id: 'gpt', reasoningEfforts: { high: 'high-plus' },
    })
  })

  it('updates declared models and inherited catalog overrides', () => {
    const declared = applyUniversalReasoningToProvider('custom', {
      api: 'openai-responses', models: [{ id: 'gpt-custom' }, { id: 'other', reasoningEfforts: false }],
    })
    expect(declared.changed).toBe(2)
    expect((declared.profile.models as Array<Record<string, unknown>>).every(hasUniversalReasoningEfforts)).toBe(true)

    const inherited = ensureModelReasoning('openai', { api: 'openai-responses' }, 'gpt-5.6')
    expect(inherited.changed).toBe(true)
    expect(inherited.profile.modelOverrides).toEqual({
      'gpt-5.6': { reasoningEfforts: expect.objectContaining({ off: null, minimal: 'minimal', max: 'max' }) },
    })
  })

  it('fills only exact preset matches', () => {
    const result = applyMissingPresets([
      { id: 'gpt-5.6-sol' },
      { id: 'gpt-5.6-sol-openai-compact' },
    ], BUNDLED_PRESET_REGISTRY.presets)
    expect(result.applied).toBe(1)
    expect(result.models[0]).toMatchObject({ contextWindow: 1050000, maxTokens: 128000 })
    expect(result.models[1]).toEqual({ id: 'gpt-5.6-sol-openai-compact' })
  })

  it('merges provider discovery without discarding manual configuration', () => {
    const result = mergeDiscoveredModels([
      { id: 'known', contextWindow: 100, compat: { thinkingFormat: 'deepseek' } },
    ], [
      { id: 'known', name: 'Known', contextWindow: 200, maxTokens: 50, input: ['text', 'image'] },
      { id: 'new', contextWindow: 300, input: ['text'] },
    ])
    expect(result).toMatchObject({ added: 1, enriched: 1 })
    expect(result.models[0]).toEqual({
      id: 'known', contextWindow: 100, maxTokens: 50, name: 'Known', input: ['text', 'image'], compat: { thinkingFormat: 'deepseek' },
    })
    expect(result.models[1]).toEqual({ id: 'new', contextWindow: 300, input: ['text'] })
  })

  it('fills missing discovered capacities from exact presets automatically', () => {
    const result = mergeDiscoveredModelsWithPresets([], [
      { id: 'gpt-5.6-sol', name: 'Gateway GPT' },
    ], BUNDLED_PRESET_REGISTRY.presets)
    expect(result).toMatchObject({ added: 1, enriched: 0, presetsApplied: 1 })
    expect(result.models[0]).toMatchObject({
      id: 'gpt-5.6-sol', name: 'Gateway GPT', contextWindow: 1050000, maxTokens: 128000, input: ['text', 'image'],
    })
  })

  it('synchronizes current OpenRouter free variants and removes expired ones', () => {
    const result = synchronizeOpenRouterFreeModels([
      { id: 'paid/model', contextWindow: 10 },
      { id: 'old/free:free', contextWindow: 20 },
      { id: 'live/model:free', compat: { thinkingFormat: 'openrouter' } },
    ], [
      { id: 'live/model:free', name: 'Live', contextWindow: 100, maxTokens: 40, input: ['text', 'image'] },
      { id: 'new/model:free', contextWindow: 200, input: ['text'] },
    ])
    expect(result).toMatchObject({ added: 1, enriched: 1, removed: 1 })
    expect(result.models).toEqual([
      { id: 'paid/model', contextWindow: 10 },
      { id: 'live/model:free', name: 'Live', contextWindow: 100, maxTokens: 40, input: ['text', 'image'], compat: { thinkingFormat: 'openrouter' } },
      { id: 'new/model:free', contextWindow: 200, input: ['text'] },
    ])
  })
})
