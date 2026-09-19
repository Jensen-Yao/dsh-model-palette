import { parseOpenRouterFreeModels } from './model-config-api.js'
import { REQUEST_RETRY_SETTINGS_NAMESPACE, resolveFreeSyncRule, resolveFreeSyncState } from './request-retry-settings.js'

const LLM_SETTINGS_NAMESPACE = 'llm-pi-ai'
const SYNC_API_PATH = '/model-palette/api/free-sync'
const OPENROUTER_HOST_PATTERN = /(^|\.)openrouter\.ai$/iu
const TICK_INTERVAL_MS = 30 * 60 * 1000
const STARTUP_DELAY_MS = 8_000
const CATALOG_TIMEOUT_MS = 20_000
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

/** Register startup free-model synchronization for OpenRouter free-only provider routes. */
export function registerOpenRouterFreeSync(ctx) {
  const runtime = createFreeSyncRuntime(ctx)
  const startupTimer = setTimeout(() => { void runtime.syncDueProviders('startup') }, STARTUP_DELAY_MS)
  startupTimer.unref?.()
  const tickTimer = setInterval(() => { void runtime.syncDueProviders('interval') }, TICK_INTERVAL_MS)
  tickTimer.unref?.()
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: SYNC_API_PATH,
    handler: createFreeSyncHandler(runtime),
  }), 'dsh-model-palette: free-sync API')
  ctx.effect(() => async () => {
    clearTimeout(startupTimer)
    clearInterval(tickTimer)
    await runtime.dispose()
  }, 'dsh-model-palette: free-sync timers')
}

/** Create the free-sync runtime so provider synchronization stays unit-testable. */
export function createFreeSyncRuntime(ctx) {
  const inFlight = new Map()
  let stopped = false

  async function pluginSettings() {
    return ctx.settings.get(REQUEST_RETRY_SETTINGS_NAMESPACE)
  }

  function dueProviders(settings) {
    const providers = isRecord(settings?.freeSync) && isRecord(settings.freeSync.providers)
      ? Object.keys(settings.freeSync.providers).filter(id => resolveFreeSyncRule(settings, id) !== undefined)
      : []
    return providers
  }

  function isDue(settings, provider) {
    const rule = resolveFreeSyncRule(settings, provider)
    if (rule === undefined) return false
    const state = resolveFreeSyncState(settings, provider)
    if (state === undefined || typeof state.lastSyncAt !== 'string') return true
    const last = Date.parse(state.lastSyncAt)
    if (!Number.isFinite(last)) return true
    return Date.now() - last >= rule.intervalHours * 3_600_000
  }

  async function syncDueProviders(trigger) {
    if (stopped) return
    const settings = await pluginSettings()
    const due = dueProviders(settings).filter(provider => isDue(settings, provider))
    for (const provider of due) {
      if (stopped) return
      try {
        await syncProvider(provider)
      } catch (error) {
        ctx.logger?.warn?.(`dsh-model-palette: ${trigger} free-sync for "${provider}" failed: ${errorMessage(error)}`)
      }
    }
  }

  async function syncProvider(providerId) {
    if (stopped) throw new Error('free sync is disposed')
    const pending = inFlight.get(providerId)
    if (pending !== undefined) return pending
    const task = (async () => {
      try {
        const settings = await pluginSettings()
        if (resolveFreeSyncRule(settings, providerId) === undefined) {
          throw new Error(`free sync is not enabled for provider "${providerId}"`)
        }
        const profile = providerProfile(ctx, providerId)
        if (profile === undefined) throw new Error(`provider "${providerId}" is not configured`)
        if (!isOpenRouterRoute(profile)) throw new Error(`provider "${providerId}" does not point at openrouter.ai`)
        const live = await fetchLiveFreeModels()
        const previous = Array.isArray(profile.models)
          ? profile.models.filter(isRecord)
          : []
        const merged = mergeFreeSyncModels(previous, live, stringField(profile, 'api') || 'openai-completions')
        await ctx.settings.mutate(LLM_SETTINGS_NAMESPACE, [{
          op: 'set',
          path: ['providers', providerId, 'models'],
          value: merged.models,
        }])
        const state = {
          lastSyncAt: new Date().toISOString(),
          total: merged.models.length,
          added: merged.added,
          removed: merged.removed,
        }
        await ctx.settings.mutate(REQUEST_RETRY_SETTINGS_NAMESPACE, [{
          op: 'set',
          path: ['freeSync', 'state', providerId],
          value: state,
        }])
        ctx.logger?.info?.(`dsh-model-palette: free-sync "${providerId}" now serves ${state.total} free models (+${state.added}/-${state.removed})`)
        return { provider: providerId, ...state }
      } catch (error) {
        const message = errorMessage(error)
        try {
          await ctx.settings.mutate(REQUEST_RETRY_SETTINGS_NAMESPACE, [{
            op: 'set',
            path: ['freeSync', 'state', providerId],
            value: { lastSyncAt: new Date().toISOString(), error: message },
          }])
        } catch (stateError) {
          ctx.logger?.warn?.(`dsh-model-palette: free-sync state write failed for "${providerId}": ${errorMessage(stateError)}`)
        }
        throw error
      } finally {
        inFlight.delete(providerId)
      }
    })()
    inFlight.set(providerId, task)
    return task
  }

  async function dispose() {
    stopped = true
    await Promise.allSettled([...inFlight.values()])
  }

  return { syncDueProviders, syncProvider, dispose, dueProviders, isDue }
}

/**
 * Merge the live free catalog into the provider's model list. The list becomes
 * exactly the live free models: stale entries vanish, manual capacity and
 * compatibility fields on surviving ids are kept.
 */
export function mergeFreeSyncModels(previous, live, protocol) {
  const priorById = new Map(previous
    .filter(model => typeof model.id === 'string' && model.id !== '')
    .map(model => [model.id, model]))
  const seen = new Set()
  let added = 0
  const models = []
  for (const candidate of live) {
    if (typeof candidate.id !== 'string' || candidate.id === '' || seen.has(candidate.id)) continue
    seen.add(candidate.id)
    const prior = priorById.get(candidate.id)
    if (prior === undefined) added += 1
    const next = prior === undefined ? {} : structuredClone(prior)
    next.id = candidate.id
    if (typeof next.name !== 'string' || next.name === '') next.name = candidate.name ?? candidate.id
    if (!Number.isInteger(next.contextWindow) || next.contextWindow <= 0) {
      if (Number.isInteger(candidate.contextWindow) && candidate.contextWindow > 0) next.contextWindow = candidate.contextWindow
      else delete next.contextWindow
    }
    if (!Number.isInteger(next.maxTokens) || next.maxTokens <= 0) {
      if (Number.isInteger(candidate.maxTokens) && candidate.maxTokens > 0) next.maxTokens = candidate.maxTokens
      else delete next.maxTokens
    }
    if (!Array.isArray(next.input) || next.input.length === 0) {
      if (Array.isArray(candidate.input) && candidate.input.length > 0) next.input = [...candidate.input]
      else delete next.input
    }
    if (protocol === 'openai-completions') next.compat = deepSeekCompat(next)
    else delete next.compat
    models.push(next)
  }
  const removed = previous.length + added - models.length
  return { models, added, removed: Math.max(0, removed) }
}

/** Add the DeepSeek replay compatibility fields when the free model is a DeepSeek model. */
function deepSeekCompat(model) {
  const compat = isRecord(model.compat) ? structuredClone(model.compat) : {}
  const identity = `${model.id} ${model.name}`.toLocaleLowerCase()
  if (compat.thinkingFormat === undefined && identity.includes('deepseek')) compat.thinkingFormat = 'deepseek'
  if (compat.thinkingFormat === 'deepseek') {
    if (compat.requiresReasoningContentOnAssistantMessages === undefined) compat.requiresReasoningContentOnAssistantMessages = true
    if (compat.supportsDeveloperRole === undefined) compat.supportsDeveloperRole = false
  }
  return Object.keys(compat).length === 0 ? undefined : compat
}

function createFreeSyncHandler(runtime) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, error: { message: 'method not allowed' } })
      return
    }
    if (!isTrustedBrowserRequest(req)) {
      writeJson(res, 403, { ok: false, error: { message: 'cross-site request rejected' } })
      return
    }
    let body
    try {
      body = await readJsonBody(req)
    } catch (error) {
      writeJson(res, 400, { ok: false, error: { message: errorMessage(error) } })
      return
    }
    const provider = typeof body?.provider === 'string' ? body.provider.trim() : ''
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(provider)) {
      writeJson(res, 400, { ok: false, error: { message: 'provider is required' } })
      return
    }
    try {
      writeJson(res, 200, { ok: true, value: await runtime.syncProvider(provider) })
    } catch (error) {
      writeJson(res, 502, { ok: false, error: { message: `free sync failed: ${errorMessage(error)}` } })
    }
  }
}

function providerProfile(ctx, providerId) {
  const section = ctx.settings.get(LLM_SETTINGS_NAMESPACE)
  const providers = isRecord(section?.providers) ? section.providers : undefined
  const profile = isRecord(providers?.[providerId]) ? providers[providerId] : undefined
  return profile
}

function isOpenRouterRoute(profile) {
  const baseURL = stringField(profile, 'baseURL')
  if (baseURL === '') return true
  try {
    return OPENROUTER_HOST_PATTERN.test(new URL(baseURL).hostname)
  } catch {
    return false
  }
}

async function fetchLiveFreeModels() {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: { 'accept': 'application/json', 'user-agent': 'DSH-Model-Palette/0.11' },
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`OpenRouter catalog returned HTTP ${response.status}`)
  return parseOpenRouterFreeModels(await response.json())
}

function stringField(value, key) {
  return typeof value?.[key] === 'string' ? value[key] : ''
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTrustedBrowserRequest(req) {
  const site = req.headers['sec-fetch-site']
  return site === undefined || site === 'same-origin' || site === 'same-site' || site === 'none'
}

async function readJsonBody(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (Buffer.byteLength(text) > 65_536) throw new Error('request body is too large')
  }
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('request body must be valid JSON')
  }
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
