import { EventEmitter } from 'node:events'
import https from 'node:https'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BAI_HOST_HEADER,
  BAI_RELAY_PATH,
  BAI_UPSTREAM_HOST,
  createBaiRelayHandler,
} from '../src/bai-relay.js'

function responseRecorder() {
  const response = new EventEmitter()
  response.headersSent = false
  response.writableEnded = false
  response.status = 0
  response.headers = {}
  response.body = ''
  response.writeHead = vi.fn((status, _message, headers) => {
    response.status = status
    response.headers = headers ?? {}
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
})
