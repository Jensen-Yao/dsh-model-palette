import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'
import { registerGatewayRecovery } from './gateway-recovery.js'
import { registerBaiRelay, registerProviderRelays } from './bai-relay.js'
import { registerRequestRetrySettings } from './request-retry-settings.js'
import { registerOpenRouterFreeSync } from './openrouter-free-sync.js'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer', 'llm', 'settings']

export function apply(ctx, config = {}) {
  const retrySettings = registerRequestRetrySettings(ctx)
  registerModelConfigApi(ctx)
  registerOpenRouterFreeSync(ctx)
  if (config.openrouterMedia?.enabled !== false) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
  registerBaiRelay(ctx, config.baiRelay)
  registerProviderRelays(ctx, config.providerRelays)
  registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings)
}
