/**
 * Bridge the plugin's settings surface across dsh runtimes.
 *
 * - dsh 0.1: `ctx.settings` exposes register/get/mutate natively — pass through.
 * - dsh 0.2: `ctx.settings` became SettingsForms (schema-driven profile forms)
 *   without register/get. The plugin exports a `Config` schema, so its own
 *   namespace lives as the profile entry's composed config (entry id from
 *   `ctx.fiber.entry.options.id`), and the official `llm-pi-ai` namespace is
 *   bridged onto SettingsForms describe/mutate so provider profiles keep
 *   flowing into the official model configuration.
 */
export function createSettingsBackend(ctx) {
  const settings = ctx.settings
  if (settings && typeof settings.register === 'function' && typeof settings.get === 'function') {
    return { mode: 'native', register: (ns, schema, opts) => settings.register(ns, schema, opts) }
  }

  const ownNs = ctx.fiber?.entry?.options?.id ?? 'dsh-model-palette'

  function findEntry(ns) {
    if (typeof settings.describe !== 'function') return undefined
    const list = settings.describe({ redactSecrets: false })
    return list.find(d => d.ns === ns)
      ?? list.find(d => typeof d.ns === 'string' && d.ns.includes(ns))
  }

  return {
    mode: 'compat-0.2',

    /**
     * On 0.2 composition is driven by the exported `Config` schema, so
     * registration only returns a live-value handle (sync `get`, matching the
     * 0.1 handle contract used by gateway-recovery).
     */
    register(ns /* , schema, opts */) {
      return {
        get: () => findEntry(ns)?.value,
        dispose: () => {},
      }
    },

    async get(ns) {
      return findEntry(ns)?.value
    },

    async mutate(ns, ops) {
      if (!Array.isArray(ops)) throw new Error('settings mutate expects an ops array')
      const entry = findEntry(ns)
      if (!entry) throw new Error(`settings namespace "${ns}" is not loaded`)
      await settings.mutate(entry.ns, ops)
    },
  }
}
