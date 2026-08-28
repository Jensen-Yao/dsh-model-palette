import type { ModelPreset } from './model-presets.ts'
import { applyModelPreset, matchModelPreset } from './model-presets.ts'

export const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
export const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
export const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type ReasoningLevel = typeof REASONING_LEVELS[number]
export type ReasoningEfforts = Partial<Record<ReasoningLevel, string | null>>

export interface ModelCandidate {
  id: string
  name?: string
  contextWindow?: number
  maxTokens?: number
  input?: Array<'text' | 'image'>
}

export const UNIVERSAL_REASONING_EFFORTS: ReasoningEfforts = {
  off: null,
  minimal: 'minimal',
  low: 'low',
  medium: 'medium',
  high: 'high',
  xhigh: 'xhigh',
  max: 'max',
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function recordAt(value: unknown, path: readonly string[]): Record<string, unknown> | undefined {
  let current = value
  for (const part of path) {
    if (!isRecord(current)) return undefined
    current = current[part]
  }
  return isRecord(current) ? current : undefined
}

export function providerProfiles(value: unknown): Record<string, Record<string, unknown>> {
  const providers = recordAt(value, ['providers'])
  if (providers === undefined) return {}
  return Object.fromEntries(Object.entries(providers).filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1])))
}

export function deriveCredentialRef(provider: string): string {
  return `${provider.toUpperCase().replace(/[^A-Z0-9]+/gu, '_')}_API_KEY`
}

export function nextProviderCopyId(sourceId: string, existingIds: readonly string[]): string {
  const base = `${sourceId || 'provider'}-copy`
  const existing = new Set(existingIds)
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function stringField(value: Record<string, unknown>, key: string): string {
  return typeof value[key] === 'string' ? value[key] : ''
}

export function modelRecords(profile: Record<string, unknown>): Record<string, unknown>[] {
  if (!Array.isArray(profile.models)) return []
  return profile.models.filter(isRecord).map(model => structuredClone(model))
}

export function duplicateModelTemplate(model: Record<string, unknown>): Record<string, unknown> {
  const next = structuredClone(model)
  delete next.id
  delete next.name
  return next
}

export function duplicateModelIds(models: readonly Record<string, unknown>[]): string[] {
  const counts = new Map<string, number>()
  for (const model of models) {
    const id = typeof model.id === 'string' ? model.id.trim() : ''
    if (id !== '') counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
}

export function setOptionalString(source: Record<string, unknown>, key: string, value: string): Record<string, unknown> {
  const next = structuredClone(source)
  const normalized = value.trim()
  if (normalized === '') delete next[key]
  else next[key] = normalized
  return next
}

export function setOptionalPositiveInteger(source: Record<string, unknown>, key: string, value: string): Record<string, unknown> {
  const next = structuredClone(source)
  if (value.trim() === '') {
    delete next[key]
    return next
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${key} must be a positive integer`)
  next[key] = parsed
  return next
}

export function setInputModality(source: Record<string, unknown>, modality: 'text' | 'image', enabled: boolean): Record<string, unknown> {
  return setNamedInputModality(source, 'input', modality, enabled)
}

export type InputMode = 'inherit' | 'text' | 'text-image' | 'image'

export function inputMode(source: Record<string, unknown>, key = 'input'): InputMode {
  const input = Array.isArray(source[key]) ? source[key] : []
  const text = input.includes('text')
  const image = input.includes('image')
  if (text && image) return 'text-image'
  if (text) return 'text'
  if (image) return 'image'
  return 'inherit'
}

export function setInputMode(source: Record<string, unknown>, mode: InputMode, key = 'input'): Record<string, unknown> {
  const next = structuredClone(source)
  if (mode === 'inherit') delete next[key]
  else if (mode === 'text') next[key] = ['text']
  else if (mode === 'image') next[key] = ['image']
  else next[key] = ['text', 'image']
  return next
}

function setNamedInputModality(source: Record<string, unknown>, key: string, modality: 'text' | 'image', enabled: boolean): Record<string, unknown> {
  const next = structuredClone(source)
  const current = Array.isArray(next[key])
    ? next[key].filter((value): value is 'text' | 'image' => value === 'text' || value === 'image')
    : []
  const values = enabled ? [...new Set([...current, modality])] : current.filter(value => value !== modality)
  if (values.length === 0) delete next[key]
  else next[key] = values
  return next
}

export function setCompatField(source: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const next = structuredClone(source)
  const compat = isRecord(next.compat) ? structuredClone(next.compat) : {}
  if (value === undefined || value === '') delete compat[key]
  else compat[key] = value
  if (Object.keys(compat).length === 0) delete next.compat
  else next.compat = compat
  return next
}

export function compatValue(source: Record<string, unknown>, key: string): unknown {
  return isRecord(source.compat) ? source.compat[key] : undefined
}

export function reasoningEffortsValue(source: Record<string, unknown>): false | ReasoningEfforts | undefined {
  if (source.reasoningEfforts === false) return false
  if (!isRecord(source.reasoningEfforts)) return undefined
  const efforts: ReasoningEfforts = {}
  for (const level of REASONING_LEVELS) {
    const value = source.reasoningEfforts[level]
    if (value === null || typeof value === 'string') efforts[level] = value
  }
  return efforts
}

export function hasUniversalReasoningEfforts(source: Record<string, unknown>): boolean {
  const efforts = reasoningEffortsValue(source)
  return efforts !== undefined && efforts !== false && REASONING_LEVELS.every(level => Object.hasOwn(efforts, level))
}

export function setReasoningMode(
  source: Record<string, unknown>,
  mode: 'inherit' | 'disabled' | 'all',
): Record<string, unknown> {
  const next = structuredClone(source)
  if (mode === 'inherit') delete next.reasoningEfforts
  else if (mode === 'disabled') next.reasoningEfforts = false
  else next.reasoningEfforts = structuredClone(UNIVERSAL_REASONING_EFFORTS)
  return next
}

export function setReasoningEffort(
  source: Record<string, unknown>,
  level: ReasoningLevel,
  enabled: boolean,
  wireValue?: string,
): Record<string, unknown> {
  const next = structuredClone(source)
  const current = reasoningEffortsValue(next)
  const efforts: ReasoningEfforts = current === undefined || current === false ? {} : structuredClone(current)
  if (!enabled) delete efforts[level]
  else if (level === 'off') efforts.off = wireValue?.trim() || null
  else efforts[level] = wireValue?.trim() || level
  if (!REASONING_LEVELS.some(candidate => candidate !== 'off' && Object.hasOwn(efforts, candidate))) delete next.reasoningEfforts
  else next.reasoningEfforts = efforts
  return next
}

/** Add selectable reasoning levels and provider-aware dispatch defaults without replacing manual compatibility values. */
export function applyUniversalReasoningDefaults(
  providerId: string,
  profile: Record<string, unknown>,
  model: Record<string, unknown>,
): Record<string, unknown> {
  return applyReasoningDispatchDefaults(providerId, profile, setReasoningMode(model, 'all'))
}

/** Add provider-aware reasoning dispatch compatibility without changing the model's offered levels. */
export function applyReasoningDispatchDefaults(
  providerId: string,
  profile: Record<string, unknown>,
  model: Record<string, unknown>,
): Record<string, unknown> {
  let next = structuredClone(model)
  const protocol = stringField(profile, 'api')
  if (protocol !== 'openai-completions') return next
  const explicitFormat = compatValue(next, 'thinkingFormat')
  const format = typeof explicitFormat === 'string' ? explicitFormat : inferThinkingFormat(providerId, profile, next)
  if (format !== undefined) next = setCompatDefault(next, 'thinkingFormat', format)
  if (format === 'qwen' || format === 'qwen-chat-template' || format === 'chat-template') {
    next = setCompatDefault(next, 'supportsReasoningEffort', false)
  } else if (format !== 'openrouter' && format !== 'ant-ling' && format !== 'string-thinking') {
    next = setCompatDefault(next, 'supportsReasoningEffort', true)
  }
  return applyReasoningCompatibilityDefaults(protocol, next).model
}

/** Add universal reasoning controls to every explicitly declared model or override on one route. */
export function applyUniversalReasoningToProvider(
  providerId: string,
  profile: Record<string, unknown>,
): { profile: Record<string, unknown>; changed: number } {
  const next = structuredClone(profile)
  let changed = 0
  const models = modelRecords(next).map((model) => {
    const updated = applyUniversalReasoningDefaults(providerId, next, model)
    if (JSON.stringify(updated) !== JSON.stringify(model)) changed += 1
    return updated
  })
  if (models.length > 0) next.models = models
  if (isRecord(next.modelOverrides)) {
    const overrides = Object.fromEntries(Object.entries(next.modelOverrides).map(([modelId, value]) => {
      if (!isRecord(value)) return [modelId, value]
      const updated = applyUniversalReasoningDefaults(providerId, next, { id: modelId, ...value })
      delete updated.id
      if (JSON.stringify(updated) !== JSON.stringify(value)) changed += 1
      return [modelId, updated]
    }))
    next.modelOverrides = overrides
  }
  return { profile: next, changed }
}

/** Ensure one selectable model has all reasoning levels, using modelOverrides for inherited catalogs. */
export function ensureModelReasoning(
  providerId: string,
  profile: Record<string, unknown>,
  modelId: string,
): { profile: Record<string, unknown>; changed: boolean } {
  const next = structuredClone(profile)
  const models = modelRecords(next)
  const position = models.findIndex(model => model.id === modelId)
  if (position >= 0) {
    const current = models[position] ?? {}
    const updated = applyUniversalReasoningDefaults(providerId, next, current)
    if (JSON.stringify(updated) === JSON.stringify(current)) return { profile: next, changed: false }
    models[position] = updated
    next.models = models
    return { profile: next, changed: true }
  }
  const overrides = isRecord(next.modelOverrides) ? structuredClone(next.modelOverrides) : {}
  const current = isRecord(overrides[modelId]) ? structuredClone(overrides[modelId]) : {}
  const updated = applyUniversalReasoningDefaults(providerId, next, { id: modelId, ...current })
  delete updated.id
  if (JSON.stringify(updated) === JSON.stringify(current)) return { profile: next, changed: false }
  overrides[modelId] = updated
  next.modelOverrides = overrides
  return { profile: next, changed: true }
}

function inferThinkingFormat(
  providerId: string,
  profile: Record<string, unknown>,
  model: Record<string, unknown>,
): string | undefined {
  const identity = `${providerId} ${stringField(profile, 'baseURL')} ${stringField(model, 'id')} ${stringField(model, 'name')}`.toLocaleLowerCase()
  if (identity.includes('openrouter')) return 'openrouter'
  if (identity.includes('deepseek')) return 'deepseek'
  if (identity.includes('qwen')) return 'qwen'
  if (identity.includes('zhipu') || identity.includes('bigmodel') || /\bglm[-_\s]/u.test(identity)) return 'zai'
  if (identity.includes('together')) return 'together'
  return undefined
}

function setCompatDefault(source: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  return compatValue(source, key) === undefined ? setCompatField(source, key, value) : structuredClone(source)
}

export interface CompatibilityRepairResult {
  profile: Record<string, unknown>
  changed: boolean
  repairedModels: string[]
}

/**
 * Add the replay fields required by DeepSeek reasoning models behind custom
 * OpenAI-compatible gateways. Explicit compatibility values always win.
 */
export function applyReasoningCompatibilityDefaults(
  protocol: string,
  model: Record<string, unknown>,
): { model: Record<string, unknown>; changed: boolean } {
  const next = structuredClone(model)
  if (protocol !== 'openai-completions') return { model: next, changed: false }
  const compat = isRecord(next.compat) ? structuredClone(next.compat) : {}
  const explicitThinkingFormat = typeof compat.thinkingFormat === 'string' ? compat.thinkingFormat : undefined
  if (explicitThinkingFormat !== undefined && explicitThinkingFormat !== 'deepseek') {
    return { model: next, changed: false }
  }
  const identity = [next.id, next.name]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase()
  const isDeepSeekDialect = explicitThinkingFormat === 'deepseek'
    || compat.requiresReasoningContentOnAssistantMessages === true
    || identity.includes('deepseek')
  if (!isDeepSeekDialect) return { model: next, changed: false }
  let changed = false
  if (isDeepSeekDialect && compat.thinkingFormat === undefined) {
    compat.thinkingFormat = 'deepseek'
    changed = true
  }
  if (compat.requiresReasoningContentOnAssistantMessages === undefined) {
    compat.requiresReasoningContentOnAssistantMessages = true
    changed = true
  }
  if (compat.supportsDeveloperRole === undefined) {
    compat.supportsDeveloperRole = false
    changed = true
  }
  if (changed) next.compat = compat
  return { model: next, changed }
}

/** Repair all eligible models in a provider profile without changing manual values. */
export function repairProviderCompatibility(
  profile: Record<string, unknown>,
  modelId?: string,
): CompatibilityRepairResult {
  const next = structuredClone(profile)
  const protocol = stringField(next, 'api')
  const sourceModels = modelRecords(next)
  const repairedModels: string[] = []
  const models = sourceModels.map((model) => {
    if (modelId !== undefined && model.id !== modelId) return structuredClone(model)
    const result = applyReasoningCompatibilityDefaults(protocol, model)
    if (result.changed) {
      repairedModels.push(typeof model.id === 'string' && model.id.trim() !== '' ? model.id.trim() : 'unknown model')
    }
    return result.model
  })
  if (repairedModels.length > 0) next.models = models
  return { profile: next, changed: repairedModels.length > 0, repairedModels }
}

export function applyMissingPresets(
  models: readonly Record<string, unknown>[],
  presets: readonly ModelPreset[],
): { models: Record<string, unknown>[]; applied: number } {
  let applied = 0
  const next = models.map((model) => {
    const id = typeof model.id === 'string' ? model.id : ''
    const preset = matchModelPreset(id, presets)
    if (preset === undefined) return structuredClone(model)
    const updated = applyModelPreset(model, preset, false)
    if (JSON.stringify(updated) !== JSON.stringify(model)) applied += 1
    return updated
  })
  return { models: next, applied }
}

export function mergeDiscoveredModels(
  models: readonly Record<string, unknown>[],
  discovered: readonly ModelCandidate[],
): { models: Record<string, unknown>[]; added: number; enriched: number } {
  const next = models.map(model => structuredClone(model))
  const index = new Map(next.map((model, position) => [typeof model.id === 'string' ? model.id : '', position]))
  let added = 0
  let enriched = 0
  for (const candidate of discovered) {
    const position = index.get(candidate.id)
    if (position === undefined) {
      next.push({
        id: candidate.id,
        ...(candidate.name === undefined ? {} : { name: candidate.name }),
        ...(candidate.contextWindow === undefined ? {} : { contextWindow: candidate.contextWindow }),
        ...(candidate.maxTokens === undefined ? {} : { maxTokens: candidate.maxTokens }),
        ...(candidate.input === undefined ? {} : { input: [...candidate.input] }),
      })
      index.set(candidate.id, next.length - 1)
      added += 1
      continue
    }
    const current = next[position] as Record<string, unknown>
    let changed = false
    if (candidate.name !== undefined && typeof current.name !== 'string') { current.name = candidate.name; changed = true }
    if (candidate.contextWindow !== undefined && typeof current.contextWindow !== 'number') { current.contextWindow = candidate.contextWindow; changed = true }
    if (candidate.maxTokens !== undefined && typeof current.maxTokens !== 'number') { current.maxTokens = candidate.maxTokens; changed = true }
    if (candidate.input !== undefined && (!Array.isArray(current.input) || current.input.length === 0)) { current.input = [...candidate.input]; changed = true }
    if (changed) enriched += 1
  }
  return { models: next, added, enriched }
}

/** Merge discovered endpoint metadata and immediately fill remaining known capabilities from presets. */
export function mergeDiscoveredModelsWithPresets(
  models: readonly Record<string, unknown>[],
  discovered: readonly ModelCandidate[],
  presets: readonly ModelPreset[],
): { models: Record<string, unknown>[]; added: number; enriched: number; presetsApplied: number } {
  const merged = mergeDiscoveredModels(models, discovered)
  const presetResult = applyMissingPresets(merged.models, presets)
  return { ...merged, models: presetResult.models, presetsApplied: presetResult.applied }
}

/** Synchronize live OpenRouter :free variants while preserving every non-free and manually configured field. */
export function synchronizeOpenRouterFreeModels(
  models: readonly Record<string, unknown>[],
  liveModels: readonly ModelCandidate[],
): { models: Record<string, unknown>[]; added: number; enriched: number; removed: number } {
  const liveIds = new Set(liveModels.map(model => model.id))
  let removed = 0
  const retained = models.filter((model) => {
    const id = typeof model.id === 'string' ? model.id : ''
    const keep = !id.toLocaleLowerCase().endsWith(':free') || liveIds.has(id)
    if (!keep) removed += 1
    return keep
  })
  return { ...mergeDiscoveredModels(retained, liveModels), removed }
}
