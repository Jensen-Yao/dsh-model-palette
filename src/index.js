import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'
import { registerGatewayRecovery } from './gateway-recovery.js'
import { registerBaiRelay, registerProviderRelays } from './bai-relay.js'
import { registerRequestRetrySettings } from './request-retry-settings.js'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer', 'llm', 'settings']

export function apply(ctx, config = {}) {
  const retrySettings = registerRequestRetrySettings(ctx)
  registerModelConfigApi(ctx)
  registerBaiRelay(ctx, config.baiRelay)
  registerProviderRelays(ctx, config.providerRelays)
  registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings)
  if (config.openrouterMedia?.enabled === true) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
}
