import https from 'node:https'
import tls from 'node:tls'

export const BAI_RELAY_PATH = '/model-palette/api/bai-relay'
export const BAI_HOST_HEADER = 'api.b.ai'
export const BAI_UPSTREAM_HOST = 'a18ccd091ab831ac3.awsglobalaccelerator.com'
export const PROVIDER_RELAY_PATH = '/model-palette/api/relay'
const DEFAULT_TIMEOUT_MS = 180_000
const DEFAULT_ALLOWED_PATH_PREFIX = '/v1/'
const RELAY_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/u
const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu
const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
])
const FORWARDED_HEADERS = new Set([
  'forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip',
])

/** Register the loopback-only B.AI relay used when direct DNS or TLS routing is unavailable. */
export function registerBaiRelay(ctx, rawConfig = {}) {
  const config = resolveConfig(rawConfig, {
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
  }, 'baiRelay')
  if (!config.enabled) return
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: BAI_RELAY_PATH,
    handler: createRelayHandler(BAI_RELAY_PATH, config, 'B.AI'),
  }), 'dsh-model-palette: loopback B.AI relay')
}

/** Register user-configured fixed-destination relays for providers with unreachable canonical routes. */
export function registerProviderRelays(ctx, rawConfig = {}) {
  for (const relay of resolveProviderRelays(rawConfig)) {
    if (!relay.config.enabled) continue
    const path = `${PROVIDER_RELAY_PATH}/${relay.id}`
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path,
      handler: createRelayHandler(path, relay.config, relay.id),
    }), `dsh-model-palette: loopback provider relay ${relay.id}`)
  }
}

/** Create a fixed-destination B.AI relay handler for local DSH provider requests. */
export function createBaiRelayHandler(rawConfig = {}) {
  const config = resolveConfig(rawConfig, {
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
  }, 'baiRelay')
  return createRelayHandler(BAI_RELAY_PATH, config, 'B.AI')
}

/** Create one configurable fixed-destination provider relay handler. */
export function createProviderRelayHandler(id, rawConfig) {
  const relayId = requireRelayId(id)
  const config = resolveConfig(rawConfig, {}, `providerRelays.${relayId}`)
  return createRelayHandler(`${PROVIDER_RELAY_PATH}/${relayId}`, config, relayId)
}

function createRelayHandler(basePath, config, label) {
  return async (req, res) => {
    if (!isLoopbackRequest(req) || hasForwardedHeader(req)) {
      writeJson(res, 403, { ok: false, error: { message: `${label} relay is available only to direct loopback requests` } })
      return
    }
    let parsed
    try {
      parsed = new URL(req.url ?? '/', 'http://dsh.internal')
    } catch {
      writeJson(res, 400, { ok: false, error: { message: 'invalid relay request path' } })
      return
    }
    const relativePath = parsed.pathname.slice(basePath.length)
    if (!relativePath.startsWith(config.allowedPathPrefix)) {
      writeJson(res, 404, { ok: false, error: `${label} relay accepts only ${config.allowedPathPrefix}* paths` })
      return
    }
    await proxyRequest(req, res, config, `${relativePath}${parsed.search}`, label)
  }
}

function resolveProviderRelays(rawConfig) {
  if (rawConfig === undefined) return []
  if (rawConfig === null || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    throw new Error('dsh-model-palette: providerRelays must be an object keyed by relay id')
  }
  return Object.entries(rawConfig).map(([id, config]) => {
    const relayId = requireRelayId(id)
    return { id: relayId, config: resolveConfig(config, {}, `providerRelays.${relayId}`) }
  })
}

function requireRelayId(value) {
  if (typeof value !== 'string' || !RELAY_ID_PATTERN.test(value)) {
    throw new Error('dsh-model-palette: provider relay ids must use lowercase letters, numbers, and hyphens')
  }
  return value
}

function resolveConfig(rawConfig, defaults, label) {
  const value = rawConfig !== null && typeof rawConfig === 'object' ? rawConfig : {}
  const upstreamHost = resolveHost(value.upstreamHost, defaults.upstreamHost, `${label}.upstreamHost`)
  const hostHeader = resolveHost(value.hostHeader, defaults.hostHeader, `${label}.hostHeader`)
  const tlsServerName = resolveHost(value.tlsServerName, upstreamHost, `${label}.tlsServerName`)
  const certificateHost = resolveHost(value.certificateHost, hostHeader, `${label}.certificateHost`)
  const allowedPathPrefix = resolvePathPrefix(value.allowedPathPrefix, `${label}.allowedPathPrefix`)
  const timeoutMs = value.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : value.timeoutMs
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 900_000) {
    throw new Error(`dsh-model-palette: ${label}.timeoutMs must be an integer from 1000 to 900000`)
  }
  return {
    enabled: value.enabled !== false,
    upstreamHost,
    hostHeader,
    tlsServerName,
    certificateHost,
    allowedPathPrefix,
    timeoutMs,
  }
}

function resolveHost(value, fallback, label) {
  const candidate = typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
  if (typeof candidate !== 'string' || !HOST_PATTERN.test(candidate)) {
    throw new Error(`dsh-model-palette: ${label} must be a valid DNS hostname`)
  }
  return candidate.toLocaleLowerCase()
}

function resolvePathPrefix(value, label) {
  const prefix = value === undefined ? DEFAULT_ALLOWED_PATH_PREFIX : value
  if (typeof prefix !== 'string' || prefix === '/' || !prefix.startsWith('/') || !prefix.endsWith('/') || prefix.includes('..') || prefix.includes('?') || prefix.includes('#')) {
    throw new Error(`dsh-model-palette: ${label} must start and end with / and contain no traversal or query characters`)
  }
  return prefix
}

function isLoopbackRequest(req) {
  const address = req.socket?.remoteAddress
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function hasForwardedHeader(req) {
  return Object.keys(req.headers ?? {}).some(name => FORWARDED_HEADERS.has(name.toLocaleLowerCase()))
}

async function proxyRequest(req, res, config, path, label) {
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
      servername: config.tlsServerName,
      checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(config.certificateHost, certificate),
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
      if (!res.headersSent) writeJson(res, errorCode(error), { ok: false, error: { message: `${label} relay failed: ${errorMessage(error)}` } })
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
