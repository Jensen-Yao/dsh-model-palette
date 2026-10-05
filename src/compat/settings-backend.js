import fs from 'node:fs'
import path from 'node:path'

const OWN_NAMESPACE = 'dsh-model-palette'
const LLM_NAMESPACE = 'llm-pi-ai'

/**
 * Bridge the plugin's settings surface across dsh runtimes.
 *
 * - dsh 0.1: `ctx.settings` exposes register/get/mutate natively — pass through.
 * - dsh 0.2: `ctx.settings` became SettingsForms (schema-driven profile forms)
 *   without register/get. The plugin's own namespace is backed by a JSON file
 *   under the DSH storage root; the official `llm-pi-ai` namespace is bridged
 *   onto SettingsForms describe/mutate so provider profiles keep flowing into
 *   the official model configuration.
 */
export function createSettingsBackend(ctx) {
  const settings = ctx.settings
  if (settings && typeof settings.register === 'function' && typeof settings.get === 'function') {
    return { mode: 'native', register: (ns, schema, opts) => settings.register(ns, schema, opts) }
  }
  return createCompatBackend(ctx)
}

function createCompatBackend(ctx) {
  const file = storageFile()
  const schemas = new Map()
  const bases = new Map()

  function loadOwn() {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      return isRecord(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  function persistOwn(section) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(section, null, 2), 'utf8')
  }

  function ownValue() {
    const base = bases.get(OWN_NAMESPACE) ?? {}
    const stored = loadOwn()
    return deepMerge(base, stored)
  }

  return {
    mode: 'compat-0.2',

    register(ns, schema, opts = {}) {
      if (ns === OWN_NAMESPACE) {
        schemas.set(ns, schema)
        bases.set(ns, isRecord(opts.base) ? structuredClone(opts.base) : {})
        return { get: () => ownValue(), dispose: () => {} }
      }
      // Other namespaces (official ones included) need no registration on 0.2.
      return { get: () => undefined, dispose: () => {} }
    },

    async get(ns) {
      if (ns === OWN_NAMESPACE) return ownValue()
      if (ns === LLM_NAMESPACE) {
        const entry = findEntry(ctx, ns)
        return entry ? entry.value : undefined
      }
      return undefined
    },

    async mutate(ns, ops) {
      if (!Array.isArray(ops)) throw new Error('settings mutate expects an ops array')
      if (ns === OWN_NAMESPACE) {
        const section = loadOwn()
        for (const op of ops) applyPathOp(section, op)
        persistOwn(section)
        return
      }
      if (ns === LLM_NAMESPACE) {
        const entry = findEntry(ctx, ns)
        if (!entry) throw new Error(`settings namespace "${ns}" is not loaded`)
        await ctx.settings.mutate(entry.ns, ops)
        return
      }
      throw new Error(`settings namespace "${ns}" is not loaded`)
    },
  }
}

function findEntry(ctx, ns) {
  const descriptors = ctx.settings.describe
    ? ctx.settings.describe({ redactSecrets: false })
    : []
  const exact = descriptors.find(d => d.ns === ns)
  if (exact) return exact
  return descriptors.find(d => typeof d.ns === 'string' && d.ns.includes(ns))
}

function storageFile() {
  const home = process.env.DSH_HOME && process.env.DSH_HOME.trim() !== ''
    ? process.env.DSH_HOME
    : path.join(process.env.USERPROFILE || process.env.HOME || '.', '.dsh')
  return path.join(home, 'storage', 'dsh-model-palette', 'settings.json')
}

function applyPathOp(root, op) {
  const segments = Array.isArray(op.path) ? op.path : []
  if (segments.length === 0) {
    if (op.op === 'set') return op.value
    return root
  }
  let node = root
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    if (!isRecord(node[key])) node[key] = {}
    node = node[key]
  }
  const last = segments[segments.length - 1]
  if (op.op === 'unset') delete node[last]
  else node[last] = op.value
  return root
}

function deepMerge(base, override) {
  if (!isRecord(base)) return override === undefined ? base : override
  if (!isRecord(override)) return structuredClone(base)
  const out = structuredClone(base)
  for (const [key, value] of Object.entries(override)) {
    if (isRecord(value) && isRecord(out[key])) out[key] = deepMerge(out[key], value)
    else out[key] = value
  }
  return out
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
