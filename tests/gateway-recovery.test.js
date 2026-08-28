import { describe, expect, it, vi } from 'vitest'
import { createGatewayRecoveryHandler, isCloudflareBlock } from '../src/gateway-recovery.js'

function payload(failure, signal = new AbortController().signal) {
  return { agent: {}, turn: 2, step: 1, provider: 'bankofai', failure, signal }
}

describe('gateway recovery', () => {
  it('recognizes only explicit Cloudflare 403 diagnostics', () => {
    expect(isCloudflareBlock({ code: 'AUTH', status: 403, message: 'Attention Required! | Cloudflare' })).toBe(true)
    expect(isCloudflareBlock({ code: 'AUTH', status: 401, message: 'API key is invalid' })).toBe(false)
    expect(isCloudflareBlock({ code: 'AUTH', status: 403, message: 'account forbidden' })).toBe(false)
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
