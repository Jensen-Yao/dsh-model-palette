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
  it('matches compact and full-width model spellings without dropping provider constraints', () => {
    const choices = flattenChoices([{ id: 'open-router', name: 'Open Router', models: [
      { id: 'openai/gpt-5.6', name: 'GPT-5.6' }, { id: 'other', name: 'Other' },
    ] }])
    const options = { query: 'ＧＰＴ５', providerId: null, favorites: [], recents: [], current: null }
    expect(rankChoices(choices, options).map(choice => choice.model.id)).toEqual(['openai/gpt-5.6'])
    expect(rankChoices(choices, { ...options, query: '@openrouter gpt5' })).toHaveLength(1)
    expect(rankChoices(choices, { ...options, query: '@unknown gpt5' })).toEqual([])
  })

  it('combines natural free/reasoning terms and prioritizes a precise match over unrelated favorites', () => {
    const choices = flattenChoices([{ id: 'route', name: 'Route', models: [
      { id: 'reasoner:free', name: 'Reasoner', reasoning: { efforts: [{ id: 'high', name: 'High' }] } },
      { id: 'fast:free', name: 'Fast' }, { id: 'gpt', name: 'GPT' }, { id: 'gpt-5.6', name: 'GPT-5.6' },
    ] }])
    const options = { query: '免费 推理', providerId: null, favorites: [choiceKey('route', 'gpt-5.6')], recents: [], current: null }
    expect(rankChoices(choices, options).map(choice => choice.model.id)).toEqual(['reasoner:free'])
    expect(rankChoices(choices, { ...options, query: 'is:free is:reasoning' })).toHaveLength(1)
    expect(rankChoices(choices, { ...options, query: 'gpt' })[0]?.model.id).toBe('gpt')
    expect(rankChoices(choices, { ...options, query: '@' })).toEqual([])
  })
  it('combines capability, provider, query and favorite filters', () => {
    const choices = flattenChoices([...groups, { id: 'free', name: 'Free', models: [
      { id: 'model:free', name: 'Free model' }, { id: 'paid', name: 'Paid model' },
    ] }])
    const options = { query: '', providerId: null, favorites: [], recents: [], current: null }
    expect(rankChoices(choices, { ...options, capability: 'free' }).map(choice => choice.model.id)).toEqual(['model:free'])
    expect(rankChoices(choices, { ...options, capability: 'reasoning' }).map(choice => choice.provider.id)).toEqual(['bankofai'])
    expect(rankChoices(choices, { ...options, capability: 'free', providerId: 'bankofai' })).toEqual([])
    expect(rankChoices(choices, { ...options, capability: 'free', quickFilter: 'favorites' })).toEqual([])
  })

  it('sorts by model or provider without discarding active filters', () => {
    const choices = flattenChoices(groups)
    const options = { query: '', providerId: null, favorites: [], recents: [], current: { provider: 'openrouter', model: 'google/gemini-pro' } }
    expect(rankChoices(choices, { ...options, sort: 'name' })[0]?.model.name).toBe('DeepSeek V4 Flash')
    expect(rankChoices(choices, { ...options, sort: 'provider' })[0]?.provider.id).toBe('bankofai')
    expect(rankChoices(choices, { ...options, sort: 'name', query: 'gemini' })).toHaveLength(1)
  })
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

  it('supports local favorite and recent quick filters', () => {
    const choices = flattenChoices(groups)
    expect(rankChoices(choices, {
      query: '',
      providerId: null,
      favorites: [choiceKey('openrouter', 'google/gemini-pro')],
      recents: [choiceKey('bankofai', 'deepseek-v4-flash')],
      current: null,
      quickFilter: 'favorites',
    }).map(choice => choice.key)).toEqual([choiceKey('openrouter', 'google/gemini-pro')])
    expect(rankChoices(choices, {
      query: '',
      providerId: null,
      favorites: [],
      recents: [choiceKey('bankofai', 'deepseek-v4-flash')],
      current: null,
      quickFilter: 'recents',
    }).map(choice => choice.key)).toEqual([choiceKey('bankofai', 'deepseek-v4-flash')])
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
