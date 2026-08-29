import { resolveRequestRetryRule } from './request-retry-settings.js'

const CLOUDFLARE_BLOCK_PATTERN = /(?:Attention Required!\s*\|\s*Cloudflare|\bCloudflare\b|cf-error-details|cdn-cgi\/styles\/cf\.errors\.css)/iu
const DEFAULT_DELAYS_MS = [750, 1_500, 3_000]
const RETRYABLE_CODES = new Set(['EMPTY_RESPONSE', 'RATE_LIMIT', 'SERVER', 'TIMEOUT', 'TRANSPORT'])
const BLOCKED_CODE = 'PROVIDER_BLOCKED'
const BLOCKED_MESSAGE = 'Cloudflare/WAF blocked the provider request before it reached the API. The API key was not proven invalid; retry later or review the gateway, request content, size, and rate limits.'

/** Register recovery for Cloudflare/WAF responses misclassified as authentication failures. */
export function registerGatewayRecovery(ctx, config = {}, retrySettings) {
  if (config.enabled === false) return
  const handler = createGatewayRecoveryHandler(ctx, config, retrySettings)
  const dispose = ctx.on('agent/request-error', handler.recover)
  ctx.effect(() => async () => {
    dispose()
    await handler.dispose()
  }, 'dsh-model-palette: abort and drain gateway recovery')
}

/** Create the request-error listener separately so retry behavior remains unit-testable. */
export function createGatewayRecoveryHandler(ctx, config = {}, retrySettings = { get: () => ({}) }) {
  const delaysMs = resolveDelays(config.delaysMs)
  const maxRetries = resolveMaxRetries(config.maxRetries, delaysMs.length)
  const lifetime = new AbortController()
  const retries = new WeakMap()
  const active = new Set()

  async function recover(payload, next) {
    const model = typeof payload.agent?.options?.model === 'string' ? payload.agent.options.model : ''
    const rule = resolveRequestRetryRule(retrySettings.get(), payload.provider, model)
    if (rule !== undefined) return recoverConfigured(payload, model, rule)

    const downstream = await next()
    if (downstream?.kind === 'retry') return downstream
    if (!isCloudflareBlock(payload.failure)) return downstream

    const key = `gateway:${payload.turn}:${payload.step}:${payload.provider}:${model}`
    const agentRetries = retries.get(payload.agent) ?? new Map()
    retries.set(payload.agent, agentRetries)
    const retry = agentRetries.get(key) ?? 0
    if (retry >= maxRetries || payload.signal.aborted || lifetime.signal.aborted) {
      agentRetries.delete(key)
      relabelCloudflareFailure(payload.failure)
      ctx.logger?.warn?.(`dsh-model-palette: provider "${payload.provider}" remained blocked by Cloudflare/WAF after ${retry} recovery attempts`)
      return downstream
    }

    const delayMs = delaysMs[Math.min(retry, delaysMs.length - 1)]
    agentRetries.set(key, retry + 1)
    ctx.logger?.warn?.(`dsh-model-palette: provider "${payload.provider}" hit Cloudflare/WAF; retrying in ${delayMs}ms (${retry + 1}/${maxRetries})`)
    const pending = cancellableDelay(delayMs, AbortSignal.any([payload.signal, lifetime.signal]))
    active.add(pending)
    try {
      if (!await pending) return downstream
      return { kind: 'retry' }
    } finally {
      active.delete(pending)
    }
  }

  async function recoverConfigured(payload, model, rule) {
    if (!isRetryableFailure(payload.failure) || payload.signal.aborted || lifetime.signal.aborted) return undefined

    const key = `configured:${payload.turn}:${payload.step}:${payload.provider}:${model}`
    const agentRetries = retries.get(payload.agent) ?? new Map()
    retries.set(payload.agent, agentRetries)
    const retry = agentRetries.get(key) ?? 0
    if (retry >= rule.maxRetries) {
      agentRetries.delete(key)
      if (isCloudflareBlock(payload.failure)) relabelCloudflareFailure(payload.failure)
      if (retry > 0) {
        ctx.logger?.warn?.(`dsh-model-palette: ${rule.source} retry limit reached for "${payload.provider}/${model || '?'}" after ${retry} attempts`)
      }
      return undefined
    }

    const delayMs = resolveRetryDelay(payload.failure, delaysMs, retry)
    agentRetries.set(key, retry + 1)
    ctx.logger?.warn?.(`dsh-model-palette: transient request failure for "${payload.provider}/${model || '?'}"; retrying in ${delayMs}ms (${retry + 1}/${rule.maxRetries}, ${rule.source} rule)`)
    const pending = cancellableDelay(delayMs, AbortSignal.any([payload.signal, lifetime.signal]))
    active.add(pending)
    try {
      if (!await pending) return undefined
      return { kind: 'retry' }
    } finally {
      active.delete(pending)
    }
  }

  return {
    recover,
    async dispose() {
      lifetime.abort(new Error('dsh-model-palette gateway recovery disposed'))
      await Promise.allSettled([...active])
    },
  }
}

/** Identify only explicit Cloudflare/WAF 403 diagnostics. */
export function isCloudflareBlock(failure) {
  if (failure === null || typeof failure !== 'object') return false
  const message = typeof failure.message === 'string' ? failure.message : ''
  const isForbidden = failure.status === 403 || /\b403\b/u.test(message)
  return isForbidden && CLOUDFLARE_BLOCK_PATTERN.test(message)
}

/** Retry only provider-neutral transient failures plus explicit HTTP transient statuses. */
export function isRetryableFailure(failure) {
  if (failure === null || typeof failure !== 'object') return false
  if (isCloudflareBlock(failure)) return true
  const code = typeof failure.code === 'string' ? failure.code.toLocaleUpperCase() : ''
  if (RETRYABLE_CODES.has(code)) return true
  const status = failure.status
  return status === 408 || status === 425 || status === 429 || (typeof status === 'number' && status >= 500 && status <= 599)
}

function relabelCloudflareFailure(failure) {
  failure.code = BLOCKED_CODE
  failure.status = 403
  failure.message = BLOCKED_MESSAGE
}

function resolveDelays(value) {
  if (value === undefined) return DEFAULT_DELAYS_MS
  if (!Array.isArray(value) || value.length === 0 || value.some(delay => !Number.isInteger(delay) || delay < 0 || delay > 60_000)) {
    throw new Error('dsh-model-palette: gatewayRecovery.delaysMs must be a non-empty array of integers from 0 to 60000')
  }
  return [...value]
}

function resolveMaxRetries(value, availableDelays) {
  if (value === undefined) return availableDelays
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new Error('dsh-model-palette: gatewayRecovery.maxRetries must be an integer from 0 to 10')
  }
  return value
}

function resolveRetryDelay(failure, delaysMs, retry) {
  const providerDelay = failure?.providerRetryAfterMs
  if (Number.isFinite(providerDelay) && providerDelay > 0 && providerDelay <= 60_000) return Math.round(providerDelay)
  return delaysMs[Math.min(retry, delaysMs.length - 1)]
}

function cancellableDelay(delayMs, signal) {
  if (signal.aborted) return Promise.resolve(false)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve(true)
    }, delayMs)
    const onAbort = () => {
      clearTimeout(timer)
      resolve(false)
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
