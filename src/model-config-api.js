const CONFIG_API_PATH = '/model-palette/api/config'
const REQUEST_BODY_LIMIT = 8_192
const CREDENTIAL_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const PROTOCOLS = ['openai-completions', 'openai-responses']

/** Register the loopback-only credential reveal route used by the configuration panel. */
export function registerModelConfigApi(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: CONFIG_API_PATH,
    handler: createModelConfigApiHandler(ctx),
  }), 'dsh-model-palette: model configuration API')
}

/** Create the model-configuration HTTP handler. */
export function createModelConfigApiHandler(ctx) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, error: { message: 'method not allowed' } })
      return
    }
    if (!isTrustedBrowserRequest(req)) {
      writeJson(res, 403, { ok: false, error: { message: 'cross-site request rejected' } })
      return
    }
    if (!String(req.headers['content-type'] ?? '').toLocaleLowerCase().startsWith('application/json')) {
      writeJson(res, 415, { ok: false, error: { message: 'application/json is required' } })
      return
    }
    let pathname
    try {
      pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
    } catch {
      writeJson(res, 400, { ok: false, error: { message: 'invalid request path' } })
      return
    }
    if (pathname === `${CONFIG_API_PATH}/protocols/probe`) {
      await probeProtocols(ctx, req, res)
      return
    }
    if (pathname !== `${CONFIG_API_PATH}/credentials/reveal`) {
      writeJson(res, 404, { ok: false, error: { message: 'unknown configuration action' } })
      return
    }
    if (!isDirectLoopbackRequest(req)) {
      writeJson(res, 403, { ok: false, error: { message: 'credential reveal is available only on direct localhost access' } })
      return
    }
    try {
      const body = await readJsonBody(req)
      const ref = requireCredentialRef(body?.ref)
      const resolved = await ctx.credentials.resolve(ref)
      if (resolved === undefined) {
        writeJson(res, 404, { ok: false, error: { message: `credential ${ref} is not configured` } })
        return
      }
      writeJson(res, 200, { ok: true, value: { value: resolved.value } })
    } catch (error) {
      writeJson(res, 400, { ok: false, error: { message: errorMessage(error) } })
    }
  }
}

async function probeProtocols(ctx, req, res) {
  try {
    const body = await readJsonBody(req)
    const baseURL = requireBaseURL(body?.baseURL)
    const model = requireNonEmptyString(body?.model, 'model')
    const ref = requireCredentialRef(body?.credentialRef)
    const apiKey = optionalApiKey(body?.apiKey) ?? (await ctx.credentials.resolve(ref))?.value
    if (apiKey === undefined) throw new Error(`credential ${ref} is not configured`)
    const results = await Promise.all(PROTOCOLS.map(protocol => probeProtocol(baseURL, model, apiKey, protocol)))
    writeJson(res, 200, { ok: true, value: { results } })
  } catch (error) {
    writeJson(res, 400, { ok: false, error: { message: errorMessage(error) } })
  }
}

async function probeProtocol(baseURL, model, apiKey, protocol) {
  const path = protocol === 'openai-completions' ? '/chat/completions' : '/responses'
  const body = protocol === 'openai-completions'
    ? { model, messages: [{ role: 'user', content: 'Reply only with OK.' }], max_tokens: 1, stream: false }
    : { model, input: 'Reply only with OK.', max_output_tokens: 1 }
  try {
    const response = await fetch(`${baseURL.replace(/\/+$/u, '')}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    if (response.ok) return { protocol, available: true }
    return { protocol, available: false, error: await responseMessage(response) }
  } catch (error) {
    return { protocol, available: false, error: errorMessage(error) }
  }
}

async function responseMessage(response) {
  const text = (await response.text()).slice(0, 240)
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed?.error?.message === 'string') return `HTTP ${response.status}: ${parsed.error.message}`
  } catch {
    // The remote reply is not JSON; its bounded text is the only useful diagnostic.
  }
  return text === '' ? `HTTP ${response.status}` : `HTTP ${response.status}: ${text}`
}

function isTrustedBrowserRequest(req) {
  const site = req.headers['sec-fetch-site']
  return site === undefined || site === 'same-origin' || site === 'same-site' || site === 'none'
}

function isDirectLoopbackRequest(req) {
  if (hasHeader(req, 'forwarded') || hasHeader(req, 'x-forwarded-for') || hasHeader(req, 'cf-connecting-ip')) return false
  const remote = String(req.socket?.remoteAddress ?? '').replace(/^::ffff:/u, '').toLocaleLowerCase()
  if (!isLoopbackHost(remote)) return false
  const host = hostnameOf(req.headers.host)
  if (host === undefined || !isLoopbackHost(host)) return false
  const origin = req.headers.origin
  if (origin !== undefined) {
    const originHost = hostnameOf(origin, true)
    if (originHost === undefined || !isLoopbackHost(originHost)) return false
  }
  const referer = req.headers.referer
  if (origin === undefined && referer !== undefined) {
    const refererHost = hostnameOf(referer, true)
    if (refererHost === undefined || !isLoopbackHost(refererHost)) return false
  }
  return true
}

function hasHeader(req, name) {
  const value = req.headers[name]
  return value !== undefined && String(value).trim() !== ''
}

function hostnameOf(value, absolute = false) {
  if (value === undefined) return undefined
  try {
    return new URL(absolute ? String(value) : `http://${String(value)}`).hostname.toLocaleLowerCase()
  } catch {
    return undefined
  }
}

function isLoopbackHost(value) {
  if (value === 'localhost' || value === '::1' || value === '[::1]') return true
  const match = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(value)
  return match !== null && match.slice(1).every(part => Number(part) <= 255)
}

async function readJsonBody(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (Buffer.byteLength(text) > REQUEST_BODY_LIMIT) throw new Error('request body is too large')
  }
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('request body must be valid JSON')
  }
}

function requireCredentialRef(value) {
  if (typeof value !== 'string' || !CREDENTIAL_PATTERN.test(value)) {
    throw new Error(`credential ref must match ${String(CREDENTIAL_PATTERN)}`)
  }
  return value
}

function requireBaseURL(value) {
  const baseURL = requireNonEmptyString(value, 'baseURL')
  try {
    const parsed = new URL(baseURL)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('baseURL must use http or https')
    return baseURL
  } catch (error) {
    throw new Error(error instanceof Error && error.message === 'baseURL must use http or https'
      ? error.message
      : 'baseURL must be a valid URL')
  }
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required`)
  return value.trim()
}

function optionalApiKey(value) {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || /[\s\x00-\x1F\x7F]/u.test(value)) throw new Error('apiKey is invalid')
  return value
}

function writeJson(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}
