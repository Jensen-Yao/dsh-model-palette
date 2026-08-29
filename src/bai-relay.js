import https from 'node:https'
import tls from 'node:tls'

export const BAI_RELAY_PATH = '/model-palette/api/bai-relay'
export const BAI_HOST_HEADER = 'api.b.ai'
export const BAI_UPSTREAM_HOST = 'a18ccd091ab831ac3.awsglobalaccelerator.com'
const DEFAULT_TIMEOUT_MS = 180_000
const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
])
const FORWARDED_HEADERS = new Set([
  'forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip',
])

/** Register the loopback-only B.AI relay used when direct DNS or TLS routing is unavailable. */
export function registerBaiRelay(ctx, rawConfig = {}) {
  const config = resolveConfig(rawConfig)
  if (!config.enabled) return
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: BAI_RELAY_PATH,
    handler: createBaiRelayHandler(config),
  }), 'dsh-model-palette: loopback B.AI relay')
}

/** Create a fixed-destination B.AI relay handler for local DSH provider requests. */
export function createBaiRelayHandler(rawConfig = {}) {
  const config = resolveConfig(rawConfig)
  return async (req, res) => {
    if (!isLoopbackRequest(req) || hasForwardedHeader(req)) {
      writeJson(res, 403, { ok: false, error: { message: 'B.AI relay is available only to direct loopback requests' } })
      return
    }
    let parsed
    try {
      parsed = new URL(req.url ?? '/', 'http://dsh.internal')
    } catch {
      writeJson(res, 400, { ok: false, error: { message: 'invalid relay request path' } })
      return
    }
    const relativePath = parsed.pathname.slice(BAI_RELAY_PATH.length)
    if (!relativePath.startsWith('/v1/')) {
      writeJson(res, 404, { ok: false, error: 'B.AI relay accepts only /v1/* paths' })
      return
    }
    await proxyRequest(req, res, config, `${relativePath}${parsed.search}`)
  }
}

function resolveConfig(rawConfig) {
  const value = rawConfig !== null && typeof rawConfig === 'object' ? rawConfig : {}
  const upstreamHost = typeof value.upstreamHost === 'string' && /^[a-z0-9.-]+$/iu.test(value.upstreamHost)
    ? value.upstreamHost
    : BAI_UPSTREAM_HOST
  const hostHeader = typeof value.hostHeader === 'string' && /^[a-z0-9.-]+$/iu.test(value.hostHeader)
    ? value.hostHeader
    : BAI_HOST_HEADER
  const timeoutMs = value.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : value.timeoutMs
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 900_000) {
    throw new Error('dsh-model-palette: baiRelay.timeoutMs must be an integer from 1000 to 900000')
  }
  return {
    enabled: value.enabled !== false,
    upstreamHost,
    hostHeader,
    timeoutMs,
  }
}

function isLoopbackRequest(req) {
  const address = req.socket?.remoteAddress
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function hasForwardedHeader(req) {
  return Object.keys(req.headers ?? {}).some(name => FORWARDED_HEADERS.has(name.toLocaleLowerCase()))
}

async function proxyRequest(req, res, config, path) {
  await new Promise((resolve) => {
    let finished = false
    let upstreamResponseReceived = false
    const headers = forwardRequestHeaders(req.headers ?? {}, config.hostHeader)
    const upstreamRequest = https.request({
      hostname: config.upstreamHost,
      port: 443,
      method: req.method,
      path,
      headers,
      servername: config.upstreamHost,
      checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(config.hostHeader, certificate),
    }, (upstreamResponse) => {
      upstreamResponseReceived = true
      if (!res.headersSent) {
        res.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers))
      }
      upstreamResponse.once('error', error => fail(error))
      upstreamResponse.once('end', finish)
      upstreamResponse.pipe(res)
    })

    const abort = () => {
      if (!finished) upstreamRequest.destroy(new Error('B.AI relay client disconnected'))
    }
    const finish = () => {
      if (finished) return
      finished = true
      req.removeListener('aborted', abort)
      res.removeListener('close', close)
      resolve()
    }
    const fail = (error) => {
      if (finished) return
      if (!res.headersSent) writeJson(res, errorCode(error), { ok: false, error: { message: `B.AI relay failed: ${errorMessage(error)}` } })
      else if (!res.writableEnded) res.destroy(error)
      finish()
    }
    const close = () => {
      if (!res.writableEnded && !finished) abort()
    }

    upstreamRequest.once('error', error => {
      if (!upstreamResponseReceived) fail(error)
      else finish()
    })
    upstreamRequest.setTimeout(config.timeoutMs, () => {
      const error = new Error(`upstream idle timeout after ${config.timeoutMs}ms`)
      error.code = 'ETIMEDOUT'
      upstreamRequest.destroy(error)
    })
    req.once('aborted', abort)
    res.once('close', close)
    req.pipe(upstreamRequest)
  })
}

function forwardRequestHeaders(input, hostHeader) {
  const headers = {}
  for (const [name, value] of Object.entries(input)) {
    const lower = name.toLocaleLowerCase()
    if (lower === 'host' || HOP_BY_HOP_HEADERS.has(lower) || FORWARDED_HEADERS.has(lower)) continue
    if (typeof value === 'string') headers[name] = value
    else if (Array.isArray(value)) headers[name] = value.join(', ')
  }
  headers.host = hostHeader
  return headers
}

function filterResponseHeaders(input) {
  return Object.fromEntries(Object.entries(input).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name.toLocaleLowerCase())))
}

function errorCode(error) {
  return error?.code === 'ETIMEDOUT' ? 504 : 502
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function writeJson(res, status, value) {
  if (res.headersSent) return
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}
