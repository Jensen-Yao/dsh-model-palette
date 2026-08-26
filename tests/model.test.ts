import { describe, expect, it } from 'vitest'
import { choiceKey, flattenChoices, pushRecent, rankChoices, selectionFor, toggleFavorite } from '../src/client/model.ts'
import type { CatalogGroup } from '../src/client/types.ts'

const groups: CatalogGroup[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
      { id: 'google/gemini-pro', name: 'Gemini Pro' },
    ],
  },
  {
    id: 'bankofai',
    name: 'BankOfAI',
    models: [{
      id: 'deepseek-v4-flash',
      name: 'DeepSeek V4 Flash',
      reasoning: { defaultEffort: 'high', efforts: [{ id: 'high', name: 'High' }] },
    }],
  },
]

describe('model palette ranking', () => {
  it('matches provider names and model names in one query surface', () => {
    const choices = flattenChoices(groups)
    expect(rankChoices(choices, { query: 'bank flash', providerId: null, favorites: [], recents: [], current: null }))
      .toHaveLength(1)
    expect(rankChoices(choices, { query: 'openrouter gemini', providerId: null, favorites: [], recents: [], current: null })[0]?.model.id)
      .toBe('google/gemini-pro')
  })

  it('keeps same-named models scoped to their providers', () => {
    const choices = flattenChoices(groups)
    const filtered = rankChoices(choices, { query: 'deepseek v4 flash', providerId: 'bankofai', favorites: [], recents: [], current: null })
    expect(filtered.map((choice) => choice.key)).toEqual([choiceKey('bankofai', 'deepseek-v4-flash')])
  })

  it('pins current, then favorites, then recents', () => {
    const choices = flattenChoices(groups)
    const ranked = rankChoices(choices, {
      query: '',
      providerId: null,
      favorites: [choiceKey('openrouter', 'google/gemini-pro')],
      recents: [choiceKey('bankofai', 'deepseek-v4-flash')],
      current: { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash' },
    })
    expect(ranked.map((choice) => choice.key)).toEqual([
      choiceKey('openrouter', 'deepseek/deepseek-v4-flash'),
      choiceKey('openrouter', 'google/gemini-pro'),
      choiceKey('bankofai', 'deepseek-v4-flash'),
    ])
  })
})

describe('selection and persistence helpers', () => {
  it('carries a model default reasoning effort', () => {
    expect(selectionFor(groups[1]!, groups[1]!.models[0]!)).toEqual({
      provider: 'bankofai',
      model: 'deepseek-v4-flash',
      reasoningEffort: 'high',
    })
  })

  it('deduplicates recents and toggles favorites', () => {
    expect(pushRecent(['b', 'a'], 'a')).toEqual(['a', 'b'])
    expect(toggleFavorite(['a'], 'a')).toEqual([])
    expect(toggleFavorite(['a'], 'b')).toEqual(['b', 'a'])
  })
})
