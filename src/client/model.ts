import type { CatalogGroup, CurrentSelection, ModelChoice, Selection } from './types.ts'

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
  return value?.trim().toLocaleLowerCase() ?? ''
}

function scoreField(field: string, token: string, weight: number): number {
  if (field === token) return 1000 + weight
  if (field.startsWith(token)) return 700 + weight
  const boundary = field.split(/[^a-z0-9]+/u).some((part) => part.startsWith(token))
  if (boundary) return 500 + weight
  if (field.includes(token)) return 250 + weight
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
}

export function rankChoices(choices: ModelChoice[], options: RankOptions): ModelChoice[] {
  const favoriteRank = new Map(options.favorites.map((key, index) => [key, index]))
  const recentRank = new Map(options.recents.map((key, index) => [key, index]))
  const currentKey = options.current === null ? null : choiceKey(options.current.provider, options.current.model)
  return choices
    .filter((choice) => options.providerId === null || choice.provider.id === options.providerId)
    .map((choice) => ({ choice, score: searchScore(choice, options.query) }))
    .filter((entry): entry is { choice: ModelChoice; score: number } => entry.score !== null)
    .sort((left, right) => {
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

export function toggleFavorite(favorites: readonly string[], key: string): string[] {
  return favorites.includes(key) ? favorites.filter((entry) => entry !== key) : [key, ...favorites]
}
