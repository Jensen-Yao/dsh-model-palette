import { describe, expect, it } from 'vitest'
import {
  applyMissingPresets,
  deriveCredentialRef,
  duplicateModelIds,
  duplicateModelTemplate,
  mergeDiscoveredModels,
  nextProviderCopyId,
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
