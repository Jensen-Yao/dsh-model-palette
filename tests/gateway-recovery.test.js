import { describe, expect, it, vi } from 'vitest'
import { createGatewayRecoveryHandler, isCloudflareBlock, isRetryableFailure } from '../src/gateway-recovery.js'
import {
  DEFAULT_REQUEST_RETRY_SETTINGS,
  registerRequestRetrySettings,
  resolveRequestRetryRule,
} from '../src/request-retry-settings.js'

function payload(failure, signal = new AbortController().signal, provider = 'bankofai', model = 'deepseek-v4-flash') {
  return { agent: { options: { model } }, turn: 2, step: 1, provider, failure, signal }
}

describe('gateway recovery', () => {
  it('recognizes only explicit Cloudflare 403 diagnostics', () => {
    expect(isCloudflareBlock({ code: 'AUTH', status: 403, message: 'Attention Required! | Cloudflare' })).toBe(true)
    expect(isCloudflareBlock({ code: 'AUTH', status: 401, message: 'API key is invalid' })).toBe(false)
    expect(isCloudflareBlock({ code: 'AUTH', status: 403, message: 'account forbidden' })).toBe(false)
  })

  it('classifies transient failures without retrying permanent request errors', () => {
    expect(isRetryableFailure({ code: 'TRANSPORT', message: 'fetch failed' })).toBe(true)
    expect(isRetryableFailure({ code: 'AUTH', status: 429, message: 'slow down' })).toBe(true)
    expect(isRetryableFailure({ code: 'AUTH', status: 503, message: 'unavailable' })).toBe(true)
    expect(isRetryableFailure({ code: 'INVALID_CREDENTIAL', status: 401, message: 'bad key' })).toBe(false)
    expect(isRetryableFailure({ code: 'CONTEXT_WINDOW_EXCEEDED', status: 400, message: 'too long' })).toBe(false)
  })

  it('presets B.AI and BankOfAI provider aliases to 50 retries', () => {
    expect(resolveRequestRetryRule(DEFAULT_REQUEST_RETRY_SETTINGS, 'bailsb', 'model')).toEqual({ maxRetries: 50, source: 'provider' })
    expect(resolveRequestRetryRule(DEFAULT_REQUEST_RETRY_SETTINGS, 'baiwhr', 'model')).toEqual({ maxRetries: 50, source: 'provider' })
    expect(resolveRequestRetryRule(DEFAULT_REQUEST_RETRY_SETTINGS, 'bankofai', 'model')).toEqual({ maxRetries: 50, source: 'provider' })
  })

  it('registers a mutable schema base without modifying the exported defaults', () => {
    const register = vi.fn((_namespace, schema, options) => {
      expect(() => schema(options.base)).not.toThrow()
      expect(options.base).not.toBe(DEFAULT_REQUEST_RETRY_SETTINGS)
      return { get: () => options.base }
    })
    registerRequestRetrySettings({ settings: { register } })
    expect(register).toHaveBeenCalledOnce()
    expect(DEFAULT_REQUEST_RETRY_SETTINGS.requestRetries.providers['b.ai'].maxRetries).toBe(50)
  })

  it('uses an exact model override before the provider retry count', async () => {
    const next = vi.fn(async () => ({ kind: 'retry' }))
    const retrySettings = { get: () => ({ requestRetries: { providers: { bankofai: { maxRetries: 2, models: { fragile: 1 } } } } }) }
    const handler = createGatewayRecoveryHandler({}, { delaysMs: [0] }, retrySettings)
    const request = payload({ code: 'TRANSPORT', message: 'fetch failed' }, undefined, 'bankofai', 'fragile')
    await expect(handler.recover(request, next)).resolves.toEqual({ kind: 'retry' })
    await expect(handler.recover(request, next)).resolves.toBeUndefined()
    expect(next).not.toHaveBeenCalled()
    await handler.dispose()
  })

  it('allows model rules while the provider-wide rule is disabled', () => {
    const settings = {
      requestRetries: {
        providers: {
          bankofai: {
            enabled: false,
            maxRetries: 50,
            models: { fragile: 4, stable: 0 },
          },
        },
      },
    }
    expect(resolveRequestRetryRule(settings, 'bankofai', 'fragile')).toEqual({ maxRetries: 4, source: 'model' })
    expect(resolveRequestRetryRule(settings, 'bankofai', 'stable')).toEqual({ maxRetries: 0, source: 'model' })
    expect(resolveRequestRetryRule(settings, 'bankofai', 'other')).toBeUndefined()
  })

  it('leaves unconfigured routes to downstream recovery', async () => {
    const next = vi.fn(async () => ({ kind: 'retry' }))
    const retrySettings = { get: () => ({ requestRetries: { providers: { bankofai: { maxRetries: 50, models: {} } } } }) }
    const handler = createGatewayRecoveryHandler({}, { delaysMs: [0] }, retrySettings)
    await expect(handler.recover(payload({ code: 'TRANSPORT', message: 'fetch failed' }, undefined, 'openrouter'), next)).resolves.toEqual({ kind: 'retry' })
    expect(next).toHaveBeenCalledOnce()
    await handler.dispose()
  })

  it('does not retry or delegate permanent failures on configured routes', async () => {
    const next = vi.fn(async () => ({ kind: 'retry' }))
    const retrySettings = { get: () => ({ requestRetries: { providers: { bankofai: { maxRetries: 50, models: {} } } } }) }
    const handler = createGatewayRecoveryHandler({}, { delaysMs: [0] }, retrySettings)
    await expect(handler.recover(payload({ code: 'INVALID_CREDENTIAL', status: 401, message: 'bad key' }), next)).resolves.toBeUndefined()
    expect(next).not.toHaveBeenCalled()
    await handler.dispose()
  })

  it('retries with bounded backoff and then relabels the final failure', async () => {
    const warn = vi.fn()
    const handler = createGatewayRecoveryHandler({ logger: { warn } }, { delaysMs: [0, 0], maxRetries: 2 })
    const failure = { code: 'AUTH', status: 403, message: '<title>Attention Required! | Cloudflare</title>' }
    const request = payload(failure)
    await expect(handler.recover(request, async () => undefined)).resolves.toEqual({ kind: 'retry' })
    await expect(handler.recover(request, async () => undefined)).resolves.toEqual({ kind: 'retry' })
    await expect(handler.recover(request, async () => undefined)).resolves.toBeUndefined()
    expect(failure).toMatchObject({ code: 'PROVIDER_BLOCKED', status: 403 })
    expect(failure.message).toContain('API key was not proven invalid')
    expect(warn).toHaveBeenCalledTimes(3)
    await handler.dispose()
  })

  it('respects a downstream recovery decision without spending its own retries', async () => {
    const handler = createGatewayRecoveryHandler({}, { delaysMs: [0], maxRetries: 1 })
    const request = payload({ code: 'AUTH', status: 403, message: 'Cloudflare 403 cf-error-details' })
    await expect(handler.recover(request, async () => ({ kind: 'retry' }))).resolves.toEqual({ kind: 'retry' })
    await expect(handler.recover(request, async () => undefined)).resolves.toEqual({ kind: 'retry' })
    await handler.dispose()
  })

  it('cancels an in-flight delay on request abort', async () => {
    const controller = new AbortController()
    const handler = createGatewayRecoveryHandler({}, { delaysMs: [10_000], maxRetries: 1 })
    const pending = handler.recover(payload({ code: 'AUTH', status: 403, message: 'HTTP 403 Cloudflare' }, controller.signal), async () => undefined)
    controller.abort()
    await expect(pending).resolves.toBeUndefined()
    await handler.dispose()
  })
})
