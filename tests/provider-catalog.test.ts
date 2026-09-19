import { describe, expect, it } from 'vitest'
import {
  ALL_TEMPLATES,
  API_KEY_TEMPLATES,
  CUSTOM_TEMPLATES,
  SUBSCRIPTION_TEMPLATES,
  filterTemplates,
  providerMeta,
  templatesByCategory,
} from '../src/client/provider-catalog.ts'

describe('provider catalog', () => {
  it('groups every template into exactly one category', () => {
    const grouped = templatesByCategory()
    expect(grouped.custom).toEqual(CUSTOM_TEMPLATES)
    expect(grouped.subscription).toEqual(SUBSCRIPTION_TEMPLATES)
    expect(grouped.apiKey).toEqual(API_KEY_TEMPLATES)
    expect(ALL_TEMPLATES).toHaveLength(CUSTOM_TEMPLATES.length + SUBSCRIPTION_TEMPLATES.length + API_KEY_TEMPLATES.length)
  })

  it('keeps template ids unique and preset protocols supported', () => {
    const ids = new Set(ALL_TEMPLATES.map(template => template.id))
    expect(ids.size).toBe(ALL_TEMPLATES.length)
    for (const template of ALL_TEMPLATES) {
      if (template.api !== undefined) {
        expect(['openai-completions', 'openai-responses', 'anthropic-messages']).toContain(template.api)
      }
    }
  })

  it('prefills the OpenRouter template with endpoint, protocol, and credential ref', () => {
    const openrouter = API_KEY_TEMPLATES.find(template => template.id === 'openrouter')
    expect(openrouter).toMatchObject({
      baseURL: 'https://openrouter.ai/api/v1',
      api: 'openai-completions',
      credentialRef: 'OPENROUTER_API_KEY',
    })
  })

  it('filters templates across name, id, and hint', () => {
    expect(filterTemplates(API_KEY_TEMPLATES, 'moonshot').map(template => template.id)).toContain('moonshotai')
    expect(filterTemplates(API_KEY_TEMPLATES, 'openrouter.ai').map(template => template.id)).toContain('openrouter')
    expect(filterTemplates(API_KEY_TEMPLATES, 'does-not-exist')).toEqual([])
  })

  it('matches configured providers to brand icons by id and baseURL host', () => {
    expect(providerMeta('openrouter', { baseURL: 'https://openrouter.ai/api/v1' }).icon).toBe('openrouter')
    expect(providerMeta('my-deepseek-route', { baseURL: 'https://api.deepseek.com' }).icon).toBe('deepseek')
    expect(providerMeta('gateway', { baseURL: 'https://api.moonshot.cn/v1' }).icon).toBe('moonshot')
    expect(providerMeta('bankofai', { baseURL: 'https://api.bankofai.io/v1' }).icon).toBe('generic')
    expect(providerMeta('something-with-glm', {}).icon).toBe('zai')
  })
})
