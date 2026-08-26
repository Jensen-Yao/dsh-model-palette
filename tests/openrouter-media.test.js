import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MANUAL_PAID_ACKNOWLEDGEMENT } from '../src/media-protocol.ts'
import { createMediaApiHandler, registerOpenRouterMedia } from '../src/openrouter-media.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(value) {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } })
}

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

  it('allows an acknowledged image attempt only through the direct media route', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'dsh-model-palette-'))
    const tools = []
    const routes = []
    const ctx = {
      effect(factory) { return factory() },
      credentials: { async resolve() { return { value: 'test-key' } } },
      tools: { register(tool) { tools.push(tool); return () => {} } },
      webServer: { register(route) { routes.push(route); return () => {} } },
    }
    const fetch = vi.fn(async (url, options = {}) => {
      const target = String(url)
      if (target.endsWith('/images/models')) return jsonResponse({ data: [{ id: 'paid-image', endpoints: '/images/models/paid-image/endpoints' }] })
      if (target.endsWith('/images/models/paid-image/endpoints')) return jsonResponse({ endpoints: [{ provider_tag: 'paid-provider', pricing: [{ cost_usd: '0.01' }] }] })
      if (target.endsWith('/images') && options.method === 'POST') return jsonResponse({ data: [{ b64_json: Buffer.from('image').toString('base64'), media_type: 'image/png' }] })
      throw new Error(`Unexpected fetch ${target}`)
    })
    vi.stubGlobal('fetch', fetch)

    try {
      registerOpenRouterMedia(ctx, {
        credentialRef: 'OPENROUTER_API_KEY',
        outputDir,
        allowPaidImages: false,
        allowPaidVideos: false,
      })
      const imageTool = tools.find((tool) => tool.name === 'openrouter_generate_image')
      const args = { model: 'paid-image', prompt: 'test', output_name: 'manual-test', manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT }

      expect(imageTool.parameters.properties).not.toHaveProperty('manual_paid_acknowledgement')
      await expect(imageTool.execute(args, { signal: new AbortController().signal })).rejects.toThrow('does not report a free image endpoint')

      const response = await invoke(routes[0].handler, '/model-palette/api/media/images/generate', args)
      expect(response.status).toBe(200)
      expect(response.body.value).toMatchObject({ model: 'paid-image', free_endpoint: false, manual_paid_override: true })
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })

  it('allows an acknowledged video attempt only through the direct media route', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'dsh-model-palette-'))
    const tools = []
    const routes = []
    const ctx = {
      effect(factory) { return factory() },
      credentials: { async resolve() { return { value: 'test-key' } } },
      tools: { register(tool) { tools.push(tool); return () => {} } },
      webServer: { register(route) { routes.push(route); return () => {} } },
    }
    const fetch = vi.fn(async (url, options = {}) => {
      const target = String(url)
      if (target.endsWith('/videos/models')) return jsonResponse({ data: [{ id: 'paid-video', pricing_skus: { second: '0.01' } }] })
      if (target.endsWith('/videos') && options.method === 'POST') return jsonResponse({ id: 'job-1', status: 'queued' })
      throw new Error(`Unexpected fetch ${target}`)
    })
    vi.stubGlobal('fetch', fetch)

    try {
      registerOpenRouterMedia(ctx, {
        credentialRef: 'OPENROUTER_API_KEY',
        outputDir,
        allowPaidImages: false,
        allowPaidVideos: false,
      })
      const videoTool = tools.find((tool) => tool.name === 'openrouter_generate_video')
      const args = { model: 'paid-video', prompt: 'test', manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT }

      expect(videoTool.parameters.properties).not.toHaveProperty('manual_paid_acknowledgement')
      await expect(videoTool.execute(args, { signal: new AbortController().signal })).rejects.toThrow('does not report this video model as free')

      const response = await invoke(routes[0].handler, '/model-palette/api/media/videos/generate', args)
      expect(response.status).toBe(200)
      expect(response.body.value).toMatchObject({ id: 'job-1', free_endpoint: false, manual_paid_override: true })
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }
  })
})
