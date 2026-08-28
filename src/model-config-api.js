const CONFIG_API_PATH = '/model-palette/api/config'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const REQUEST_BODY_LIMIT = 65_536
const PROBE_MAX_OUTPUT_TOKENS = 16
const CATALOG_TIMEOUT_MS = 20_000
const BATCH_PROVIDER_LIMIT = 100
const DIAGNOSTIC_LENGTH_LIMIT = 240
const CLOUDFLARE_BLOCK_PATTERN = /(?:Attention Required!\s*\|\s*Cloudflare|cdn-cgi\/styles\/cf\.errors\.css|cf-error-details)/iu
const CREDENTIAL_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const PROTOCOLS = ['openai-completions', 'openai-responses']
const API_KEY_PROTOCOLS = ['openai-completions', 'openai-responses', 'anthropic-messages']

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
    if (pathname === `${CONFIG_API_PATH}/credentials/validate`) {
      await validateApiKey(ctx, req, res)
      return
    }
    if (pathname === `${CONFIG_API_PATH}/credentials/validate-batch`) {
      await validateApiKeysBatch(ctx, req, res)
      return
    }
    if (pathname === `${CONFIG_API_PATH}/models/openrouter/free`) {
      await listOpenRouterFreeModels(res)
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

async function listOpenRouterFreeModels(res) {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        'accept': 'application/json',
        'user-agent': 'DSH-Model-Palette/0.7',
      },
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(await responseMessage(response))
    const payload = await response.json()
    const models = parseOpenRouterFreeModels(payload)
    writeJson(res, 200, { ok: true, value: { checkedAt: new Date().toISOString(), models } })
  } catch (error) {
    writeJson(res, 502, { ok: false, error: { message: `OpenRouter model catalog failed: ${errorMessage(error)}` } })
  }
}

/** Convert the public OpenRouter catalog into DSH-compatible free text-model candidates. */
export function parseOpenRouterFreeModels(value) {
  if (value === null || typeof value !== 'object' || !Array.isArray(value.data)) {
    throw new Error('OpenRouter returned an invalid model catalog')
  }
  const models = []
  const seen = new Set()
  for (const entry of value.data) {
    if (entry === null || typeof entry !== 'object') continue
    const id = typeof entry.id === 'string' ? entry.id.trim() : ''
    if (!id.toLocaleLowerCase().endsWith(':free') || seen.has(id)) continue
    const architecture = entry.architecture !== null && typeof entry.architecture === 'object' ? entry.architecture : {}
    const output = stringArray(architecture.output_modalities)
    if (output.length > 0 && !output.includes('text')) continue
    const input = stringArray(architecture.input_modalities).filter(modality => modality === 'text' || modality === 'image')
    if (input.length === 0) continue
    const topProvider = entry.top_provider !== null && typeof entry.top_provider === 'object' ? entry.top_provider : {}
    const contextWindow = positiveInteger(entry.context_length)
    const maxTokens = positiveInteger(topProvider.max_completion_tokens)
    models.push({
      id,
      ...(typeof entry.name === 'string' && entry.name.trim() !== '' ? { name: entry.name.trim() } : {}),
      ...(contextWindow === undefined ? {} : { contextWindow }),
      ...(maxTokens === undefined ? {} : { maxTokens }),
      input,
      free: true,
    })
    seen.add(id)
  }
  return models
}

function stringArray(value) {
  return Array.isArray(value) ? [...new Set(value.filter(entry => typeof entry === 'string'))] : []
}

function positiveInteger(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined
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

async function validateApiKey(ctx, req, res) {
  try {
    const body = await readJsonBody(req)
    const baseURL = requireBaseURL(body?.baseURL)
    const protocol = requireProtocol(body?.protocol)
    const model = requireNonEmptyString(body?.model, 'model')
    const ref = requireCredentialRef(body?.credentialRef)
    const draftApiKey = optionalApiKey(body?.apiKey)
    const resolved = await ctx.credentials.resolve(ref)
    const runtimeApiKey = optionalApiKey(resolved?.value)
    if (runtimeApiKey === undefined && draftApiKey === undefined) throw new Error(`credential ${ref} is not configured`)
    const result = await validateCredential(baseURL, protocol, model, runtimeApiKey, draftApiKey, resolved?.source)
    writeJson(res, 200, { ok: true, value: result })
  } catch (error) {
    writeJson(res, 400, { ok: false, error: { message: errorMessage(error) } })
  }
}

async function validateApiKeysBatch(ctx, req, res) {
  try {
    const body = await readJsonBody(req)
    const providers = requireBatchProviders(body?.providers)
    const results = []
    for (const provider of providers) {
      let model = provider.model
      if (model === '') {
        try {
          model = (await ctx.llm.listModels(provider.provider))[0]?.id ?? ''
        } catch (error) {
          results.push({
            ...provider,
            status: 'unknown',
            checkedBy: 'request',
            message: `could not resolve a runtime model for provider ${provider.provider}: ${errorMessage(error)}`,
          })
          continue
        }
        if (model === '') {
          results.push({
            ...provider,
            status: 'unknown',
            checkedBy: 'request',
            message: `provider ${provider.provider} exposes no model for a live credential check`,
          })
          continue
        }
      }
      const resolved = await ctx.credentials.resolve(provider.credentialRef)
      const apiKey = optionalApiKey(resolved?.value)
      if (apiKey === undefined) {
        results.push({
          ...provider,
          status: 'missing',
          checkedBy: 'request',
          message: `credential ${provider.credentialRef} is not configured`,
        })
        continue
      }
      const result = await validateModelRequest(provider.baseURL, provider.protocol, model, apiKey)
      results.push({
        ...provider,
        model,
        ...result,
        ...(resolved?.source === undefined ? {} : { credentialSource: resolved.source }),
      })
    }
    writeJson(res, 200, { ok: true, value: { results } })
  } catch (error) {
    writeJson(res, 400, { ok: false, error: { message: errorMessage(error) } })
  }
}

async function probeProtocol(baseURL, model, apiKey, protocol) {
  const path = protocol === 'openai-completions' ? '/chat/completions' : '/responses'
  const body = protocol === 'openai-completions'
    ? { model, messages: [{ role: 'user', content: 'Reply only with OK.' }], max_tokens: PROBE_MAX_OUTPUT_TOKENS, stream: true }
    : { model, input: 'Reply only with OK.', max_output_tokens: PROBE_MAX_OUTPUT_TOKENS, stream: true }
  try {
    const response = await fetch(`${baseURL.replace(/\/+$/u, '')}${path}`, {
      method: 'POST',
      headers: headersForProtocol(apiKey, protocol, true),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    if (response.ok) return { protocol, available: true }
    return { protocol, available: false, error: await responseMessage(response, apiKey) }
  } catch (error) {
    return { protocol, available: false, error: errorMessage(error, apiKey) }
  }
}

async function validateCredential(baseURL, protocol, model, runtimeApiKey, draftApiKey, credentialSource) {
  if (runtimeApiKey === undefined) {
    const draftResult = await validateModelRequest(baseURL, protocol, model, draftApiKey)
    return { ...draftResult, credentialTarget: 'draft', runtimeConfigured: false }
  }
  const runtimeResult = await validateModelRequest(baseURL, protocol, model, runtimeApiKey)
  if (draftApiKey === undefined || draftApiKey === runtimeApiKey) {
    return {
      ...runtimeResult,
      credentialTarget: 'runtime',
      runtimeConfigured: true,
      ...(credentialSource === undefined ? {} : { credentialSource }),
      ...(draftApiKey === undefined ? {} : { runtimeMatchesDraft: true }),
    }
  }
  const draftResult = await validateModelRequest(baseURL, protocol, model, draftApiKey)
  return {
    ...runtimeResult,
    credentialTarget: 'runtime',
    runtimeConfigured: true,
    ...(credentialSource === undefined ? {} : { credentialSource }),
    runtimeMatchesDraft: false,
    draft: validationAttempt(draftResult),
  }
}

async function validateModelRequest(baseURL, protocol, model, apiKey) {
  const path = protocol === 'openai-completions'
    ? '/chat/completions'
    : protocol === 'openai-responses'
      ? '/responses'
      : '/messages'
  const body = protocol === 'openai-completions'
    ? { model, messages: [{ role: 'user', content: 'Reply only with OK.' }], max_tokens: PROBE_MAX_OUTPUT_TOKENS, stream: true }
    : protocol === 'openai-responses'
      ? { model, input: 'Reply only with OK.', max_output_tokens: PROBE_MAX_OUTPUT_TOKENS, stream: true }
      : { model, max_tokens: PROBE_MAX_OUTPUT_TOKENS, messages: [{ role: 'user', content: 'Reply only with OK.' }], stream: true }
  try {
    const response = await fetch(`${baseURL.replace(/\/+$/u, '')}${path}`, {
      method: 'POST',
      headers: headersForProtocol(apiKey, protocol, true),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    const message = response.ok
      ? `HTTP ${response.status}: minimal model request succeeded`
      : await responseMessage(response, apiKey)
    const status = response.ok ? 'valid' : classifyApiKeyStatus(response.status, message)
    return validationResult(protocol, model, status, 'request', response.status, message)
  } catch (error) {
    return { protocol, model, status: 'unknown', checkedBy: 'request', message: errorMessage(error, apiKey) }
  }
}

function headersForProtocol(apiKey, protocol, includeContentType = false) {
  const headers = protocol === 'anthropic-messages'
    ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', accept: 'application/json' }
    : { authorization: `Bearer ${apiKey}`, accept: 'application/json' }
  if (includeContentType) headers['content-type'] = 'application/json'
  return headers
}

function classifyApiKeyStatus(status, message) {
  if (status === 401) return 'invalid'
  if (status === 403) return 'blocked'
  if (isAuthenticationFailure(message)) return 'invalid'
  if (status === 402 || status === 408 || status === 429) return 'unavailable'
  return 'unknown'
}

function isAuthenticationFailure(message) {
  return /(?:api[\s_-]*key|token|credential).*(?:invalid|incorrect|unauthori[sz]ed|expired|revoked)|(?:invalid|incorrect|unauthori[sz]ed|expired|revoked).*(?:api[\s_-]*key|token|credential)/iu.test(message)
}

function validationResult(protocol, model, status, checkedBy, httpStatus, message) {
  return { protocol, model, status, checkedBy, httpStatus, message }
}

function validationAttempt(result) {
  return {
    status: result.status,
    ...(result.httpStatus === undefined ? {} : { httpStatus: result.httpStatus }),
    message: result.message,
  }
}

async function responseMessage(response, secret = '') {
  const text = redactDiagnostic(await response.text(), secret)
  const detail = boundedDiagnostic(responseDetail(text))
  return detail === '' ? `HTTP ${response.status}` : `HTTP ${response.status}: ${detail}`
}

function responseDetail(text) {
  if (CLOUDFLARE_BLOCK_PATTERN.test(text)) {
    return 'Cloudflare blocked the provider request before it reached the API; this does not prove the API key is invalid'
  }
  let value = text
  for (let attempt = 0; attempt < 2 && typeof value === 'string'; attempt += 1) {
    try {
      value = JSON.parse(value)
    } catch {
      return value
    }
  }
  if (value !== null && typeof value === 'object') {
    if (value.error !== null && typeof value.error === 'object' && typeof value.error.message === 'string') return value.error.message
    if (typeof value.error === 'string') return value.error
    if (typeof value.message === 'string') return value.message
  }
  return typeof value === 'string' ? value : text
}

function boundedDiagnostic(value) {
  const normalized = value.replace(/\s+/gu, ' ').trim()
  return normalized.length <= DIAGNOSTIC_LENGTH_LIMIT
    ? normalized
    : `${normalized.slice(0, DIAGNOSTIC_LENGTH_LIMIT - 1)}…`
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

function requireProtocol(value) {
  if (typeof value !== 'string' || !API_KEY_PROTOCOLS.includes(value)) throw new Error('protocol is invalid')
  return value
}

function requireBatchProviders(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > BATCH_PROVIDER_LIMIT) {
    throw new Error(`providers must contain from 1 to ${BATCH_PROVIDER_LIMIT} entries`)
  }
  return value.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`providers[${index}] is invalid`)
    const provider = requireNonEmptyString(entry.provider, `providers[${index}].provider`)
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(provider)) throw new Error(`providers[${index}].provider is invalid`)
    const displayName = optionalDisplayName(entry.displayName) ?? provider
    return {
      provider,
      displayName,
      baseURL: requireBaseURL(entry.baseURL),
      credentialRef: requireCredentialRef(entry.credentialRef),
      protocol: requireProtocol(entry.protocol),
      model: optionalNonEmptyString(entry.model, `providers[${index}].model`) ?? '',
    }
  })
}

function optionalDisplayName(value) {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || value.trim().length > 120) throw new Error('displayName is invalid')
  return value.trim()
}

function optionalNonEmptyString(value, label) {
  if (value === undefined || value === '') return undefined
  return requireNonEmptyString(value, label)
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

function errorMessage(error, secret = '') {
  return redactDiagnostic(error instanceof Error ? error.message : String(error), secret)
}

function redactDiagnostic(value, secret) {
  return secret === '' ? value : value.split(secret).join('[redacted]')
}
