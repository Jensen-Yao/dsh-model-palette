import { EventEmitter } from 'node:events'
import dns from 'node:dns'
import https from 'node:https'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BAI_HOST_HEADER,
  BAI_RELAY_PATH,
  BAI_UPSTREAM_HOST,
  createBaiRelayHandler,
  createProviderRelayHandler,
  PROVIDER_RELAY_PATH,
} from '../src/bai-relay.js'

function responseRecorder() {
  const response = new EventEmitter()
  response.headersSent = false
  response.writableEnded = false
  response.status = 0
  response.headers = {}
  response.body = ''
  response.writeHead = vi.fn((status, messageOrHeaders, headers) => {
    response.status = status
    response.headers = headers ?? (typeof messageOrHeaders === 'object' ? messageOrHeaders : {})
    response.headersSent = true
  })
  response.write = vi.fn(chunk => { response.body += String(chunk); return true })
  response.end = vi.fn(chunk => {
    if (chunk !== undefined) response.body += String(chunk)
    response.writableEnded = true
  })
  response.destroy = vi.fn()
  return response
}

function requestWith(options = {}) {
  const request = Readable.from(options.body ?? [])
  Object.assign(request, {
    method: options.method ?? 'GET',
    url: options.url ?? `${BAI_RELAY_PATH}/v1/models`,
    headers: options.headers ?? { host: '127.0.0.1:3080' },
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
  })
  return request
}

afterEach(() => vi.restoreAllMocks())

describe('B.AI loopback relay', () => {
  it('forwards local requests with the canonical SNI and B.AI host header', async () => {
    const upstreamRequest = new EventEmitter()
    upstreamRequest.setTimeout = vi.fn()
    upstreamRequest.destroy = vi.fn()
    upstreamRequest.write = vi.fn(() => true)
    upstreamRequest.end = vi.fn()
    const upstreamResponse = Readable.from(['{"error":{"message":"missing key"}}'])
    Object.assign(upstreamResponse, {
      statusCode: 401,
      statusMessage: 'Unauthorized',
      headers: { 'content-type': 'application/json', 'content-length': '34' },
    })
    const requestMock = vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      process.nextTick(() => callback(upstreamResponse))
      return upstreamRequest
    })
    const response = responseRecorder()
    await createBaiRelayHandler()(
      requestWith({ body: ['{}'], headers: { host: '127.0.0.1:3080', authorization: 'Bearer test-secret' } }),
      response,
    )

    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      hostname: BAI_UPSTREAM_HOST,
      servername: BAI_UPSTREAM_HOST,
      path: '/v1/models',
      headers: expect.objectContaining({ host: BAI_HOST_HEADER, authorization: 'Bearer test-secret' }),
    }), expect.any(Function))
    expect(response.status).toBe(401)
    expect(response.body).toContain('missing key')
    expect(response.body).not.toContain('test-secret')
  })

  it('retries ECONNRESET with a fresh socket and the same request body', async () => {
    const requests = []
    const upstreamResponse = Readable.from(['{"data":[]}'])
    Object.assign(upstreamResponse, {
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json' },
    })
    const requestMock = vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn((body) => {
        upstreamRequest.body = body
        if (requests.length === 1) {
          process.nextTick(() => upstreamRequest.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })))
        } else {
          process.nextTick(() => callback(upstreamResponse))
        }
      })
      requests.push({ options, request: upstreamRequest })
      return upstreamRequest
    })
    const response = responseRecorder()
    const body = '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"ping"}]}'

    await createBaiRelayHandler({ upstreamRetries: 1, retryDelaysMs: [0] })(
      requestWith({ method: 'POST', body: [body], headers: { host: '127.0.0.1:3080', 'content-type': 'application/json' } }),
      response,
    )

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(requests[0].options).toMatchObject({ agent: false })
    expect(requests[1].options).toMatchObject({ agent: false })
    expect(requests[0].request.body.equals(requests[1].request.body)).toBe(true)
    expect(response.status).toBe(200)
    expect(response.body).toContain('data')
  })

  it('returns a transient 503 after ECONNRESET retries are exhausted', async () => {
    const requestMock = vi.spyOn(https, 'request').mockImplementation(() => {
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        process.nextTick(() => upstreamRequest.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })))
      })
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({ upstreamRetries: 2, retryDelaysMs: [0] })(requestWith({ method: 'POST', body: ['{}'] }), response)

    expect(requestMock).toHaveBeenCalledTimes(3)
    expect(response.status).toBe(503)
    expect(response.headers).toMatchObject({ 'retry-after': '1' })
    expect(response.body).toContain('UPSTREAM_TRANSIENT')
    expect(response.body).toContain('3 attempts')
  })

  it('switches B.AI connection strategies after an upstream 503', async () => {
    const calls = []
    const responses = [
      { statusCode: 503, statusMessage: 'Service Unavailable', body: '{"message":"temporary upstream failure"}' },
      { statusCode: 503, statusMessage: 'Service Unavailable', body: '{"message":"temporary upstream failure"}' },
      { statusCode: 200, statusMessage: 'OK', body: '{"data":[]}' },
    ]
    const requestMock = vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        const current = responses[calls.length]
        calls.push(options)
        const upstreamResponse = Readable.from([current.body])
        Object.assign(upstreamResponse, {
          statusCode: current.statusCode,
          statusMessage: current.statusMessage,
          headers: { 'content-type': 'application/json' },
        })
        process.nextTick(() => callback(upstreamResponse))
      })
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({ upstreamRetries: 2, retryDelaysMs: [0] })(requestWith({ body: ['{}'] }), response)

    expect(requestMock).toHaveBeenCalledTimes(3)
    expect(calls[0]).toMatchObject({
      hostname: BAI_UPSTREAM_HOST,
      servername: BAI_UPSTREAM_HOST,
      headers: expect.objectContaining({ host: BAI_HOST_HEADER }),
    })
    expect(calls[1]).toMatchObject({
      hostname: BAI_UPSTREAM_HOST,
      servername: BAI_UPSTREAM_HOST,
      headers: expect.objectContaining({ host: BAI_HOST_HEADER }),
    })
    expect(calls[2]).toMatchObject({
      hostname: BAI_HOST_HEADER,
      servername: BAI_HOST_HEADER,
      headers: expect.objectContaining({ host: BAI_HOST_HEADER }),
    })
    expect(response.status).toBe(200)
    expect(response.body).toContain('data')
  })

  it('keeps using the B.AI strategy that succeeded previously', async () => {
    const calls = []
    const requestMock = vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        calls.push(options)
        const upstreamResponse = Readable.from(['{"data":[]}'])
        Object.assign(upstreamResponse, {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'application/json' },
        })
        process.nextTick(() => callback(upstreamResponse))
      })
      return upstreamRequest
    })
    const handler = createBaiRelayHandler({ upstreamRetries: 1, retryDelaysMs: [0] })

    const firstResponse = responseRecorder()
    await handler(requestWith({ body: ['{}'] }), firstResponse)
    const secondResponse = responseRecorder()
    await handler(requestWith({ body: ['{}'] }), secondResponse)

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(calls[0]).toMatchObject({ hostname: BAI_UPSTREAM_HOST })
    expect(calls[1]).toMatchObject({ hostname: BAI_UPSTREAM_HOST })
    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
  })

  it('rotates all DNS addresses while preserving Node lookup callback semantics', async () => {
    const lookup = vi.spyOn(dns, 'lookup').mockImplementation((_host, _options, callback) => {
      callback(null, [
        { address: '192.0.2.10', family: 4 },
        { address: '192.0.2.11', family: 4 },
      ])
    })
    const requests = []
    vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      requests.push(options)
      options.lookup(options.hostname, { all: false }, () => {})
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        const upstreamResponse = Readable.from(['{"data":[]}'])
        Object.assign(upstreamResponse, {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'application/json' },
        })
        process.nextTick(() => callback(upstreamResponse))
      })
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({ upstreamRetries: 0 })(requestWith({ body: ['{}'] }), response)

    expect(lookup).toHaveBeenCalledWith(BAI_UPSTREAM_HOST, { all: true, verbatim: true }, expect.any(Function))
    expect(response.status).toBe(200)
    expect(requests[0]?.lookup).toEqual(expect.any(Function))
  })

  it('starts a B.AI strategy at its configured DNS address index', async () => {
    const lookupResults = []
    vi.spyOn(dns, 'lookup').mockImplementation((_host, _options, callback) => {
      callback(null, [
        { address: '192.0.2.20', family: 4 },
        { address: '192.0.2.21', family: 4 },
      ])
    })
    vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      options.lookup(options.hostname, { all: false }, (error, address, family) => {
        lookupResults.push({ error, address, family })
      })
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        const upstreamResponse = Readable.from(['{"data":[]}'])
        Object.assign(upstreamResponse, {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'application/json' },
        })
        process.nextTick(() => callback(upstreamResponse))
      })
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({
      upstreamRetries: 0,
      strategies: [{
        id: 'same-bai-next-address',
        upstreamHost: BAI_UPSTREAM_HOST,
        hostHeader: BAI_HOST_HEADER,
        tlsServerName: BAI_UPSTREAM_HOST,
        certificateHost: BAI_HOST_HEADER,
        addressIndex: 1,
      }],
    })(requestWith({ body: ['{}'] }), response)

    expect(lookupResults).toEqual([{ error: null, address: '192.0.2.21', family: 4 }])
    expect(response.status).toBe(200)
  })

  it('preserves an upstream HTTP error when replay is disabled', async () => {
    const upstreamRequest = new EventEmitter()
    upstreamRequest.setTimeout = vi.fn()
    upstreamRequest.destroy = vi.fn()
    upstreamRequest.end = vi.fn(() => {
      const upstreamResponse = Readable.from(['{"message":"B.AI unavailable"}'])
      Object.assign(upstreamResponse, {
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        headers: { 'content-type': 'application/json' },
      })
      process.nextTick(() => responseCallback(upstreamResponse))
    })
    let responseCallback
    vi.spyOn(https, 'request').mockImplementation((_options, callback) => {
      responseCallback = callback
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({ upstreamRetries: 0 })(requestWith({ method: 'POST', body: ['{}'] }), response)

    expect(response.status).toBe(503)
    expect(response.body).toContain('B.AI unavailable')
    expect(response.body).not.toContain('UPSTREAM_TRANSIENT')
  })

  it('forwards an oversized non-replayable body once without retrying it', async () => {
    const requestMock = vi.spyOn(https, 'request').mockImplementation(() => {
      const upstreamRequest = new EventEmitter()
      upstreamRequest.setTimeout = vi.fn()
      upstreamRequest.destroy = vi.fn()
      upstreamRequest.end = vi.fn(() => {
        process.nextTick(() => upstreamRequest.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })))
      })
      return upstreamRequest
    })
    const response = responseRecorder()

    await createBaiRelayHandler({ upstreamRetries: 2, retryDelaysMs: [0], retryBodyLimitBytes: 1 })(requestWith({ method: 'POST', body: ['{}'] }), response)

    expect(requestMock).toHaveBeenCalledOnce()
    expect(response.status).toBe(502)
    expect(response.body).toContain('ECONNRESET')
  })

  it('rejects non-loopback requests before contacting B.AI', async () => {
    const requestMock = vi.spyOn(https, 'request')
    const response = responseRecorder()
    await createBaiRelayHandler()(
      requestWith({ remoteAddress: '192.168.1.10' }),
      response,
    )

    expect(response.status).toBe(403)
    expect(response.body).toContain('loopback')
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('creates a configurable fixed-destination provider relay', async () => {
    const upstreamRequest = new EventEmitter()
    upstreamRequest.setTimeout = vi.fn()
    upstreamRequest.destroy = vi.fn()
    upstreamRequest.write = vi.fn(() => true)
    upstreamRequest.end = vi.fn()
    const upstreamResponse = Readable.from(['{"data":[]}'])
    Object.assign(upstreamResponse, {
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json' },
    })
    const requestMock = vi.spyOn(https, 'request').mockImplementation((options, callback) => {
      process.nextTick(() => callback(upstreamResponse))
      return upstreamRequest
    })
    const response = responseRecorder()
    await createProviderRelayHandler('example-provider', {
      upstreamHost: 'reachable-entry.example.net',
      hostHeader: 'api.provider.example',
    })(requestWith({ url: `${PROVIDER_RELAY_PATH}/example-provider/v1/models` }), response)

    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      hostname: 'reachable-entry.example.net',
      servername: 'reachable-entry.example.net',
      path: '/v1/models',
      headers: expect.objectContaining({ host: 'api.provider.example' }),
    }), expect.any(Function))
    expect(response.status).toBe(200)
  })

  it('rejects provider relay paths outside the configured prefix', async () => {
    const requestMock = vi.spyOn(https, 'request')
    const response = responseRecorder()
    await createProviderRelayHandler('example-provider', {
      upstreamHost: 'reachable-entry.example.net',
      hostHeader: 'api.provider.example',
    })(requestWith({ url: `${PROVIDER_RELAY_PATH}/example-provider/admin` }), response)

    expect(response.status).toBe(404)
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('rejects unsafe provider relay configuration at load time', () => {
    expect(() => createProviderRelayHandler('Bad ID', {
      upstreamHost: 'reachable-entry.example.net',
      hostHeader: 'api.provider.example',
    })).toThrow('relay ids')
    expect(() => createProviderRelayHandler('example-provider', {
      upstreamHost: 'https://reachable-entry.example.net',
      hostHeader: 'api.provider.example',
    })).toThrow('DNS hostname')
    expect(() => createProviderRelayHandler('example-provider', {
      upstreamHost: 'reachable-entry.example.net',
      hostHeader: 'api.provider.example',
      allowedPathPrefix: '/',
    })).toThrow('start and end')
    expect(() => createProviderRelayHandler('example-provider', {
      upstreamHost: 'reachable-entry.example.net',
      hostHeader: 'api.provider.example',
      allowedPathPrefix: '/../',
    })).toThrow('traversal')
  })
})
