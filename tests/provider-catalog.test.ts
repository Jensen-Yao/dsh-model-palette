import { describe, expect, it } from 'vitest'
import { providerBrandColor } from '../src/client/ProviderIcon.tsx'
import {
  ALL_TEMPLATES,
  CATALOG_TEMPLATES,
  CUSTOM_TEMPLATES,
  SUBSCRIPTION_TEMPLATES,
  filterTemplates,
  providerMeta,
  providerProtocolLabel,
  providerRouteGroups,
  templatesByCategory,
} from '../src/client/provider-catalog.ts'

describe('provider catalog', () => {
  it('groups every template into exactly one category', () => {
    const grouped = templatesByCategory()
    expect(grouped.custom).toEqual(CUSTOM_TEMPLATES)
    expect(grouped.subscription).toEqual(SUBSCRIPTION_TEMPLATES)
    expect(grouped.catalog).toEqual(CATALOG_TEMPLATES)
    expect(ALL_TEMPLATES).toHaveLength(CUSTOM_TEMPLATES.length + SUBSCRIPTION_TEMPLATES.length + CATALOG_TEMPLATES.length)
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

  it('covers the official DSH built-in catalog with zero-config templates', () => {
    for (const id of ['openai', 'anthropic', 'deepseek', 'openrouter', 'google', 'mistral', 'nvidia', 'together', 'groq', 'zai', 'moonshotai', 'minimax', 'xiaomi', 'xai', 'qwen-token-plan', 'vercel-ai-gateway', 'huggingface']) {
      const template = CATALOG_TEMPLATES.find(entry => entry.id === id)
      expect(template, id).toBeDefined()
      expect(template?.catalog).toBe(true)
    }
    const openrouter = CATALOG_TEMPLATES.find(template => template.id === 'openrouter')
    expect(openrouter?.credentialRef).toBe('OPENROUTER_API_KEY')
  })

  it('prefills the OpenRouter free template with endpoint and sync hint', () => {
    const free = CUSTOM_TEMPLATES.find(template => template.id === 'openrouter-free')
    expect(free).toMatchObject({
      baseURL: 'https://openrouter.ai/api/v1',
      api: 'openai-completions',
      credentialRef: 'OPENROUTER_API_KEY',
    })
  })

  it('filters templates across name, id, hint, and endpoint', () => {
    expect(filterTemplates(CATALOG_TEMPLATES, 'moonshot').map(template => template.id)).toContain('moonshotai')
    expect(filterTemplates(CUSTOM_TEMPLATES, 'openrouter.ai').map(template => template.id)).toContain('openrouter-free')
    expect(filterTemplates(CATALOG_TEMPLATES, 'vercel').map(template => template.id)).toContain('vercel-ai-gateway')
    expect(filterTemplates(CATALOG_TEMPLATES, 'does-not-exist')).toEqual([])
  })

  it('matches configured providers to brand icons by id and baseURL host', () => {
    expect(providerMeta('openrouter', { baseURL: 'https://openrouter.ai/api/v1' }).icon).toBe('openrouter')
    expect(providerMeta('my-deepseek-route', { baseURL: 'https://api.deepseek.com' }).icon).toBe('deepseek')
    expect(providerMeta('gateway', { baseURL: 'https://api.moonshot.cn/v1' }).icon).toBe('moonshot')
    expect(providerMeta('bankofai', { baseURL: 'https://api.bankofai.io/v1' }).icon).toBe('generic')
    expect(providerMeta('something-with-glm', {}).icon).toBe('zai')
  })
})

describe('configured provider route groups', () => {
  it('keeps protocol branches from one endpoint beneath a single heading', () => {
    const groups = providerRouteGroups([
      { id: 'gateway', displayName: 'Gateway Responses', baseURL: 'https://api.example.com/v1', protocol: 'openai-responses', modelCount: 4 },
      { id: 'gateway-chat', displayName: 'Gateway Chat', baseURL: 'https://api.example.com/v1', protocol: 'openai-completions', modelCount: 3 },
      { id: 'other', displayName: 'Other', baseURL: 'https://other.example/v1', protocol: 'openai-completions', modelCount: 2 },
    ])
    expect(groups.map(group => ({ title: group.title, routes: group.routes.length, modelCount: group.modelCount, protocols: group.protocols }))).toEqual([
      { title: 'api.example.com', routes: 2, modelCount: 7, protocols: ['openai-responses', 'openai-completions'] },
      { title: 'other.example', routes: 1, modelCount: 2, protocols: ['openai-completions'] },
    ])
  })

  it('does not collapse routes without a shared endpoint', () => {
    expect(providerRouteGroups([
      { id: 'one', displayName: 'One', protocol: 'openai-responses', modelCount: 1 },
      { id: 'two', displayName: 'Two', protocol: 'openai-completions', modelCount: 2 },
    ]).map(group => group.routes.map(route => route.id))).toEqual([['one'], ['two']])
  })

  it('uses short protocol labels in provider headings', () => {
    expect(providerProtocolLabel('openai-responses')).toBe('Responses')
    expect(providerProtocolLabel('openai-completions')).toBe('Chat')
    expect(providerProtocolLabel('anthropic-messages')).toBe('Messages')
  })
})

describe('provider brand colors', () => {
  it('assigns a brand accent to every major icon and leaves protocol glyphs theme-colored', () => {
    for (const icon of ['openai', 'anthropic', 'deepseek', 'openrouter', 'google', 'nvidia', 'xiaomi', 'zai']) {
      expect(providerBrandColor(icon)).toMatch(/^#[0-9a-f]{6}$/iu)
    }
    expect(providerBrandColor('completions')).toBeUndefined()
    expect(providerBrandColor('unknown-icon')).toBeUndefined()
  })
})
