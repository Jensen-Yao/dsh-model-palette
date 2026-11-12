// Rebuild assets/model-presets.json from the live OpenRouter catalog,
// preserving and enriching every manually curated entry.
import { writeFileSync, readFileSync } from 'node:fs'

const existing = JSON.parse(readFileSync('assets/model-presets.json', 'utf8'))
const response = await fetch('https://openrouter.ai/api/v1/models', { headers: { accept: 'application/json' } })
if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`)
const catalog = await response.json()

const normalize = (value) => String(value).trim().toLowerCase().replace(/:free$/u, '').replace(/[._\s]+/gu, '-').replace(/-+/gu, '-')
const slug = (value) => normalize(value).replace(/\//gu, '-')
const posInt = (v) => Number.isSafeInteger(v) && v > 0 ? v : undefined
const today = '2026-11-13'

const manual = new Set(existing.presets.map(p => slug(p.id)))
const byCanonical = new Map(existing.presets.map(p => [slug(p.id), p]))
let added = 0
let enriched = 0

for (const row of catalog.data ?? []) {
  if (!row?.id) continue
  if (/:\w+$/u.test(row.id) && !/:free$/u.test(row.id)) continue
  const output = Array.isArray(row.architecture?.output_modalities) ? row.architecture.output_modalities : []
  if (output.length > 0 && !output.includes('text')) continue
  const baseId = slug(row.id)
  const input = (row.architecture?.input_modalities ?? ['text']).filter(m => m === 'text' || m === 'image')
  const contextWindow = posInt(row.context_length)
  const maxTokens = posInt(row.top_provider?.max_completion_tokens)
  const supported = Array.isArray(row.supported_parameters) ? row.supported_parameters : []
  const reasoning = supported.includes('reasoning')
  const rawName = typeof row.name === 'string' && row.name.trim() !== '' ? row.name.trim() : row.id
  const name = rawName.replace(/^[^:]{1,40}:\s*/u, '').replace(/\s*\(free\)\s*$/iu, '').trim() || rawName

  const aliasSet = new Set([String(row.id), baseId, slug(String(row.id).split('/').pop())])
  const preset = byCanonical.get(baseId)
  if (preset !== undefined) {
    let changed = false
    for (const alias of aliasSet) if (!preset.aliases.includes(alias)) { preset.aliases.push(alias); changed = true }
    if (preset.contextWindow === undefined && contextWindow !== undefined) { preset.contextWindow = contextWindow; changed = true }
    if (preset.maxTokens === undefined && maxTokens !== undefined) { preset.maxTokens = maxTokens; changed = true }
    if (preset.input === undefined && input.length > 0) { preset.input = [...new Set(input)]; changed = true }
    if (changed) enriched += 1
    continue
  }
  if (contextWindow === undefined) continue
  byCanonical.set(baseId, {
    id: String(row.id),
    name,
    aliases: [...aliasSet],
    contextWindow,
    ...(maxTokens === undefined ? {} : { maxTokens }),
    input: [...new Set(input.length > 0 ? input : ['text'])],
    ...(reasoning ? { reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high' } } : {}),
    sourceLabel: `OpenRouter catalog ${today}`,
    sourceUrl: 'https://openrouter.ai/api/v1/models',
  })
  added += 1
}

// Final uniqueness pass: a shared alias belongs to the manual entry first,
// otherwise to the first preset that claimed it; others drop the alias.
const owners = new Map()
for (const preset of byCanonical.values()) {
  const rank = manual.has(slug(preset.id)) ? 0 : 1
  for (const alias of preset.aliases) {
    const current = owners.get(alias)
    if (current === undefined) { owners.set(alias, { id: preset.id, rank }); continue }
    const challenger = { id: preset.id, rank }
    if (challenger.rank < current.rank) owners.set(alias, challenger)
  }
}
for (const preset of byCanonical.values()) {
  preset.aliases = preset.aliases.filter(alias => owners.get(alias)?.id === preset.id)
  if (preset.aliases.length === 0) preset.aliases = [preset.id]
}

const registry = {
  version: existing.version + 1,
  updatedAt: today,
  presets: [...byCanonical.values()].filter(preset => preset.aliases.length > 0),
}
writeFileSync('assets/model-presets.json', JSON.stringify(registry, null, 2) + '\n')
console.log(JSON.stringify({ kept: existing.presets.length, added, enriched, total: registry.presets.length }))
