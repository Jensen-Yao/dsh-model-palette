/** Browser-local shortcuts store exact provider, model and reasoning selections. */
import type { Selection } from './types.ts'

/** A named selection; no provider configuration or credentials are stored. */
export interface QuickProfile {
  id: string
  name: string
  selection: Selection
}

export const QUICK_PROFILE_LIMIT = 12
export const QUICK_PROFILE_NAME_LIMIT = 40

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read valid, distinct shortcuts from browser storage without trusting its JSON.
 * @param value Decoded storage value.
 * @returns At most twelve detached shortcuts, preserving their order.
 */
export function parseQuickProfiles(value: unknown): QuickProfile[] {
  if (!Array.isArray(value)) return []
  const result: QuickProfile[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const item of value) {
    if (!record(item) || typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 100 || ids.has(item.id)
      || typeof item.name !== 'string' || item.name.trim().length === 0 || item.name.trim().length > QUICK_PROFILE_NAME_LIMIT
      || names.has(item.name.trim().toLocaleLowerCase()) || !record(item.selection)) continue
    const { provider, model, reasoningEffort } = item.selection
    if (typeof provider !== 'string' || !provider.trim() || provider.length > 512
      || typeof model !== 'string' || !model.trim() || model.length > 512
      || reasoningEffort !== undefined && (typeof reasoningEffort !== 'string' || !reasoningEffort.trim() || reasoningEffort.length > 100)) continue
    result.push({ id: item.id, name: item.name.trim(), selection: { provider, model, ...(reasoningEffort === undefined ? {} : { reasoningEffort }) } })
    ids.add(item.id)
    names.add(item.name.trim().toLocaleLowerCase())
    if (result.length === QUICK_PROFILE_LIMIT) break
  }
  return result
}

/**
 * Create or replace a named shortcut without changing the caller's list.
 * A new shortcut with an existing name updates that name's selection in place.
 * @param profiles Current ordered shortcuts.
 * @param profile Shortcut to save or rename.
 * @returns Detached list with the saved shortcut.
 */
export function saveQuickProfile(profiles: readonly QuickProfile[], profile: QuickProfile): QuickProfile[] {
  const name = profile.name.trim()
  if (!name || name.length > QUICK_PROFILE_NAME_LIMIT) throw new Error('quick.nameInvalid')
  const sameId = profiles.findIndex(item => item.id === profile.id)
  const sameName = profiles.findIndex(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())
  if (sameId >= 0 && sameName >= 0 && sameId !== sameName) throw new Error('quick.nameTaken')
  const index = sameId >= 0 ? sameId : sameName
  if (index < 0 && profiles.length >= QUICK_PROFILE_LIMIT) throw new Error('quick.limit')
  const next = profiles.map(item => structuredClone(item))
  const saved = { ...structuredClone(profile), id: index >= 0 ? profiles[index]!.id : profile.id, name }
  if (index >= 0) next[index] = saved
  else next.push(saved)
  return next
}

/**
 * Move a shortcut by one position, retaining order at the list edges.
 * @param profiles Current shortcuts.
 * @param id Shortcut to move.
 * @param direction Previous or next position.
 * @returns Reordered list.
 */
export function moveQuickProfile(profiles: readonly QuickProfile[], id: string, direction: -1 | 1): QuickProfile[] {
  const next = [...profiles]
  const index = next.findIndex(item => item.id === id)
  const destination = index + direction
  if (index < 0 || destination < 0 || destination >= next.length) return next
  const item = next[index]!
  next[index] = next[destination]!
  next[destination] = item
  return next
}

/**
 * Compare exact selections, including the distinction between default and explicit effort.
 * @param left First selection.
 * @param right Second selection.
 * @returns Whether provider, model and effort are equal.
 */
export function sameSelection(left: Selection | null, right: Selection | null): boolean {
  return left !== null && right !== null && left.provider === right.provider && left.model === right.model && left.reasoningEffort === right.reasoningEffort
}
