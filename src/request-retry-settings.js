import z from '@deepseek-ai/schemastery'

export const REQUEST_RETRY_SETTINGS_NAMESPACE = 'dsh-model-palette'
export const MAX_CONFIGURED_RETRIES = 1_000

const PRESET_PROVIDERS = ['b.ai', 'bai', 'bailsb', 'baiwhr', 'bankofai']
const FREE_SYNC_PRESET_PROVIDERS = ['openrouter-free']
const retryCount = z.number().step(1).min(0).max(MAX_CONFIGURED_RETRIES)
const providerRule = z.object({
  enabled: z.boolean().default(true),
  maxRetries: retryCount.default(0),
  models: z.dict(retryCount).default({}),
})
const freeSyncRule = z.object({
  enabled: z.boolean().default(true),
  intervalHours: z.number().step(1).min(0).max(168).default(6),
})
const freeSyncState = z.object({
  lastSyncAt: z.string(),
  total: z.number().min(0).required(false),
  added: z.number().min(0).required(false),
  removed: z.number().min(0).required(false),
  error: z.string().required(false),
})

export const RequestRetrySettingsSchema = z.object({
  requestRetries: z.object({
    providers: z.dict(providerRule).default({}),
  }),
  freeSync: z.object({
    providers: z.dict(freeSyncRule).default({}),
    state: z.dict(freeSyncState).default({}),
  }),
})

export const DEFAULT_REQUEST_RETRY_SETTINGS = Object.freeze({
  requestRetries: Object.freeze({
    providers: Object.freeze(Object.fromEntries(PRESET_PROVIDERS.map(provider => [provider, Object.freeze({
      enabled: true,
      maxRetries: 50,
      models: Object.freeze({}),
    })]))),
  }),
  freeSync: Object.freeze({
    providers: Object.freeze(Object.fromEntries(FREE_SYNC_PRESET_PROVIDERS.map(provider => [provider, Object.freeze({
      enabled: true,
      intervalHours: 6,
    })]))),
    state: Object.freeze({}),
  }),
})

/** Register live request-retry and free-sync settings with plugin-presets applied. */
export function registerRequestRetrySettings(ctx) {
  return ctx.settings.register(
    REQUEST_RETRY_SETTINGS_NAMESPACE,
    RequestRetrySettingsSchema,
    { base: structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS), applies: 'live' },
  )
}

/** Resolve an exact model override before the provider-wide retry count. */
export function resolveRequestRetryRule(settings, provider, model) {
  const requestRetries = isRecord(settings?.requestRetries) ? settings.requestRetries : undefined
  const providers = isRecord(requestRetries?.providers) ? requestRetries.providers : undefined
  const rule = isRecord(providers?.[provider]) ? providers[provider] : undefined
  if (rule === undefined) return undefined

  const models = isRecord(rule.models) ? rule.models : undefined
  if (model !== '' && models !== undefined && Object.hasOwn(models, model)) {
    const maxRetries = models[model]
    return isRetryCount(maxRetries) ? { maxRetries, source: 'model' } : undefined
  }
  return rule.enabled !== false && isRetryCount(rule.maxRetries)
    ? { maxRetries: rule.maxRetries, source: 'provider' }
    : undefined
}

/** Read the free-sync rule for one provider from the plugin settings value. */
export function resolveFreeSyncRule(settings, provider) {
  const freeSync = isRecord(settings?.freeSync) ? settings.freeSync : undefined
  const providers = isRecord(freeSync?.providers) ? freeSync.providers : undefined
  const rule = isRecord(providers?.[provider]) ? providers[provider] : undefined
  if (rule === undefined || rule.enabled === false) return undefined
  const intervalHours = Number.isFinite(rule.intervalHours) && rule.intervalHours > 0
    ? rule.intervalHours
    : 6
  return { intervalHours }
}

/** Read the recorded sync state for one provider (undefined when never synced). */
export function resolveFreeSyncState(settings, provider) {
  const freeSync = isRecord(settings?.freeSync) ? settings.freeSync : undefined
  const state = isRecord(freeSync?.state) ? freeSync.state : undefined
  return isRecord(state?.[provider]) ? state[provider] : undefined
}

function isRetryCount(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_CONFIGURED_RETRIES
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
