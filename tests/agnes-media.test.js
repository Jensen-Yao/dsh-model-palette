import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAgnesMedia, resolveAgnesConfig } from '../src/agnes-media.js'

let dir
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'dmp-agnes-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

const key = 'sk-test'
const ctx = { credentials: { resolve: async (ref) => (ref === 'AGNES_API_KEY' ? { value: key } : undefined) }, effect() {} }
const noKeyCtx = { credentials: { resolve: async () => undefined }, effect() {} }

function mediaWith(fetchImpl, context = ctx) {
  return createAgnesMedia(context, { agnes: { outputDir: dir } }, fetchImpl)
}

describe('resolveAgnesConfig', () => {
  it('defaults to the cn endpoint and AGNES_API_KEY', () => {
    expect(resolveAgnesConfig(undefined)).toMatchObject({ enabled: true, baseURL: 'https://api.agnes-ai.cn/v1', credentialRef: 'AGNES_API_KEY' })
  })
  it('rejects relative output directories', () => {
    expect(() => resolveAgnesConfig({ agnes: { outputDir: 'relative' } })).toThrow(/absolute/)
  })
})

describe('createAgnesMedia', () => {
  it('disables when configured off', () => {
    const media = mediaWith(fetch, undefined)
    expect(media.enabled).toBe(true)
    const off = createAgnesMedia(ctx, { agnes: { enabled: false, outputDir: dir } }, fetch)
    expect(off.enabled).toBe(false)
    expect(off.tools).toHaveLength(0)
  })

  it('lists the free flash image and video models with credential state', async () => {
    const media = mediaWith(fetch)
    const models = await media.routes.get('agnes/models')({}, undefined)
    expect(models.credential_ready).toBe(true)
    expect(models.images.map((row) => row.id)).toEqual(['agnes-image-2.1-flash', 'agnes-image-2.5-flash'])
    expect(models.videos).toEqual([{ id: 'agnes-video-2.5-flash', free: true, supported_sizes: ['720P'], supported_durations: [4, 5, 6, 7, 8, 9, 10, 11, 12], supported_aspect_ratios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] }])
  })

  it('reports missing credentials without throwing', async () => {
    const media = createAgnesMedia(noKeyCtx, { agnes: { outputDir: dir } }, fetch)
    const models = await media.routes.get('agnes/models')({}, undefined)
    expect(models.credential_ready).toBe(false)
    await expect(media.routes.get('agnes/images/generate')({ prompt: 'x' }, undefined)).rejects.toThrow(/AGNES_API_KEY/)
  })

  it('generates an image and writes the png with a proper suffix', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const fetchImpl = vi.fn(async (url, init) => {
      expect(String(url)).toBe('https://api.agnes-ai.cn/v1/images/generations')
      expect(init.headers.authorization).toBe(`Bearer ${key}`)
      return Response.json({ data: [{ b64_json: png.toString('base64'), media_type: 'image/png' }] })
    })
    const media = mediaWith(fetchImpl)
    const result = await media.routes.get('agnes/images/generate')({ prompt: 'a cat', model: 'agnes-image-2.5-flash', size: '2K', ratio: '16:9', output_name: 'my-cat' }, undefined)
    expect(result.model).toBe('agnes-image-2.5-flash')
    expect(result.files[0].path.endsWith('my-cat.png')).toBe(true)
    expect(readFileSync(result.files[0].path)).toEqual(png)
  })

  it('submits (with queue retry), polls, and downloads a video', async () => {
    let submits = 0
    const mp4 = Buffer.from([0, 0, 0, 0x18, ...('ftypmp42isom'.split('').map((c) => c.charCodeAt(0)))])
    const fetchImpl = vi.fn(async (url, init) => {
      const target = String(url)
      if (target.endsWith('/videos')) {
        submits += 1
        if (submits === 1) return new Response('{"code":"video_queue_full"}', { status: 503 })
        expect(JSON.parse(String(init.body)).model).toBe('agnes-video-2.5-flash')
        return Response.json({ video_id: 'vid-1', status: 'processing' })
      }
      if (target.startsWith('https://api.agnes-ai.cn/agnesapi')) {
        expect(target).toContain('video_id=vid-1')
        expect(target).toContain('model_name=agnes-video-2.5-flash')
        return Response.json({ status: 'completed', url: 'https://cdn.example/final.mp4' })
      }
      if (target === 'https://cdn.example/final.mp4') return new Response(mp4)
      throw new Error(`unexpected fetch ${target}`)
    })
    const media = mediaWith(fetchImpl)
    const submit = await media.routes.get('agnes/videos/generate')({ prompt: 'a boat', seconds: 4 }, undefined)
    expect(submit).toMatchObject({ provider: 'agnes', id: 'vid-1', model: 'agnes-video-2.5-flash' })
    expect(submits).toBe(2) // one queue-full retry
    const status = await media.routes.get('agnes/videos/status')({ video_id: 'vid-1' }, undefined)
    expect(status).toMatchObject({ status: 'completed' })
    const download = await media.routes.get('agnes/videos/download')({ video_id: 'vid-1', output_name: 'boat' }, undefined)
    expect(download.path.endsWith('boat.mp4')).toBe(true)
    expect(readFileSync(download.path).subarray(4, 8)).toEqual(Buffer.from('ftyp'))
  }, 30_000)

  it('validates seconds and rejects incomplete downloads', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"status":"processing"}', { status: 200, headers: { 'content-type': 'application/json' } }))
    const media = mediaWith(fetchImpl)
    await expect(media.routes.get('agnes/videos/generate')({ prompt: 'x', seconds: 3 }, undefined)).rejects.toThrow(/4 and 12/)
    await expect(media.routes.get('agnes/videos/download')({ video_id: 'missing' }, undefined)).rejects.toThrow(/not ready/)
  })
})
