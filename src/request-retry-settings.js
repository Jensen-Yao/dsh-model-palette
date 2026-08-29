import z from '@deepseek-ai/schemastery'

export const REQUEST_RETRY_SETTINGS_NAMESPACE = 'dsh-model-palette'
export const MAX_CONFIGURED_RETRIES = 1_000

const PRESET_PROVIDERS = ['b.ai', 'bai', 'bailsb', 'baiwhr', 'bankofai']
const retryCount = z.number().step(1).min(0).max(MAX_CONFIGURED_RETRIES)
const providerRule = z.object({
  enabled: z.boolean().default(true),
  maxRetries: retryCount.default(0),
  models: z.dict(retryCount).default({}),
})

export const RequestRetrySettingsSchema = z.object({
  requestRetries: z.object({
    providers: z.dict(providerRule).default({}),
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
})

/** Register live request-retry settings with B.AI and BankOfAI aliases preset to 50 retries. */
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

function isRetryCount(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_CONFIGURED_RETRIES
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
