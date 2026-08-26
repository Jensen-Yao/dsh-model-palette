import { registerOpenRouterMedia } from './openrouter-media.js'

export const name = 'dsh-model-palette'
export const inject = ['tools', 'credentials']

export function apply(ctx, config = {}) {
  if (config.openrouterMedia?.enabled === true) {
    registerOpenRouterMedia(ctx, config.openrouterMedia)
  }
}
