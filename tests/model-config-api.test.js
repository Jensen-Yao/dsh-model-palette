import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { createModelConfigApiHandler } from '../src/model-config-api.js'

async function invoke(handler, body, options = {}) {
  const req = Readable.from([JSON.stringify(body)])
  Object.assign(req, {
    method: 'POST',
    url: options.url ?? '/model-palette/api/config/credentials/reveal',
    headers: {
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
      host: options.host ?? '127.0.0.1:3080',
      origin: options.origin ?? 'http://127.0.0.1:3080',
      ...(options.headers ?? {}),
    },
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
  })
  let status = 0
  let text = ''
  const res = {
    writeHead(nextStatus) { status = nextStatus },
    end(chunk = '') { text += String(chunk) },
  }
  await handler(req, res)
  return { status, body: JSON.parse(text) }
}

describe('model configuration credential API', () => {
  it('reveals a configured key only on direct loopback access', async () => {
    const resolve = vi.fn(async () => ({ value: 'secret-value', source: 'file' }))
    const response = await invoke(createModelConfigApiHandler({ credentials: { resolve } }), { ref: 'BANKOFAI_API_KEY' })
    expect(response).toEqual({ status: 200, body: { ok: true, value: { value: 'secret-value' } } })
    expect(resolve).toHaveBeenCalledWith('BANKOFAI_API_KEY')
  })

  it('rejects LAN access even when the browser request is same-origin', async () => {
    const resolve = vi.fn()
    const response = await invoke(createModelConfigApiHandler({ credentials: { resolve } }), { ref: 'BANKOFAI_API_KEY' }, {
      host: '192.168.1.20:3080',
      origin: 'http://192.168.1.20:3080',
      remoteAddress: '192.168.1.30',
    })
    expect(response.status).toBe(403)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('rejects reverse-proxy traffic that arrives from loopback', async () => {
    const resolve = vi.fn()
    const response = await invoke(createModelConfigApiHandler({ credentials: { resolve } }), { ref: 'BANKOFAI_API_KEY' }, {
      headers: { 'x-forwarded-for': '203.0.113.5' },
    })
    expect(response.status).toBe(403)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('tests both OpenAI protocols with the stored key without returning it', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ id: 'ok' }), { status: url.endsWith('/chat/completions') ? 200 : 404, headers: { 'content-type': 'application/json' } })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'stored-secret', source: 'file' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', model: 'reasoner' }, {
        url: '/model-palette/api/config/protocols/probe',
      })
      expect(response).toEqual({ status: 200, body: { ok: true, value: { results: [
        { protocol: 'openai-completions', available: true },
        { protocol: 'openai-responses', available: false, error: 'HTTP 404: {"id":"ok"}' },
      ] } } })
      expect(calls).toHaveLength(2)
      expect(calls[0].init.headers.authorization).toBe('Bearer stored-secret')
      expect(JSON.stringify(response.body)).not.toContain('stored-secret')
      expect(JSON.stringify(calls[0].init.body)).toContain('reasoner')
      expect(JSON.stringify(calls[1].init.body)).toContain('reasoner')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('rejects protocol probing from a cross-site browser request', async () => {
    const resolve = vi.fn()
    const response = await invoke(createModelConfigApiHandler({ credentials: { resolve } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'KEY', model: 'm' }, {
      url: '/model-palette/api/config/protocols/probe',
      headers: { 'sec-fetch-site': 'cross-site' },
    })
    expect(response.status).toBe(403)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('validates a key through the model catalog without returning it', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = vi.fn(async (url, init) => {
      expect(url).toBe('https://gateway.example/v1/models')
      expect(init.method).toBe('GET')
      expect(init.headers.authorization).toBe('Bearer stored-secret')
      return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    globalThis.fetch = fetchMock
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'stored-secret', source: 'file' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', protocol: 'openai-responses', model: 'reasoner' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response).toEqual({ status: 200, body: { ok: true, value: {
        protocol: 'openai-responses', model: 'reasoner', status: 'valid', checkedBy: 'models', httpStatus: 200,
        message: 'HTTP 200: model catalog accepted the API key',
      } } })
      expect(JSON.stringify(response.body)).not.toContain('stored-secret')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('falls back to the selected model and classifies a rejected key', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      if (url.endsWith('/models')) return new Response('', { status: 404 })
      return new Response(JSON.stringify({ error: { message: 'Incorrect API key' } }), { status: 401, headers: { 'content-type': 'application/json' } })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'bad-secret' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', protocol: 'openai-completions', model: 'reasoner' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response.body.value).toMatchObject({
        protocol: 'openai-completions', model: 'reasoner', status: 'invalid', checkedBy: 'request', httpStatus: 401,
        message: 'HTTP 401: Incorrect API key',
      })
      expect(calls).toHaveLength(2)
      expect(calls[1].url).toBe('https://gateway.example/v1/chat/completions')
      expect(calls[1].init.headers.authorization).toBe('Bearer bad-secret')
      expect(JSON.stringify(response.body)).not.toContain('bad-secret')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('uses Anthropic authentication for message protocol validation', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return new Response('', { status: url.endsWith('/models') ? 405 : 200 })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'anthropic-secret' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'ANTHROPIC_API_KEY', protocol: 'anthropic-messages', model: 'claude-test' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response.body.value).toMatchObject({ protocol: 'anthropic-messages', status: 'valid', checkedBy: 'request', httpStatus: 200 })
      expect(calls[1].url).toBe('https://gateway.example/v1/messages')
      expect(calls[1].init.headers['x-api-key']).toBe('anthropic-secret')
      expect(calls[1].init.headers.authorization).toBeUndefined()
      expect(calls[1].init.headers['anthropic-version']).toBe('2023-06-01')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
