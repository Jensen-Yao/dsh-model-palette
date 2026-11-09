import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'
import { registerGatewayRecovery } from './gateway-recovery.js'
import { registerBaiRelay, registerProviderRelays } from './bai-relay.js'
import { registerRequestRetrySettings, RequestRetrySectionSchema, FreeSyncSectionSchema, DEFAULT_REQUEST_RETRY_SETTINGS } from './request-retry-settings.js'
import { registerOpenRouterFreeSync } from './openrouter-free-sync.js'
import { FreeModelsConfigSchema, registerFreeModels } from './free-model.ts'
import { createSettingsBackend } from './compat/settings-backend.js'
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer', 'llm', 'settings']

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
  freeModels: FreeModelsConfigSchema.default({}),
})

export function apply(ctx, config = {}) {
  const settings = createSettingsBackend(ctx)
  ctx.logger?.debug?.(`dsh-model-palette: settings backend ${settings.mode}`)
  const retrySettings = registerRequestRetrySettings(settings)
  ctx.effect(() => () => retrySettings.dispose(), 'dsh-model-palette: settings registration')
  registerModelConfigApi(ctx)
  registerOpenRouterFreeSync(ctx, settings)
  if (config.openrouterMedia?.enabled !== false) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
  registerBaiRelay(ctx, config.baiRelay)
  registerProviderRelays(ctx, config.providerRelays)
  registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings)
  if (config.freeModels?.enabled !== false) registerFreeModels(ctx, config.freeModels)
}
