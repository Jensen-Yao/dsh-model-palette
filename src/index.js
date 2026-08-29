import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'
import { registerGatewayRecovery } from './gateway-recovery.js'
import { registerBaiRelay, registerProviderRelays } from './bai-relay.js'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer', 'llm']

export function apply(ctx, config = {}) {
  registerModelConfigApi(ctx)
  registerBaiRelay(ctx, config.baiRelay)
  registerProviderRelays(ctx, config.providerRelays)
  registerGatewayRecovery(ctx, config.gatewayRecovery)
  if (config.openrouterMedia?.enabled === true) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
}
