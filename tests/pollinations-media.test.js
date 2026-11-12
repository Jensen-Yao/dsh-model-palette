import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPollinationsMedia, resolvePollinationsConfig } from '../src/pollinations-media.js'

let dir
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'dmp-pollinations-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

const ctx = { tools: { register: vi.fn() }, webServer: { register: vi.fn() }, effect: vi.fn() }

function mediaWith(fetchImpl, overrides = {}) {
  return createPollinationsMedia(ctx, { pollinations: { outputDir: dir, ...overrides } }, fetchImpl)
}

describe('resolvePollinationsConfig', () => {
  it('defaults to enabled with the public image endpoint', () => {
    const config = resolvePollinationsConfig(undefined)
    expect(config).toMatchObject({ enabled: true, baseURL: 'https://image.pollinations.ai' })
    expect(config.outputDir).toContain('media-output')
  })
  it('honors enabled=false and a custom base', () => {
    const config = resolvePollinationsConfig({ pollinations: { enabled: false, baseURL: 'https://proxy.example/' } })
    expect(config).toMatchObject({ enabled: false, baseURL: 'https://proxy.example' })
  })
})

describe('createPollinationsMedia', () => {
  it('returns an empty registration when disabled', () => {
    const media = mediaWith(fetch, { enabled: false })
    expect(media.enabled).toBe(false)
    expect(media.tools).toHaveLength(0)
    expect(media.routes.size).toBe(0)
  })

  it('lists models through the keyless catalog', async () => {
    const fetchImpl = vi.fn(async (url) => {
      expect(String(url)).toBe('https://image.pollinations.ai/models')
      return Response.json(['flux', { name: 'turbo', description: 'fast' }, { name: 'flux' }, 42])
    })
    const media = mediaWith(fetchImpl)
    const result = await media.routes.get('pollinations/models')({}, undefined)
    expect(result.models).toEqual([
      { id: 'flux', free: true },
      { id: 'turbo', description: 'fast', free: true },
    ])
  })

  it('generates an image and writes the bytes locally', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
    const fetchImpl = vi.fn(async (url) => {
      const target = String(url)
      if (target.endsWith('/models')) return Response.json(['flux'])
      expect(target.startsWith('https://image.pollinations.ai/prompt/a%20red%20cube')).toBe(true)
      expect(target).toContain('model=flux')
      expect(target).toContain('width=512')
      expect(target).toContain('height=768')
      expect(target).toContain('nologo=true')
      return new Response(bytes, { status: 200, headers: { 'content-type': 'image/jpeg' } })
    })
    const media = mediaWith(fetchImpl)
    const result = await media.routes.get('pollinations/images/generate')({
      prompt: 'a red cube', model: 'flux', width: 512, height: 768, output_name: 'cube',
    }, undefined)
    expect(result).toMatchObject({ provider: 'pollinations', model: 'flux', free_endpoint: true })
    expect(result.files).toHaveLength(1)
    expect(result.files[0].path.endsWith('cube.jpg')).toBe(true)
    expect(result.files[0].bytes).toBe(bytes.byteLength)
    expect(readFileSync(result.files[0].path)).toEqual(Buffer.from(bytes))
  })

  it('rejects non-image responses and invalid dimensions', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>rate limit</html>', { status: 200, headers: { 'content-type': 'text/html' } }))
    const media = mediaWith(fetchImpl)
    await expect(media.routes.get('pollinations/images/generate')({ prompt: 'x' }, undefined)).rejects.toThrow('non-image')
    await expect(media.routes.get('pollinations/images/generate')({ prompt: 'x', width: 32 }, undefined)).rejects.toThrow('width')
    await expect(media.routes.get('pollinations/images/generate')({ prompt: 'x', height: 9999 }, undefined)).rejects.toThrow('height')
  })

  it('registers both tools with the DSH surface', () => {
    const media = mediaWith(fetch)
    expect(media.tools.map((tool) => tool.name)).toEqual(['pollinations_media_models', 'pollinations_generate_image'])
    expect(media.routes.has('pollinations/images/generate')).toBe(true)
  })
})
