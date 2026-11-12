import type { CatalogGroup, CurrentSelection, ModelChoice, Selection } from './types.ts'

/** Provider id of the keyless Kilo/OpenCode free lane registered by the plugin's host side. */
export const FREE_LANE_PROVIDER_ID = 'dsh-free-models'

/** Whether a choice is free of charge: the keyless lane, or an OpenRouter-style `:free` route. */
export function isFreeChoice(providerId: string, modelId: string): boolean {
  return providerId === FREE_LANE_PROVIDER_ID || modelId.toLocaleLowerCase().endsWith(':free')
}

export function choiceKey(providerId: string, modelId: string): string {
  return `${providerId}\u0000${modelId}`
}

export function selectionFor(provider: CatalogGroup, model: CatalogGroup['models'][number]): Selection {
  return {
    provider: provider.id,
    model: model.id,
    ...(model.reasoning?.defaultEffort === undefined
      ? {}
      : { reasoningEffort: model.reasoning.defaultEffort }),
  }
}

export function flattenChoices(groups: CatalogGroup[]): ModelChoice[] {
  let catalogIndex = 0
  return groups.flatMap((provider) => provider.models.map((model) => ({
    key: choiceKey(provider.id, model.id),
    provider,
    model,
    selection: selectionFor(provider, model),
    catalogIndex: catalogIndex++,
  })))
}

export function currentChoice(choices: ModelChoice[], current: CurrentSelection | null): ModelChoice | undefined {
  if (current === null) return undefined
  return choices.find((choice) => choice.provider.id === current.provider && choice.model.id === current.model)
}

function normalize(value: string | undefined): string {
  return value?.normalize('NFKC').trim().toLocaleLowerCase() ?? ''
}

function compact(value: string): string {
  return value.replace(/[^\p{L}\p{N}]/gu, '')
}

function scoreField(field: string, token: string, weight: number): number {
  if (field === token) return 1000 + weight
  if (field.startsWith(token)) return 700 + weight
  const boundary = field.split(/[^a-z0-9]+/u).some((part) => part.startsWith(token))
  if (boundary) return 500 + weight
  if (field.includes(token)) return 250 + weight
  const compactToken = compact(token)
  const compactField = compact(field)
  if (compactToken.length > 1 && compactField.includes(compactToken)) return 150 + weight
  return -1
}

export function searchScore(choice: ModelChoice, query: string): number | null {
  const tokens = normalize(query).split(/\s+/u).filter(Boolean)
  if (tokens.length === 0) return 0
  const fields = [
    [normalize(choice.model.name), 80],
    [normalize(choice.model.id), 70],
    [normalize(choice.provider.name), 55],
    [normalize(choice.provider.id), 45],
    [normalize(choice.model.description), 10],
  ] as const
  let score = 0
  for (const token of tokens) {
    if (token === '免费' || token === '免费模型' || token === 'is:free') {
      if (!isFreeChoice(choice.provider.id, choice.model.id)) return null
      continue
    }
    if (token === '推理' || token === '推理模型' || token === 'is:reasoning') {
      if ((choice.model.reasoning?.efforts.length ?? 0) === 0) return null
      continue
    }
    if (token.startsWith('@')) {
      const provider = compact(token.slice(1))
      if (!provider || ![choice.provider.id, choice.provider.name].some(field => compact(normalize(field)).includes(provider))) return null
      continue
    }
    let tokenScore = -1
    for (const [field, weight] of fields) tokenScore = Math.max(tokenScore, scoreField(field, token, weight))
    if (tokenScore < 0) return null
    score += tokenScore
  }
  return score
}

export interface RankOptions {
  query: string
  providerId: string | null
  favorites: readonly string[]
  recents: readonly string[]
  current: CurrentSelection | null
  quickFilter?: 'all' | 'favorites' | 'recents'
  capability?: 'all' | 'reasoning' | 'free'
  sort?: 'recommended' | 'name' | 'provider'
}

export function rankChoices(choices: ModelChoice[], options: RankOptions): ModelChoice[] {
  const favoriteRank = new Map(options.favorites.map((key, index) => [key, index]))
  const recentRank = new Map(options.recents.map((key, index) => [key, index]))
  const quickFilter = options.quickFilter ?? 'all'
  const currentKey = options.current === null ? null : choiceKey(options.current.provider, options.current.model)
  return choices
    .filter(choice => options.capability === undefined || options.capability === 'all'
      || options.capability === 'reasoning' && (choice.model.reasoning?.efforts.length ?? 0) > 0
      || options.capability === 'free' && isFreeChoice(choice.provider.id, choice.model.id))
    .filter((choice) => options.providerId === null || choice.provider.id === options.providerId)
    .filter((choice) => quickFilter === 'all'
      || quickFilter === 'favorites' && favoriteRank.has(choice.key)
      || quickFilter === 'recents' && recentRank.has(choice.key))
    .map((choice) => ({ choice, score: searchScore(choice, options.query) }))
    .filter((entry): entry is { choice: ModelChoice; score: number } => entry.score !== null)
    .sort((left, right) => {
      if (options.sort === 'name') return left.choice.model.name.localeCompare(right.choice.model.name) || left.choice.provider.name.localeCompare(right.choice.provider.name) || left.choice.catalogIndex - right.choice.catalogIndex
      if (options.sort === 'provider') return left.choice.provider.name.localeCompare(right.choice.provider.name) || left.choice.model.name.localeCompare(right.choice.model.name) || left.choice.catalogIndex - right.choice.catalogIndex
      if (options.query.trim() !== '' && left.score !== right.score) return right.score - left.score
      if (left.choice.key === currentKey) return -1
      if (right.choice.key === currentKey) return 1
      const leftFavorite = favoriteRank.get(left.choice.key)
      const rightFavorite = favoriteRank.get(right.choice.key)
      if (leftFavorite !== undefined || rightFavorite !== undefined) {
        if (leftFavorite === undefined) return 1
        if (rightFavorite === undefined) return -1
        if (leftFavorite !== rightFavorite) return leftFavorite - rightFavorite
      }
      const leftRecent = recentRank.get(left.choice.key)
      const rightRecent = recentRank.get(right.choice.key)
      if (leftRecent !== undefined || rightRecent !== undefined) {
        if (leftRecent === undefined) return 1
        if (rightRecent === undefined) return -1
        if (leftRecent !== rightRecent) return leftRecent - rightRecent
      }
      if (left.score !== right.score) return right.score - left.score
      return left.choice.catalogIndex - right.choice.catalogIndex
    })
    .map((entry) => entry.choice)
}

export function pushRecent(recents: readonly string[], key: string, limit = 12): string[] {
  return [key, ...recents.filter((entry) => entry !== key)].slice(0, limit)
}

export interface ProviderChoiceGroup {
  provider: CatalogGroup
  choices: ModelChoice[]
}

/**
 * Group ranked choices by provider for scan-friendly browsing of large
 * catalogs. Order mirrors the provider rail: current provider first, then the
 * keyless free lane, then alphabetical; choices keep their ranked order
 * inside each group.
 */
export function groupChoicesByProvider(choices: readonly ModelChoice[], currentProvider?: string | null): ProviderChoiceGroup[] {
  const groups = new Map<string, ProviderChoiceGroup>()
  for (const choice of choices) {
    const existing = groups.get(choice.provider.id)
    if (existing === undefined) groups.set(choice.provider.id, { provider: choice.provider, choices: [choice] })
    else existing.choices.push(choice)
  }
  return [...groups.values()].sort((left, right) => {
    const rank = (id: string) => id === currentProvider ? 0 : id === FREE_LANE_PROVIDER_ID ? 1 : 2
    const leftRank = rank(left.provider.id)
    const rightRank = rank(right.provider.id)
    if (leftRank !== rightRank) return leftRank - rightRank
    return left.provider.name.localeCompare(right.provider.name)
  })
}

/** Whether a provider panel offers free models that a catalog update can refresh. */
export function providerHasFreeModels(providerId: string, modelIds: readonly string[]): boolean {
  if (providerId === FREE_LANE_PROVIDER_ID) return true
  return modelIds.some(id => id.toLocaleLowerCase().endsWith(':free'))
}

/** Keyless free-lane runtime row as served by the plugin's snapshot endpoint. */
export interface FreeLaneModelEntry {
  id: string
  name: string
  contextWindow: number
  maxOutput: number
  input: Array<'text' | 'image'>
  efforts: string[]
  canDisableReasoning: boolean
  channel: 'kilo' | 'opencode'
}

export interface FreeLaneSnapshot {
  provider: string
  models: FreeLaneModelEntry[]
}

/**
 * Merge the plugin's keyless free lane into the DSH directory groups. Some DSH
 * builds do not surface adapter-registered providers through
 * session.modelCatalog; merging the runtime snapshot keeps the lane visible
 * (and selectable) regardless, and never duplicates an existing group.
 */
export function mergeFreeLaneGroup(groups: readonly CatalogGroup[], lane: FreeLaneSnapshot | null): CatalogGroup[] {
  if (lane === null || lane.models.length === 0) return [...groups]
  if (groups.some(group => group.id === FREE_LANE_PROVIDER_ID)) return [...groups]
  const effortName = (id: string) => id.charAt(0).toLocaleUpperCase() + id.slice(1)
  const models = lane.models.map(entry => ({
    id: entry.id,
    name: entry.name === '' ? entry.id : entry.name,
    ...(entry.efforts.length === 0 ? {} : {
      reasoning: {
        efforts: entry.efforts.map(id => ({ id, name: effortName(id) })),
        defaultEffort: entry.efforts.includes('high') ? 'high' : entry.efforts.at(-1),
      },
    }),
  }))
  return [...groups, { id: FREE_LANE_PROVIDER_ID, name: 'Free Models', models }]
}

export function toggleFavorite(favorites: readonly string[], key: string): string[] {
  return favorites.includes(key) ? favorites.filter((entry) => entry !== key) : [key, ...favorites]
}
