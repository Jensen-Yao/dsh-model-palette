import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createMediaApiHandler, registerOpenRouterMedia } from '../src/openrouter-media.js'

async function invoke(handler, path, body, headers = {}) {
  const req = Readable.from([JSON.stringify(body)])
  Object.assign(req, {
    method: 'POST',
    url: path,
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers },
  })
  let status = 0
  let text = ''
  const res = {
    writeHead(nextStatus) { status = nextStatus },
    end(chunk = '') { text += String(chunk) },
  }
  await handler(req, res)
  return { status, body: JSON.parse(text) }
}

describe('OpenRouter media registration', () => {
  it('registers five tools through Cordis effects', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'dsh-model-palette-'))
    const toolNames = []
    const effectLabels = []
    const routes = []
    const ctx = {
      effect(factory, label) {
        effectLabels.push(label)
        return factory()
      },
      tools: {
        register(tool) {
          toolNames.push(tool.name)
          return () => {}
        },
      },
      webServer: {
        register(route) {
          routes.push(route)
          return () => {}
        },
      },
    }

    try {
      registerOpenRouterMedia(ctx, {
        credentialRef: 'OPENROUTER_API_KEY',
        outputDir,
        allowPaidImages: false,
        allowPaidVideos: false,
        preferredImageModels: [],
        preferredVideoModels: [],
      })
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }

    expect(toolNames).toEqual([
      'openrouter_media_models',
      'openrouter_generate_image',
      'openrouter_generate_video',
      'openrouter_video_status',
      'openrouter_download_video',
    ])
    expect(effectLabels).toHaveLength(6)
    expect(routes).toMatchObject([{ kind: 'prefix', path: '/model-palette/api/media' }])
  })

  it('rejects a relative output directory before registration', () => {
    expect(() => registerOpenRouterMedia({ tools: {}, effect() {} }, {
      credentialRef: 'OPENROUTER_API_KEY',
      outputDir: 'relative/outputs',
      allowPaidImages: false,
      allowPaidVideos: false,
    })).toThrow('outputDir must be absolute')
  })

  it('dispatches same-origin JSON requests without a conversation', async () => {
    const handler = createMediaApiHandler({
      models: async (args) => ({ received: args }),
    })
    const response = await invoke(handler, '/model-palette/api/media/models', { kind: 'image' })
    expect(response).toEqual({ status: 200, body: { ok: true, value: { received: { kind: 'image' } } } })
  })

  it('rejects cross-site browser requests', async () => {
    const handler = createMediaApiHandler({ models: async () => ({}) })
    const response = await invoke(handler, '/model-palette/api/media/models', {}, { 'sec-fetch-site': 'cross-site' })
    expect(response.status).toBe(403)
  })
})
