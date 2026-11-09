import { describe, expect, it } from 'vitest'
import { BACKUP_FILE_LIMIT, createConfigBackup, parseConfigBackup, planConfigImport } from '../src/client/config-transfer.ts'

const saved = {
  providers: {
    custom: { api: 'openai-responses', baseURL: 'https://api.example.com/v1', apiKeyEnv: 'CUSTOM_API_KEY',
      apiKey: 'sk-secret', headers: { Authorization: 'Bearer secret' },
      models: [{ id: 'model', contextWindow: 8192, maxTokens: 2048, reasoningEfforts: { high: 'high' }, headers: { 'x-api-key': 'nested-secret' } }] },
    catalog: {},
  },
}
const plugin = {
  requestRetries: { providers: { custom: { enabled: true, maxRetries: 3, models: { model: 1 } } } },
  freeSync: { providers: { custom: { enabled: false, intervalHours: 0 } }, state: { custom: { error: 'private diagnostic' } } },
}

describe('configuration backups', () => {
  it('round-trips selected routes, model parameters and rules without secrets or sync diagnostics', () => {
    const result = createConfigBackup(saved, plugin, ['custom'])
    const text = JSON.stringify(result.backup)
    expect(text).not.toMatch(/sk-secret|Bearer secret|nested-secret|private diagnostic/u)
    expect(result.removed).toEqual(['custom.apiKey', 'custom.headers', 'custom.models[0].headers'])
    expect(result.backup.providers.custom?.apiKeyEnv).toBe('CUSTOM_API_KEY')
    expect(result.backup.requestRetries.custom).toEqual(plugin.requestRetries.providers.custom)
    expect(parseConfigBackup(text).backup).toEqual(result.backup)
    expect(Object.keys(result.backup.providers)).toEqual(['custom'])
    expect(saved.providers.custom.apiKey).toBe('sk-secret')
  })

  it('strips credential-bearing URLs and imported secret fields', () => {
    const result = createConfigBackup({ providers: { custom: { ...saved.providers.custom, baseURL: 'https://user:secret@example.com/v1?api_key=secret' } } }, {}, ['custom'])
    expect(result.backup.providers.custom).not.toHaveProperty('baseURL')
    expect(result.removed).toContain('custom.baseURL')
    const imported = parseConfigBackup(JSON.stringify({ ...result.backup, providers: { custom: { models: [{ id: 'a', token: 'secret' }], apiKey: 'secret' } } }))
    expect(JSON.stringify(imported.backup)).not.toContain('secret')
    expect(imported.removed).toContain('custom.models[0].token')
  })

  it('rejects invalid files, versions, rules, model ids, capacities and prototype keys before planning writes', () => {
    const backup = createConfigBackup(saved, plugin, ['custom']).backup
    for (const value of [null, [], { ...backup, version: 2 }, { ...backup, providers: {} },
      { ...backup, providers: { custom: { models: [{ id: 'a' }, { id: ' a ' }] } } },
      { ...backup, providers: { custom: { defaultContextWindow: -1 } } },
      { ...backup, providers: { custom: { modelOverrides: { model: { maxTokens: 0 } } } } },
      { ...backup, requestRetries: { other: { enabled: true, maxRetries: 1, models: {} } } },
      { ...backup, requestRetries: { custom: { enabled: true, maxRetries: 1001, models: {} } } },
      { ...backup, freeSync: { custom: { enabled: true, intervalHours: -1 } } },
    ]) expect(() => parseConfigBackup(JSON.stringify(value))).toThrow()
    expect(() => parseConfigBackup('{')).toThrow()
    expect(() => parseConfigBackup(' '.repeat(BACKUP_FILE_LIMIT + 1))).toThrow('2 MiB')
    expect(() => parseConfigBackup(JSON.stringify(backup).replace('"models":[', '"__proto__":{},"models":['))).toThrow('not allowed')
  })

  it('defaults conflicts to skipping and allocates copies without replacing any existing or incoming ids', () => {
    const backup = createConfigBackup(saved, plugin, ['custom', 'catalog']).backup
    const skip = planConfigImport(backup, saved.providers, ['custom'], 'skip')
    expect(skip.rows).toEqual([{ source: 'custom', target: 'custom', action: 'skip' }])
    expect(skip.providerOps).toEqual([])
    expect(skip.pluginOps).toEqual([])
    const copy = planConfigImport(backup, { ...saved.providers, 'custom-copy': {} }, ['custom'], 'copy')
    expect(copy.rows).toEqual([{ source: 'custom', target: 'custom-copy-2', action: 'add' }])
    expect(copy.pluginOps.map(op => op.path)).toEqual([
      ['requestRetries', 'providers', 'custom-copy-2'], ['freeSync', 'providers', 'custom-copy-2'],
    ])
    expect(copy.providerOps.every(op => op.path[1] === 'custom-copy-2')).toBe(true)
  })

  it('merges only incoming top-level fields and creates empty catalog-backed profiles', () => {
    const backup = createConfigBackup(saved, plugin, ['custom', 'catalog']).backup
    const plan = planConfigImport(backup, saved.providers, ['custom'], 'merge')
    expect(plan.rows[0]?.action).toBe('merge')
    expect(plan.providerOps.every(op => op.path.length === 3 && op.path[2] !== 'headers')).toBe(true)
    expect(planConfigImport(backup, {}, ['catalog'], 'skip').providerOps).toEqual([{ op: 'set', path: ['providers', 'catalog'], value: {} }])
    expect(() => planConfigImport(backup, {}, ['missing'], 'skip')).toThrow('Unknown backup provider')
  })
})
