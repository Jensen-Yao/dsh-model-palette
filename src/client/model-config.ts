import type { DiscoveredModelView } from '@deepseek-ai/dsh-api-remotes/client'
import type { ModelPreset } from './model-presets.ts'
import { applyModelPreset, matchModelPreset } from './model-presets.ts'

export const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
export const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

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

export function stringField(value: Record<string, unknown>, key: string): string {
  return typeof value[key] === 'string' ? value[key] : ''
}

export function modelRecords(profile: Record<string, unknown>): Record<string, unknown>[] {
  if (!Array.isArray(profile.models)) return []
  return profile.models.filter(isRecord).map(model => structuredClone(model))
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
  const next = structuredClone(source)
  const current = Array.isArray(next.input)
    ? next.input.filter((value): value is 'text' | 'image' => value === 'text' || value === 'image')
    : []
  const values = enabled ? [...new Set([...current, modality])] : current.filter(value => value !== modality)
  if (values.length === 0) delete next.input
  else next.input = values
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
  discovered: readonly DiscoveredModelView[],
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
    if (changed) enriched += 1
  }
  return { models: next, added, enriched }
}
