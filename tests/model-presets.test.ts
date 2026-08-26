import { describe, expect, it } from 'vitest'
import {
  BUNDLED_PRESET_REGISTRY,
  applyModelPreset,
  matchModelPreset,
  normalizeModelAlias,
  validateRegistry,
} from '../src/client/model-presets.ts'

describe('model presets', () => {
  it('matches exact aliases across case, dots, and provider prefixes', () => {
    expect(normalizeModelAlias('Claude.Opus_4.8')).toBe('claude-opus-4-8')
    expect(matchModelPreset('claude-opus-4.8', BUNDLED_PRESET_REGISTRY.presets)?.id).toBe('anthropic-claude-opus-4.8')
    expect(matchModelPreset('openai/gpt-5.6-sol', BUNDLED_PRESET_REGISTRY.presets)?.id).toBe('openai-gpt-5.6-sol')
    expect(matchModelPreset('minimax-m3:free', BUNDLED_PRESET_REGISTRY.presets)?.id).toBe('minimax-m3')
  })

  it('does not guess an unofficial model alias', () => {
    expect(matchModelPreset('gpt-5.6-sol-openai-compact', BUNDLED_PRESET_REGISTRY.presets)).toBeUndefined()
  })

  it('fills missing fields without overwriting existing compatibility data', () => {
    const preset = matchModelPreset('glm-5.3', BUNDLED_PRESET_REGISTRY.presets)!
    expect(applyModelPreset({ id: 'glm-5.3', contextWindow: 42, compat: { supportsDeveloperRole: false } }, preset, false)).toEqual({
      id: 'glm-5.3',
      contextWindow: 42,
      maxTokens: 131072,
      input: ['text'],
      compat: { supportsDeveloperRole: false },
    })
  })

  it('rejects malformed online registries', () => {
    expect(() => validateRegistry({ version: 1, updatedAt: '2026-08-26', presets: [{ id: 'bad' }] })).toThrow('invalid model preset entry')
  })
})
