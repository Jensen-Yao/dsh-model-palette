/** Versioned provider backups and path-addressed batch import plans. */
import { CREDENTIAL_REF_PATTERN, PROVIDER_ID_PATTERN, duplicateModelIds, isRecord, nextProviderCopyId, providerProfiles } from './model-config.ts'

export const BACKUP_FILE_LIMIT = 2 * 1024 * 1024
const PROFILE_FIELDS = new Set([
  'displayName', 'api', 'baseURL', 'apiKeyEnv', 'models', 'modelOverrides', 'compat',
  'defaultContextWindow', 'defaultMaxTokens', 'defaultInput', 'reasoning', 'thinkingBudgets',
  'cacheRetention', 'transport', 'timeoutMs', 'websocketConnectTimeoutMs', 'streamIdleTimeoutMs',
  'maxRequestImageBytes', 'requestImagePixelBudget', 'requestImageMaxBytes', 'retryPolicy',
])
const SECRET_FIELDS = /^(?:headers|api[-_]?key|access[-_]?token|refresh[-_]?token|token|password|secret|authorization|credentials?)$/iu
const UNSAFE_FIELDS = new Set(['__proto__', 'constructor', 'prototype'])

function capacities(value: Record<string, unknown>, fields: readonly string[], location: string): void {
  for (const field of fields) {
    const amount = value[field]
    if (amount !== undefined && (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0)) {
      throw new Error(`${location}.${field} must be a positive integer`)
    }
  }
}

/** Backup data excludes credentials, request headers and transient sync results. */
export interface ConfigBackup {
  format: 'dsh-model-palette'
  version: 1
  providers: Record<string, Record<string, unknown>>
  requestRetries: Record<string, Record<string, unknown>>
  freeSync: Record<string, Record<string, unknown>>
}

export type ImportStrategy = 'skip' | 'merge' | 'copy'
export type ImportOp = { op: 'set'; path: string[]; value: unknown }

/** One preview row records the actual destination before any writes. */
export interface ImportRow {
  source: string
  target: string
  action: 'add' | 'merge' | 'skip'
}

function cleanValue(value: unknown, location: string, removed: string[]): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map((item, index) => cleanValue(item, `${location}[${index}]`, removed))
  if (!isRecord(value)) throw new Error(`${location} must contain JSON values`)
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    if (UNSAFE_FIELDS.has(key)) throw new Error(`${location}.${key} is not allowed`)
    if (SECRET_FIELDS.test(key)) {
      removed.push(`${location}.${key}`)
      return []
    }
    if (item === undefined) return []
    return [[key, cleanValue(item, `${location}.${key}`, removed)]]
  }))
}

function cleanProfile(value: unknown, id: string, removed: string[]): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Provider ${id} must be an object`)
  const fields = Object.fromEntries(Object.entries(value).filter(([key]) => {
    if (UNSAFE_FIELDS.has(key)) throw new Error(`Provider ${id}.${key} is not allowed`)
    if (PROFILE_FIELDS.has(key)) return true
    removed.push(`${id}.${key}`)
    return false
  }))
  const profile = cleanValue(fields, id, removed) as Record<string, unknown>
  capacities(profile, ['defaultContextWindow', 'defaultMaxTokens'], id)
  if (profile.apiKeyEnv !== undefined && (typeof profile.apiKeyEnv !== 'string' || !CREDENTIAL_REF_PATTERN.test(profile.apiKeyEnv))) {
    throw new Error(`Provider ${id} has an invalid credential reference`)
  }
  if (profile.baseURL !== undefined) {
    if (typeof profile.baseURL !== 'string') throw new Error(`Provider ${id} baseURL must be a URL`)
    const url = new URL(profile.baseURL)
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`Provider ${id} requires an HTTP(S) URL`)
    if (url.username || url.password || url.search || url.hash) {
      delete profile.baseURL
      removed.push(`${id}.baseURL`)
    }
  }
  if (profile.models !== undefined) {
    if (!Array.isArray(profile.models) || profile.models.some(model => !isRecord(model) || typeof model.id !== 'string' || model.id.trim() === '')) {
      throw new Error(`Provider ${id} models require nonempty ids`)
    }
    const models = (profile.models as Record<string, unknown>[]).map(model => ({ ...model, id: String(model.id).trim() }))
    for (const model of models) capacities(model, ['contextWindow', 'maxTokens'], `${id}.${model.id}`)
    if (duplicateModelIds(models).length > 0) throw new Error(`Provider ${id} has duplicate model ids`)
    profile.models = models
  }
  if (profile.modelOverrides !== undefined) {
    if (!isRecord(profile.modelOverrides)) throw new Error(`Provider ${id} modelOverrides must be an object`)
    for (const [modelId, model] of Object.entries(profile.modelOverrides)) {
      if (modelId.trim() === '' || !isRecord(model)) throw new Error(`Provider ${id} has an invalid model override`)
      capacities(model, ['contextWindow', 'maxTokens'], `${id}.${modelId}`)
    }
  }
  return profile
}

function retryRule(value: unknown, id: string): Record<string, unknown> {
  if (!isRecord(value) || typeof value.enabled !== 'boolean' || !validRetries(value.maxRetries)
    || !isRecord(value.models) || Object.values(value.models).some(count => !validRetries(count))) {
    throw new Error(`Provider ${id} has an invalid retry rule`)
  }
  return { enabled: value.enabled, maxRetries: value.maxRetries, models: { ...value.models } }
}

function validRetries(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000
}

function syncRule(value: unknown, id: string): Record<string, unknown> {
  if (!isRecord(value) || typeof value.enabled !== 'boolean' || typeof value.intervalHours !== 'number'
    || !Number.isInteger(value.intervalHours) || value.intervalHours < 0 || value.intervalHours > 168) {
    throw new Error(`Provider ${id} has an invalid free-sync rule`)
  }
  return { enabled: value.enabled, intervalHours: value.intervalHours }
}

/**
 * Select saved provider overrides and their schedules for a portable JSON backup.
 * @param value Saved provider settings, rather than an unsaved editor draft.
 * @param pluginValue Saved palette retry and free-sync settings.
 * @param selected Provider ids chosen for export.
 * @returns Sanitized backup and the removed field paths for review.
 */
export function createConfigBackup(value: unknown, pluginValue: unknown, selected: readonly string[]): { backup: ConfigBackup; removed: string[] } {
  const profiles = providerProfiles(value)
  const retries = isRecord(pluginValue) && isRecord(pluginValue.requestRetries) ? pluginValue.requestRetries.providers : undefined
  const sync = isRecord(pluginValue) && isRecord(pluginValue.freeSync) ? pluginValue.freeSync.providers : undefined
  const removed: string[] = []
  const backup: ConfigBackup = { format: 'dsh-model-palette', version: 1, providers: {}, requestRetries: {}, freeSync: {} }
  for (const id of new Set(selected)) {
    if (!PROVIDER_ID_PATTERN.test(id) || UNSAFE_FIELDS.has(id) || !Object.hasOwn(profiles, id)) throw new Error(`Unknown provider ${id}`)
    backup.providers[id] = cleanProfile(profiles[id], id, removed)
    if (isRecord(retries) && Object.hasOwn(retries, id)) backup.requestRetries[id] = retryRule(retries[id], id)
    if (isRecord(sync) && Object.hasOwn(sync, id)) backup.freeSync[id] = syncRule(sync[id], id)
  }
  if (Object.keys(backup.providers).length === 0) throw new Error('Select at least one provider')
  return { backup, removed }
}

/**
 * Validate an imported file before planning any settings writes.
 * @param text UTF-8 JSON file contents, limited to 2 MiB.
 * @returns Sanitized version-one backup and removed field paths.
 */
export function parseConfigBackup(text: string): { backup: ConfigBackup; removed: string[] } {
  if (new TextEncoder().encode(text).byteLength > BACKUP_FILE_LIMIT) throw new Error('Backup exceeds 2 MiB')
  const value: unknown = JSON.parse(text)
  if (!isRecord(value) || value.format !== 'dsh-model-palette' || value.version !== 1 || !isRecord(value.providers)
    || !isRecord(value.requestRetries) || !isRecord(value.freeSync)) throw new Error('Unsupported model palette backup format or version')
  cleanValue(value, 'backup', [])
  const ids = Object.keys(value.providers)
  for (const id of [...Object.keys(value.requestRetries), ...Object.keys(value.freeSync)]) {
    if (!Object.hasOwn(value.providers, id)) throw new Error(`Rule references missing provider ${id}`)
  }
  return createConfigBackup({ providers: value.providers }, {
    requestRetries: { providers: value.requestRetries }, freeSync: { providers: value.freeSync },
  }, ids)
}

/**
 * Preview import destinations and produce edits only for selected incoming fields.
 * Existing credential/header fields and unrelated providers are preserved.
 * @param backup Validated backup.
 * @param existing Current saved provider profiles.
 * @param selected Incoming provider ids to import.
 * @param strategy Existing-id handling: skip, merge fields, or allocate a copy id.
 * @returns Preview rows and one batch for each settings namespace.
 */
export function planConfigImport(backup: ConfigBackup, existing: Record<string, Record<string, unknown>>, selected: readonly string[], strategy: ImportStrategy): { rows: ImportRow[]; providerOps: ImportOp[]; pluginOps: ImportOp[] } {
  const rows: ImportRow[] = []
  const providerOps: ImportOp[] = []
  const pluginOps: ImportOp[] = []
  const occupied = new Set([...Object.keys(existing), ...Object.keys(backup.providers)])
  for (const source of new Set(selected)) {
    if (!Object.hasOwn(backup.providers, source)) throw new Error(`Unknown backup provider ${source}`)
    const exists = Object.hasOwn(existing, source)
    const target = exists && strategy === 'copy' ? nextProviderCopyId(source, [...occupied]) : source
    occupied.add(target)
    const action = exists && strategy === 'skip' ? 'skip' : exists && strategy === 'merge' ? 'merge' : 'add'
    rows.push({ source, target, action })
    if (action === 'skip') continue
    if (action === 'add' && Object.keys(backup.providers[source]!).length === 0) {
      providerOps.push({ op: 'set', path: ['providers', target], value: {} })
    }
    for (const [field, value] of Object.entries(backup.providers[source]!)) {
      providerOps.push({ op: 'set', path: ['providers', target, field], value: structuredClone(value) })
    }
    for (const [section, rules] of [['requestRetries', backup.requestRetries], ['freeSync', backup.freeSync]] as const) {
      if (Object.hasOwn(rules, source)) pluginOps.push({ op: 'set', path: [section, 'providers', target], value: structuredClone(rules[source]) })
    }
  }
  return { rows, providerOps, pluginOps }
}
