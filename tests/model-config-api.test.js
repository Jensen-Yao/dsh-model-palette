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
      const body = JSON.parse(init.body)
      if (url.endsWith('/chat/completions')) {
        return body.max_tokens > 2
          ? new Response(JSON.stringify({ id: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } })
          : new Response(JSON.stringify({ error: { message: 'max_tokens must be greater than 2' } }), { status: 400, headers: { 'content-type': 'application/json' } })
      }
      return new Response(JSON.stringify(JSON.stringify({
        error: { message: 'model glm-5.3-flash is not supported on /v1/responses; use /v1/chat/completions instead' },
        request_id: `req_${'x'.repeat(400)}`,
      })), { status: 400, headers: { 'content-type': 'application/json' } })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'stored-secret', source: 'file' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', model: 'reasoner' }, {
        url: '/model-palette/api/config/protocols/probe',
      })
      expect(response).toEqual({ status: 200, body: { ok: true, value: { results: [
        { protocol: 'openai-completions', available: true },
        { protocol: 'openai-responses', available: false, error: 'HTTP 400: model glm-5.3-flash is not supported on /v1/responses; use /v1/chat/completions instead' },
      ] } } })
      expect(calls).toHaveLength(2)
      expect(calls[0].init.headers.authorization).toBe('Bearer stored-secret')
      expect(JSON.stringify(response.body)).not.toContain('stored-secret')
      expect(JSON.parse(calls[0].init.body)).toMatchObject({ model: 'reasoner', max_tokens: 16 })
      expect(JSON.parse(calls[1].init.body)).toMatchObject({ model: 'reasoner', max_output_tokens: 16 })
      expect(JSON.parse(calls[0].init.body).stream).toBe(true)
      expect(JSON.parse(calls[1].init.body).stream).toBe(true)
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

  it('validates through the selected model instead of trusting a public model catalog', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = vi.fn(async (url, init) => {
      expect(url).toBe('https://gateway.example/v1/responses')
      expect(init.method).toBe('POST')
      expect(init.headers.authorization).toBe('Bearer stored-secret')
      return new Response(JSON.stringify({ error: { message: 'API key is invalid' } }), { status: 401, headers: { 'content-type': 'application/json' } })
    })
    globalThis.fetch = fetchMock
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'stored-secret', source: 'file' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', protocol: 'openai-responses', model: 'reasoner' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response).toEqual({ status: 200, body: { ok: true, value: {
        protocol: 'openai-responses', model: 'reasoner', status: 'invalid', checkedBy: 'request', httpStatus: 401,
        message: 'HTTP 401: API key is invalid', credentialTarget: 'runtime', runtimeConfigured: true, credentialSource: 'file',
      } } })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(JSON.stringify(response.body)).not.toContain('stored-secret')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('classifies a rejected runtime key through the selected model', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
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
      expect(calls).toHaveLength(1)
      expect(calls[0].url).toBe('https://gateway.example/v1/chat/completions')
      expect(calls[0].init.headers.authorization).toBe('Bearer bad-secret')
      expect(JSON.parse(calls[0].init.body).max_tokens).toBe(16)
      expect(JSON.parse(calls[0].init.body).stream).toBe(true)
      expect(JSON.stringify(response.body)).not.toContain('bad-secret')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('identifies a Cloudflare block without calling it an invalid key', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async () => new Response(
      '<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title><link href="/cdn-cgi/styles/cf.errors.css"></head></html>',
      { status: 403, headers: { 'content-type': 'text/html' } },
    ))
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'stored-secret', source: 'file' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', protocol: 'openai-completions', model: 'reasoner' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response.body.value).toMatchObject({
        status: 'blocked', httpStatus: 403,
        message: 'HTTP 403: Cloudflare blocked the provider request before it reached the API; this does not prove the API key is invalid',
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('reports when a valid draft key differs from the failing runtime credential', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return init.headers.authorization === 'Bearer draft-secret'
        ? new Response(JSON.stringify({ id: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response(JSON.stringify({ error: { message: 'API key is invalid' } }), { status: 400, headers: { 'content-type': 'application/json' } })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'runtime-secret', source: 'file' })),
      } }), {
        baseURL: 'https://gateway.example/v1', credentialRef: 'GATEWAY_API_KEY', protocol: 'openai-completions', model: 'reasoner', apiKey: 'draft-secret',
      }, { url: '/model-palette/api/config/credentials/validate' })
      expect(response.body.value).toEqual({
        protocol: 'openai-completions', model: 'reasoner', status: 'invalid', checkedBy: 'request', httpStatus: 400,
        message: 'HTTP 400: API key is invalid', credentialTarget: 'runtime', runtimeConfigured: true,
        credentialSource: 'file', runtimeMatchesDraft: false,
        draft: { status: 'valid', httpStatus: 200, message: 'HTTP 200: minimal model request succeeded' },
      })
      expect(calls).toHaveLength(2)
      expect(JSON.stringify(response.body)).not.toContain('runtime-secret')
      expect(JSON.stringify(response.body)).not.toContain('draft-secret')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('uses Anthropic authentication for message protocol validation', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url, init })
      return new Response('', { status: 200 })
    })
    try {
      const response = await invoke(createModelConfigApiHandler({ credentials: {
        resolve: vi.fn(async () => ({ value: 'anthropic-secret' })),
      } }), { baseURL: 'https://gateway.example/v1', credentialRef: 'ANTHROPIC_API_KEY', protocol: 'anthropic-messages', model: 'claude-test' }, {
        url: '/model-palette/api/config/credentials/validate',
      })
      expect(response.body.value).toMatchObject({ protocol: 'anthropic-messages', status: 'valid', checkedBy: 'request', httpStatus: 200 })
      expect(calls[0].url).toBe('https://gateway.example/v1/messages')
      expect(calls[0].init.headers['x-api-key']).toBe('anthropic-secret')
      expect(calls[0].init.headers.authorization).toBeUndefined()
      expect(calls[0].init.headers['anthropic-version']).toBe('2023-06-01')
      expect(JSON.parse(calls[0].init.body).max_tokens).toBe(16)
      expect(JSON.parse(calls[0].init.body).stream).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
