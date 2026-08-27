import { describe, expect, it } from 'vitest'
import {
  applyMissingPresets,
  applyReasoningCompatibilityDefaults,
  deriveCredentialRef,
  duplicateModelIds,
  duplicateModelTemplate,
  mergeDiscoveredModels,
  nextProviderCopyId,
  repairProviderCompatibility,
  setCompatField,
  setInputModality,
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
      { id: 'known', name: 'Known', contextWindow: 200, maxTokens: 50 },
      { id: 'new', contextWindow: 300 },
    ])
    expect(result).toMatchObject({ added: 1, enriched: 1 })
    expect(result.models[0]).toEqual({
      id: 'known', contextWindow: 100, maxTokens: 50, name: 'Known', compat: { thinkingFormat: 'deepseek' },
    })
    expect(result.models[1]).toEqual({ id: 'new', contextWindow: 300 })
  })
})
