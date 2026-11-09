import { settingsEntry } from '../settings-namespace.ts'

/**
 * Adapt native DSH 0.1 settings and DSH 0.2 SettingsForms to live read/write handles.
 * @param ctx Plugin context with its owning profile entry and settings service.
 * @returns Namespace registration, synchronous reads, and revision-aware mutations.
 */
export function createSettingsBackend(ctx) {
  const settings = ctx.settings
  if (settings && typeof settings.register === 'function' && typeof settings.get === 'function' && typeof settings.mutate === 'function') {
    return {
      mode: 'native',
      register: (ns, schema, opts) => settings.register(ns, schema, opts),
      get: ns => settings.get(ns),
      snapshot: ns => settings.describe({ redactSecrets: false }).find(entry => entry.ns === ns),
      mutate: (ns, ops, revision) => settings.mutate(ns, ops, revision),
    }
  }
  if (!settings || typeof settings.describe !== 'function' || typeof settings.mutate !== 'function') {
    throw new Error('dsh-model-palette requires native settings or SettingsForms describe/mutate support')
  }
  const ownNs = ctx.fiber?.entry?.options?.id ?? 'dsh-model-palette'

  function findEntry(ns) {
    const target = ns === 'dsh-model-palette' ? ownNs : ns
    return settingsEntry(settings.describe({ redactSecrets: false }), target)
  }

  return {
    mode: 'compat-0.2',

    register(ns) {
      return {
        get: () => findEntry(ns)?.value,
        dispose: () => {},
      }
    },

    get(ns) {
      return findEntry(ns)?.value
    },
    snapshot: ns => findEntry(ns),

    async mutate(ns, ops, revision) {
      const entry = findEntry(ns)
      if (!entry) throw new Error(`settings namespace "${ns}" is not loaded`)
      await settings.mutate(entry.ns, ops, revision)
    },
  }
}
