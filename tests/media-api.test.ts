import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateImage, generateVideo, listMediaModels, mediaApiRequest, pickDefaultMediaModel } from '../src/client/media-api.ts'
import { MANUAL_PAID_ACKNOWLEDGEMENT } from '../src/media-protocol.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('direct media API client', () => {
  it('prefers configured free models without asking an agent', () => {
    expect(pickDefaultMediaModel([
      { id: 'paid-preferred', preferred: true, free: false },
      { id: 'plain', preferred: false, free: true },
      { id: 'free-preferred', preferred: true, free: true },
    ], false)).toBe('free-preferred')
  })

  it('keeps free models as the safe default when paid generation is enabled', () => {
    const models = [
      { id: 'paid-preferred', preferred: true, free: false },
      { id: 'free', preferred: false, free: true },
    ]
    expect(pickDefaultMediaModel(models, false)).toBe('free')
    expect(pickDefaultMediaModel(models, true)).toBe('free')
  })

  it('selects a preferred paid model when no free model exists and paid generation is enabled', () => {
    expect(pickDefaultMediaModel([
      { id: 'paid', preferred: false, free: false },
      { id: 'paid-preferred', preferred: true, free: false },
    ], true)).toBe('paid-preferred')
  })

  it('does not preselect an unverified model while paid generation is blocked', () => {
    expect(pickDefaultMediaModel([
      { id: 'paid-preferred', preferred: true, free: false },
    ], false)).toBe('')
  })

  it('loads the full live catalog directly from the plugin route', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      value: { images: [], videos: [], paid_images_enabled: false, paid_videos_enabled: false },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await expect(listMediaModels()).resolves.toMatchObject({ images: [], videos: [] })
    expect(fetch).toHaveBeenCalledWith('/model-palette/api/media/models', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ kind: 'all', preferred_only: false, free_only: false }),
    }))
  })

  it('surfaces host errors instead of writing a conversation prompt', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      error: { message: 'No free image model is currently available' },
    }), { status: 400, headers: { 'content-type': 'application/json' } })))
    await expect(mediaApiRequest('/images/generate', {})).rejects.toThrow('No free image model')
  })

  it('sends the exact one-time acknowledgement only for manual attempts', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      value: { model: 'model', free_endpoint: false, manual_paid_override: true, files: [] },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)

    await generateImage({ model: 'image-model', prompt: 'image', acknowledgePossibleCharge: true })
    await generateVideo({ model: 'video-model', prompt: 'video' })

    expect(fetch).toHaveBeenNthCalledWith(1, '/model-palette/api/media/images/generate', expect.objectContaining({
      body: JSON.stringify({
        model: 'image-model',
        prompt: 'image',
        manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT,
      }),
    }))
    expect(fetch).toHaveBeenNthCalledWith(2, '/model-palette/api/media/videos/generate', expect.objectContaining({
      body: JSON.stringify({ model: 'video-model', prompt: 'video' }),
    }))
  })
})
