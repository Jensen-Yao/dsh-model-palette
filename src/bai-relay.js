import dns from 'node:dns'
import https from 'node:https'
import tls from 'node:tls'

export const BAI_RELAY_PATH = '/model-palette/api/bai-relay'
export const BAI_HOST_HEADER = 'api.b.ai'
export const BAI_UPSTREAM_HOST = 'a18ccd091ab831ac3.awsglobalaccelerator.com'
export const PROVIDER_RELAY_PATH = '/model-palette/api/relay'
const DEFAULT_TIMEOUT_MS = 180_000
const DEFAULT_ALLOWED_PATH_PREFIX = '/v1/'
const DEFAULT_UPSTREAM_RETRIES = 2
const DEFAULT_RETRY_DELAYS_MS = [250, 1_000]
const DEFAULT_RETRY_BODY_LIMIT_BYTES = 16 * 1024 * 1024
const MAX_UPSTREAM_RETRIES = 10
const MAX_RETRY_DELAY_MS = 60_000
const MAX_RETRY_BODY_LIMIT_BYTES = 64 * 1024 * 1024
const MAX_STRATEGIES = 12
const MAX_ADDRESS_INDEX = 64
const MAX_FAILURE_BODY_BYTES = 1 * 1024 * 1024
const RELAY_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/u
const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu
const CLOUDFLARE_BLOCK_PATTERN = /(?:Attention Required!\s*\|\s*Cloudflare|\bCloudflare\b|cf-error-details|cdn-cgi\/styles\/cf\.errors\.css)/iu
const RETRYABLE_UPSTREAM_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH',
  'ETIMEDOUT', 'EPIPE', 'ENOTFOUND', 'ENODATA', 'ERR_STREAM_PREMATURE_CLOSE',
])
const FAILOVER_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
])
const FORWARDED_HEADERS = new Set([
  'forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip',
])
const DEFAULT_BAI_STRATEGIES = [
  {
    id: 'aws-global-accelerator',
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
    tlsServerName: BAI_UPSTREAM_HOST,
    certificateHost: BAI_HOST_HEADER,
    addressIndex: 0,
  },
  {
    id: 'aws-global-accelerator-next-address',
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
    tlsServerName: BAI_UPSTREAM_HOST,
    certificateHost: BAI_HOST_HEADER,
    addressIndex: 1,
  },
  {
    id: 'direct-api',
    upstreamHost: BAI_HOST_HEADER,
    hostHeader: BAI_HOST_HEADER,
    tlsServerName: BAI_HOST_HEADER,
    certificateHost: BAI_HOST_HEADER,
    addressIndex: 0,
  },
]

/** Register the loopback-only B.AI relay used when direct DNS or TLS routing is unavailable. */
export function registerBaiRelay(ctx, rawConfig = {}) {
  const config = resolveConfig(rawConfig, {
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
    strategies: DEFAULT_BAI_STRATEGIES,
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

/** Create a same-provider B.AI relay handler for local DSH provider requests. */
export function createBaiRelayHandler(rawConfig = {}) {
  const config = resolveConfig(rawConfig, {
    upstreamHost: BAI_UPSTREAM_HOST,
    hostHeader: BAI_HOST_HEADER,
    strategies: DEFAULT_BAI_STRATEGIES,
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
  const runtime = {
    preferredStrategy: 0,
    addressIndexes: config.strategies.map(strategy => strategy.addressIndex),
  }
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
    await proxyRequest(req, res, config, `${relativePath}${parsed.search}`, label, runtime)
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
  const hasLegacyRoute = ['upstreamHost', 'hostHeader', 'tlsServerName', 'certificateHost'].some(key => Object.hasOwn(value, key))
  const legacyRoute = {
    upstreamHost: value.upstreamHost ?? defaults.upstreamHost,
    hostHeader: value.hostHeader ?? defaults.hostHeader,
    tlsServerName: value.tlsServerName ?? value.upstreamHost ?? defaults.upstreamHost,
    certificateHost: value.certificateHost ?? value.hostHeader ?? defaults.hostHeader,
  }
  const routeDefaults = hasLegacyRoute ? [{ id: 'configured' }] : (defaults.strategies ?? [{ id: 'configured' }])
  const rawStrategies = value.strategies ?? routeDefaults
  const strategies = resolveStrategies(rawStrategies, legacyRoute, label)
  const primary = strategies[0]
  const upstreamHost = primary.upstreamHost
  const hostHeader = primary.hostHeader
  const tlsServerName = primary.tlsServerName
  const certificateHost = primary.certificateHost
  const allowedPathPrefix = resolvePathPrefix(value.allowedPathPrefix, `${label}.allowedPathPrefix`)
  const timeoutMs = value.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : value.timeoutMs
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 900_000) {
    throw new Error(`dsh-model-palette: ${label}.timeoutMs must be an integer from 1000 to 900000`)
  }
  const upstreamRetries = value.upstreamRetries === undefined ? DEFAULT_UPSTREAM_RETRIES : value.upstreamRetries
  if (!Number.isInteger(upstreamRetries) || upstreamRetries < 0 || upstreamRetries > MAX_UPSTREAM_RETRIES) {
    throw new Error(`dsh-model-palette: ${label}.upstreamRetries must be an integer from 0 to ${MAX_UPSTREAM_RETRIES}`)
  }
  const retryDelaysMs = resolveRetryDelays(value.retryDelaysMs, `${label}.retryDelaysMs`)
  const retryBodyLimitBytes = value.retryBodyLimitBytes === undefined ? DEFAULT_RETRY_BODY_LIMIT_BYTES : value.retryBodyLimitBytes
  if (!Number.isInteger(retryBodyLimitBytes) || retryBodyLimitBytes < 0 || retryBodyLimitBytes > MAX_RETRY_BODY_LIMIT_BYTES) {
    throw new Error(`dsh-model-palette: ${label}.retryBodyLimitBytes must be an integer from 0 to ${MAX_RETRY_BODY_LIMIT_BYTES}`)
  }
  return {
    enabled: value.enabled !== false,
    upstreamHost,
    hostHeader,
    tlsServerName,
    certificateHost,
    strategies,
    allowedPathPrefix,
    timeoutMs,
    upstreamRetries,
    retryDelaysMs,
    retryBodyLimitBytes,
  }
}

function resolveStrategies(rawStrategies, legacyRoute, label) {
  if (!Array.isArray(rawStrategies) || rawStrategies.length === 0 || rawStrategies.length > MAX_STRATEGIES) {
    throw new Error(`dsh-model-palette: ${label}.strategies must contain 1 to ${MAX_STRATEGIES} entries`)
  }
  const ids = new Set()
  return rawStrategies.map((rawStrategy, index) => {
    const value = rawStrategy !== null && typeof rawStrategy === 'object' ? rawStrategy : {}
    const id = typeof value.id === 'string' && value.id.trim() !== '' ? value.id.trim() : `strategy-${index + 1}`
    if (!RELAY_ID_PATTERN.test(id) || ids.has(id)) {
      throw new Error(`dsh-model-palette: ${label}.strategies contains an invalid or duplicate id`)
    }
    ids.add(id)
    const upstreamHost = resolveHost(
      value.upstreamHost,
      index === 0 ? legacyRoute.upstreamHost : undefined,
      `${label}.strategies[${index}].upstreamHost`,
    )
    const hostHeader = resolveHost(
      value.hostHeader,
      index === 0 ? legacyRoute.hostHeader : undefined,
      `${label}.strategies[${index}].hostHeader`,
    )
    const tlsServerName = resolveHost(
      value.tlsServerName,
      index === 0 ? legacyRoute.tlsServerName : upstreamHost,
      `${label}.strategies[${index}].tlsServerName`,
    )
    const certificateHost = resolveHost(
      value.certificateHost,
      index === 0 ? legacyRoute.certificateHost : hostHeader,
      `${label}.strategies[${index}].certificateHost`,
    )
    const addressIndex = value.addressIndex === undefined ? 0 : value.addressIndex
    if (!Number.isInteger(addressIndex) || addressIndex < 0 || addressIndex > MAX_ADDRESS_INDEX) {
      throw new Error(`dsh-model-palette: ${label}.strategies[${index}].addressIndex must be an integer from 0 to ${MAX_ADDRESS_INDEX}`)
    }
    return { id, upstreamHost, hostHeader, tlsServerName, certificateHost, addressIndex }
  })
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

async function proxyRequest(req, res, config, path, label, runtime) {
  let body
  try {
    body = await readRequestBody(req, MAX_RETRY_BODY_LIMIT_BYTES)
  } catch (error) {
    if (error?.code === 'REQUEST_BODY_TOO_LARGE') {
      writeJson(res, 413, { ok: false, error: { code: error.code, message: error.message } })
    } else if (!req.aborted && !res.writableEnded) {
      writeJson(res, 400, { ok: false, error: { message: `${label} relay could not read the request body` } })
    }
    return
  }

  const canReplay = body.length <= config.retryBodyLimitBytes
  let lastFailure
  const attemptedStrategies = []
  let strategyIndex = runtime.preferredStrategy
  let lastSelectedIndex = strategyIndex
  const attempts = config.upstreamRetries + 1
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (req.aborted || res.writableEnded) return
    const selectedIndex = strategyIndex % config.strategies.length
    lastSelectedIndex = selectedIndex
    const strategy = config.strategies[selectedIndex]
    attemptedStrategies.push(strategy.id)
    const result = await sendUpstreamRequest(req, res, config, path, body, label, strategy, runtime.addressIndexes[selectedIndex], nextIndex => {
      runtime.addressIndexes[selectedIndex] = nextIndex
    })
    if (result.ok) {
      runtime.preferredStrategy = selectedIndex
      return
    }
    if (result.clientDisconnected) return
    lastFailure = result.error
    if (!canReplay || !isFailoverFailure(result.error) || attempt >= attempts - 1 || res.headersSent) break
    strategyIndex = (selectedIndex + 1) % config.strategies.length
    const delayMs = config.retryDelaysMs[Math.min(attempt, config.retryDelaysMs.length - 1)]
    if (!await waitForRetry(delayMs, req, res)) return
  }

  if (res.headersSent || res.writableEnded || req.aborted) return
  if (canReplay && isFailoverFailure(lastFailure) && config.upstreamRetries > 0) {
    runtime.preferredStrategy = (lastSelectedIndex + 1) % config.strategies.length
    writeJson(res, 503, {
      ok: false,
      error: {
        code: 'UPSTREAM_TRANSIENT',
        message: `${label} relay could not reach the upstream after ${attempts} attempts across connection strategies (${attemptedStrategies.join(', ')}): ${errorMessage(lastFailure)}`,
      },
    }, { 'retry-after': '1' })
    return
  }
  if (hasBufferedResponse(lastFailure)) {
    res.writeHead(lastFailure.status, lastFailure.statusMessage, lastFailure.headers)
    res.end(lastFailure.responseBody)
    return
  }
  writeJson(res, errorCode(lastFailure), { ok: false, error: { message: `${label} relay failed: ${errorMessage(lastFailure)}` } })
}

async function readRequestBody(req, limitBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > limitBytes) {
      const error = new Error(`request body exceeds relay body safety limit (${limitBytes})`)
      error.code = 'REQUEST_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(buffer)
  }
  return Buffer.concat(chunks, size)
}

function sendUpstreamRequest(req, res, config, path, body, label, strategy, addressIndex, onAddressIndex) {
  return new Promise((resolve) => {
    let finished = false
    let upstreamResponseReceived = false
    let responseEnded = false
    const headers = forwardRequestHeaders(req.headers ?? {}, strategy.hostHeader, body.length)
    const upstreamRequest = https.request({
      agent: false,
      hostname: strategy.upstreamHost,
      port: 443,
      method: req.method,
      path,
      headers,
      servername: strategy.tlsServerName,
      lookup: createRotatingLookup(strategy.upstreamHost, addressIndex, nextAddressIndex => {
        onAddressIndex(nextAddressIndex)
      }),
      checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(strategy.certificateHost, certificate),
    }, (upstreamResponse) => {
      upstreamResponseReceived = true
      const status = upstreamResponse.statusCode ?? 502
      if (isFailoverStatus(status) || status === 403) {
        void collectFailureResponse(upstreamResponse).then(({ body: responseBody, error }) => {
          if (error !== undefined) {
            finish({
              ok: false,
              error: {
                code: error.code,
                message: errorMessage(error),
                status,
                statusMessage: upstreamResponse.statusMessage,
                headers: filterResponseHeaders(upstreamResponse.headers),
                responseBody,
              },
              responseReceived: true,
            })
            return
          }
          const responseText = responseBody.toString('utf8')
          const cloudflare = isCloudflareResponse(status, upstreamResponse.headers, responseText)
          if (!isFailoverStatus(status) && !cloudflare) {
            if (!res.headersSent) {
              res.writeHead(status, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers))
              res.end(responseBody)
            }
            finish({ ok: true, responseReceived: true })
            return
          }
          finish({
            ok: false,
            error: {
              status,
              statusMessage: upstreamResponse.statusMessage,
              headers: filterResponseHeaders(upstreamResponse.headers),
              code: 'UPSTREAM_HTTP',
              message: responseFailureMessage(status, responseText),
              responseBody: responseText,
              cloudflare,
            },
            responseReceived: true,
          })
        })
        return
      }
      if (!res.headersSent) {
        res.writeHead(status, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers))
      }
      upstreamResponse.once('error', failResponse)
      upstreamResponse.once('aborted', () => failResponse(new Error('upstream response aborted')))
      upstreamResponse.once('close', () => {
        if (!responseEnded) failResponse(new Error('upstream response closed before end'))
      })
      upstreamResponse.once('end', () => {
        responseEnded = true
        finish({ ok: true })
      })
      upstreamResponse.pipe(res)
    })

    const abort = () => {
      if (!finished) {
        const error = new Error(`${label} relay client disconnected`)
        error.code = 'CLIENT_DISCONNECTED'
        upstreamRequest.destroy(error)
      }
    }
    const close = () => {
      if (!res.writableEnded && !finished) abort()
    }
    const finish = (result) => {
      if (finished) return
      finished = true
      req.removeListener('aborted', abort)
      res.removeListener('close', close)
      resolve(result)
    }
    const failResponse = (error) => {
      if (finished) return
      if (res.headersSent && !res.writableEnded) res.destroy(error)
      finish({ ok: false, error, responseReceived: true })
    }

    upstreamRequest.once('error', (error) => {
      if (finished) return
      if (upstreamResponseReceived && res.headersSent && !res.writableEnded) res.destroy(error)
      finish({ ok: false, error, responseReceived: upstreamResponseReceived, clientDisconnected: error?.code === 'CLIENT_DISCONNECTED' })
    })
    upstreamRequest.setTimeout(config.timeoutMs, () => {
      const error = new Error(`upstream idle timeout after ${config.timeoutMs}ms`)
      error.code = 'ETIMEDOUT'
      upstreamRequest.destroy(error)
    })
    req.once('aborted', abort)
    res.once('close', close)
    upstreamRequest.end(body)
  })
}

function resolveRetryDelays(value, label) {
  const delays = value === undefined ? DEFAULT_RETRY_DELAYS_MS : value
  if (!Array.isArray(delays) || delays.length === 0 || delays.some((delay) => !Number.isInteger(delay) || delay < 0 || delay > MAX_RETRY_DELAY_MS)) {
    throw new Error(`dsh-model-palette: ${label} must be a non-empty array of integers from 0 to ${MAX_RETRY_DELAY_MS}`)
  }
  return [...delays]
}

function isRetryableUpstreamError(error) {
  const code = typeof error?.code === 'string' ? error.code.toLocaleUpperCase() : ''
  if (RETRYABLE_UPSTREAM_CODES.has(code)) return true
  return errorMessage(error).toLocaleLowerCase().includes('socket hang up')
}

function isFailoverFailure(error) {
  return isRetryableUpstreamError(error) || isFailoverStatus(error?.status) || error?.cloudflare === true
}

function isFailoverStatus(status) {
  return typeof status === 'number' && (FAILOVER_STATUSES.has(status) || (status >= 500 && status <= 599))
}

function isCloudflareResponse(status, headers = {}, body = '') {
  if (status !== 403) return false
  const contentType = Object.entries(headers).find(([name]) => name.toLocaleLowerCase() === 'content-type')?.[1]
  const server = Object.entries(headers).find(([name]) => name.toLocaleLowerCase() === 'server')?.[1]
  return CLOUDFLARE_BLOCK_PATTERN.test(String(body)) || (CLOUDFLARE_BLOCK_PATTERN.test(String(server)) && /text\/html/iu.test(String(contentType ?? '')))
}

function hasBufferedResponse(error) {
  return Number.isInteger(error?.status) && (typeof error?.responseBody === 'string' || Buffer.isBuffer(error?.responseBody))
}

function collectFailureResponse(response) {
  return new Promise((resolve) => {
    const chunks = []
    let size = 0
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    response.on('data', chunk => {
      if (size >= MAX_FAILURE_BODY_BYTES) return
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      const remaining = MAX_FAILURE_BODY_BYTES - size
      chunks.push(buffer.subarray(0, remaining))
      size += Math.min(buffer.length, remaining)
    })
    response.once('error', error => finish({ body: Buffer.alloc(0), error }))
    response.once('aborted', () => finish({ body: Buffer.concat(chunks, size), error: prematureCloseError() }))
    response.once('end', () => finish({ body: Buffer.concat(chunks, size) }))
    response.once('close', () => {
      if (!settled) finish({ body: Buffer.concat(chunks, size), error: prematureCloseError() })
    })
  })
}

function prematureCloseError() {
  const error = new Error('upstream response closed before end')
  error.code = 'ERR_STREAM_PREMATURE_CLOSE'
  return error
}

function responseFailureMessage(status, body) {
  const detail = body.trim().replace(/\s+/gu, ' ').slice(0, 300)
  return detail === '' ? `upstream returned HTTP ${status}` : `upstream returned HTTP ${status}: ${detail}`
}

function createRotatingLookup(host, initialIndex, onIndex) {
  return (_hostname, options = {}, callback) => {
    dns.lookup(host, { all: true, verbatim: true }, (error, addresses) => {
      if (error) {
        callback(error)
        return
      }
      const values = Array.isArray(addresses) ? addresses.filter(address => address && typeof address.address === 'string') : []
      if (values.length === 0) {
        callback(new Error(`DNS lookup returned no addresses for ${host}`))
        return
      }
      const start = ((initialIndex % values.length) + values.length) % values.length
      const ordered = values.slice(start).concat(values.slice(0, start))
      onIndex((start + 1) % values.length)
      if (options?.all === true) {
        callback(null, ordered)
        return
      }
      callback(null, ordered[0].address, ordered[0].family)
    })
  }
}

function waitForRetry(delayMs, req, res) {
  if (req.aborted || res.writableEnded) return Promise.resolve(false)
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      req.removeListener('aborted', abort)
      res.removeListener('close', abort)
      resolve(value)
    }
    const abort = () => finish(false)
    const timer = setTimeout(() => finish(true), delayMs)
    req.once('aborted', abort)
    res.once('close', abort)
  })
}

function forwardRequestHeaders(input, hostHeader, bodyLength) {
  const headers = {}
  for (const [name, value] of Object.entries(input)) {
    const lower = name.toLocaleLowerCase()
    if (lower === 'host' || lower === 'content-length' || HOP_BY_HOP_HEADERS.has(lower) || FORWARDED_HEADERS.has(lower)) continue
    if (typeof value === 'string') headers[name] = value
    else if (Array.isArray(value)) headers[name] = value.join(', ')
  }
  headers.host = hostHeader
  headers['content-length'] = String(bodyLength)
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

function writeJson(res, status, value, headers = {}) {
  if (res.headersSent) return
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers })
  res.end(JSON.stringify(value))
}
