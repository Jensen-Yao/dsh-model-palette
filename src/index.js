import { registerOpenRouterMedia } from './openrouter-media.js'
import { registerModelConfigApi } from './model-config-api.js'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials', 'webServer']

export function apply(ctx, config = {}) {
  registerModelConfigApi(ctx)
  if (config.openrouterMedia?.enabled === true) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
}
