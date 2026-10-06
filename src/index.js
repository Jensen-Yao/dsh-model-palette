import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'
import { registerGatewayRecovery } from './gateway-recovery.js'
import { registerBaiRelay, registerProviderRelays } from './bai-relay.js'
import { registerRequestRetrySettings, RequestRetrySectionSchema, FreeSyncSectionSchema, DEFAULT_REQUEST_RETRY_SETTINGS } from './request-retry-settings.js'
import { registerOpenRouterFreeSync } from './openrouter-free-sync.js'
import { createSettingsBackend } from './compat/settings-backend.js'
import z from '@deepseek-ai/schemastery'
import fs from 'node:fs'
import path from 'node:path'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer', 'llm', 'settings']

function debugLog(msg) {
  try {
    const home = process.env.DSH_HOME?.trim()
      ? process.env.DSH_HOME
      : path.join(process.env.USERPROFILE || process.env.HOME || '.', '.dsh')
    const dir = path.join(home, 'storage', 'dsh-model-palette')
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, 'debug.log'), `${new Date().toISOString()} ${msg}\n`)
  } catch { /* 调试日志写入失败不影响运行 */ }
}

/**
 * dsh 0.2 config surface: composed per profile entry, auto-presented in the
 * settings UI, and served through the official settings describe API — which
 * is exactly the surface the client panel reads. Sections the palette manages
 * through its own panel are declared loosely so legacy entry config survives.
 */
export const Config = z.object({
  // volatile = 可由设置面板/运行时实时编辑；0.2 的 describe 只收录
  // 「至少含一个 volatile 字段」的条目，漏标会导致整个命名空间消失
  requestRetries: RequestRetrySectionSchema.default(
    structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS.requestRetries),
  ).volatile(),
  freeSync: FreeSyncSectionSchema.default(
    structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS.freeSync),
  ).volatile(),
  openrouterMedia: z.any().required(false),
  baiRelay: z.any().required(false),
  providerRelays: z.any().required(false),
  gatewayRecovery: z.any().required(false),
})

export function apply(ctx, config = {}) {
  debugLog(`apply enter: fiber.state=${ctx.fiber?.state} entryId=${ctx.fiber?.entry?.options?.id ?? '?'} configKeys=${Object.keys(config).join(',')}`)
  const settings = createSettingsBackend(ctx)
  debugLog(`settings mode: ${settings.mode}`)
  const retrySettings = registerRequestRetrySettings(settings)

  const steps = [
    ['registerModelConfigApi', () => registerModelConfigApi(ctx)],
    ['registerOpenRouterFreeSync', () => registerOpenRouterFreeSync(ctx, settings)],
    ['registerOpenRouterMedia', () => config.openrouterMedia?.enabled !== false
      ? registerOpenRouterMedia(ctx, config.openrouterMedia)
      : debugLog('openrouterMedia disabled by config')],
    ['registerBaiRelay', () => registerBaiRelay(ctx, config.baiRelay)],
    ['registerProviderRelays', () => registerProviderRelays(ctx, config.providerRelays)],
    ['registerGatewayRecovery', () => registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings)],
  ]
  for (const [step, fn] of steps) {
    try {
      fn()
      debugLog(`ok: ${step}`)
    } catch (error) {
      debugLog(`THROW in ${step}: ${error?.stack || error}`)
      throw error
    }
  }

  // 25 秒后记录官方 describe 的可见命名空间（等 loader 与各 effect 稳定）
  const probe = setTimeout(() => {
    try {
      const list = ctx.settings.describe
        ? ctx.settings.describe({ redactSecrets: false })
        : []
      debugLog(`describe ns: [${list.map(d => String(d.ns)).join(', ')}]`)
      const ownId = ctx.fiber?.entry?.options?.id ?? 'dsh-model-palette'
      debugLog(`own visible: ${list.some(d => String(d.ns) === ownId)}  fiber.state now=${ctx.fiber?.state}`)
    } catch (error) {
      debugLog(`describe failed: ${error?.stack || error}`)
    }
  }, 25_000)
  probe.unref?.()
}
