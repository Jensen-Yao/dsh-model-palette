/** Settings descriptor fields shared by the server bridge and browser panel. */
interface SettingsEntry {
  ns: string
  schema?: unknown
  value?: unknown
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function schemaRoot(value: unknown): Record<string, unknown> | undefined {
  if (!record(value)) return undefined
  if (record(value.refs) && (typeof value.uid === 'number' || typeof value.uid === 'string')) {
    const root = value.refs[String(value.uid)]
    return record(root) ? root : undefined
  }
  return value
}

/**
 * Resolve canonical namespaces or one renamed profile entry by its editable fields.
 * Ambiguous instances require the canonical entry id; substring matches are never used.
 * @param entries Active settings descriptors.
 * @param ns Canonical namespace or explicit profile entry id.
 * @returns The matching entry, or undefined when it is not active.
 */
export function settingsEntry<T extends SettingsEntry>(entries: readonly T[], ns: string): T | undefined {
  const exact = entries.find(entry => entry.ns === ns)
  if (exact !== undefined) return exact
  const fields = ns === 'dsh-model-palette' ? ['requestRetries', 'freeSync']
    : ns === 'llm-pi-ai' ? ['providers'] : undefined
  if (fields === undefined) return undefined
  const matches = entries.filter(entry => {
    const root = schemaRoot(entry.schema)
    const dict = record(root?.dict) ? root.dict : undefined
    return dict !== undefined && fields.every(field => Object.hasOwn(dict, field))
  })
  if (matches.length > 1) throw new Error(`Multiple settings entries match "${ns}": ${matches.map(entry => entry.ns).join(', ')}`)
  return matches[0]
}
