import bundledRegistry from '../../assets/model-presets.json' with { type: 'json' }

export interface ModelPreset {
  id: string
  name: string
  aliases: string[]
  contextWindow?: number
  maxTokens?: number
  input?: Array<'text' | 'image'>
  reasoningEfforts?: Partial<Record<'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max', string | null>>
  sourceLabel: string
  sourceUrl: string
}

export interface ModelPresetRegistry {
  version: number
  updatedAt: string
  presets: ModelPreset[]
}

export const ONLINE_PRESET_URL = 'https://raw.githubusercontent.com/Jensen-Yao/dsh-model-palette/main/assets/model-presets.json'
export const BUNDLED_PRESET_REGISTRY = validateRegistry(bundledRegistry)

/** Normalize model aliases without guessing across different model families. */
export function normalizeModelAlias(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/:free$/u, '').replace(/[._\s]+/gu, '-').replace(/-+/gu, '-')
}

/** Find a trustworthy exact alias match, including the final segment of provider/model ids. */
export function matchModelPreset(modelId: string, presets: readonly ModelPreset[]): ModelPreset | undefined {
  const normalized = normalizeModelAlias(modelId)
  const tail = normalizeModelAlias(modelId.split('/').at(-1) ?? modelId)
  return presets.find(preset => preset.aliases.some((alias) => {
    const candidate = normalizeModelAlias(alias)
    return candidate === normalized || candidate === tail
  }))
}

/** Apply a preset to one model while retaining every unrelated compatibility field. */
export function applyModelPreset(
  model: Record<string, unknown>,
  preset: ModelPreset,
  overwrite: boolean,
): Record<string, unknown> {
  const next = structuredClone(model)
  if (preset.contextWindow !== undefined && (overwrite || positiveInteger(next.contextWindow) === undefined)) {
    next.contextWindow = preset.contextWindow
  }
  if (preset.maxTokens !== undefined && (overwrite || positiveInteger(next.maxTokens) === undefined)) {
    next.maxTokens = preset.maxTokens
  }
  if (preset.input !== undefined && (overwrite || !Array.isArray(next.input) || next.input.length === 0)) {
    next.input = [...preset.input]
  }
  if (preset.reasoningEfforts !== undefined && (overwrite || next.reasoningEfforts === undefined)) {
    next.reasoningEfforts = structuredClone(preset.reasoningEfforts)
  }
  return next
}

/** Load the current GitHub registry, retaining the bundled registry as an offline fallback. */
export async function loadOnlinePresetRegistry(fetcher: typeof fetch = fetch): Promise<ModelPresetRegistry> {
  const response = await fetcher(ONLINE_PRESET_URL, { cache: 'no-store', signal: AbortSignal.timeout(8_000) })
  if (!response.ok) throw new Error(`preset registry returned HTTP ${response.status}`)
  return validateRegistry(await response.json())
}

export function validateRegistry(value: unknown): ModelPresetRegistry {
  if (!isRecord(value) || typeof value.version !== 'number' || !Number.isInteger(value.version) || typeof value.updatedAt !== 'string' || !Array.isArray(value.presets)) {
    throw new TypeError('invalid model preset registry')
  }
  const presets = value.presets.map((entry) => {
    if (!isRecord(entry)
      || typeof entry.id !== 'string'
      || typeof entry.name !== 'string'
      || !Array.isArray(entry.aliases)
      || entry.aliases.some(alias => typeof alias !== 'string')
      || typeof entry.sourceLabel !== 'string'
      || typeof entry.sourceUrl !== 'string') {
      throw new TypeError('invalid model preset entry')
    }
    const contextWindow = optionalPositiveInteger(entry.contextWindow, 'contextWindow')
    const maxTokens = optionalPositiveInteger(entry.maxTokens, 'maxTokens')
    const input = entry.input === undefined ? undefined : validateInput(entry.input)
    const reasoningEfforts = entry.reasoningEfforts === undefined ? undefined : validateReasoningEfforts(entry.reasoningEfforts)
    return {
      id: entry.id,
      name: entry.name,
      aliases: [...entry.aliases] as string[],
      ...(contextWindow === undefined ? {} : { contextWindow }),
      ...(maxTokens === undefined ? {} : { maxTokens }),
      ...(input === undefined ? {} : { input }),
      ...(reasoningEfforts === undefined ? {} : { reasoningEfforts }),
      sourceLabel: entry.sourceLabel,
      sourceUrl: entry.sourceUrl,
    }
  })
  return { version: value.version, updatedAt: value.updatedAt, presets }
}

function optionalPositiveInteger(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined
  const parsed = positiveInteger(value)
  if (parsed === undefined) throw new TypeError(`${label} must be a positive integer`)
  return parsed
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

function validateInput(value: unknown): Array<'text' | 'image'> {
  if (!Array.isArray(value) || value.some(item => item !== 'text' && item !== 'image')) {
    throw new TypeError('input must contain only text or image')
  }
  return [...new Set(value)] as Array<'text' | 'image'>
}

function validateReasoningEfforts(value: unknown): ModelPreset['reasoningEfforts'] {
  if (!isRecord(value)) throw new TypeError('reasoningEfforts must be an object')
  const levels = new Set(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  const result: NonNullable<ModelPreset['reasoningEfforts']> = {}
  for (const [level, wire] of Object.entries(value)) {
    if (!levels.has(level) || wire !== null && (typeof wire !== 'string' || wire === '')) {
      throw new TypeError('reasoningEfforts contains an invalid level or wire value')
    }
    if (wire === null && level !== 'off') throw new TypeError('only reasoningEfforts.off may be null')
    result[level as keyof typeof result] = wire
  }
  if (Object.keys(result).length === 0 || !Object.keys(result).some(level => level !== 'off')) {
    throw new TypeError('reasoningEfforts must offer at least one enabled level')
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
