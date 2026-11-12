/**
 * Agnes media lane: free flash image generation (trial price $0) and the
 * free 720P flash video pipeline, through the local AGNES_API_KEY credential.
 * Follows the same provider shape as the Pollinations lane so more sources
 * can join the media registration.
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

const DEFAULT_AGNES_BASE = 'https://api.agnes-ai.cn/v1'
const DEFAULT_CREDENTIAL_REF = 'AGNES_API_KEY'
const FREE_IMAGE_MODELS = ['agnes-image-2.1-flash', 'agnes-image-2.5-flash']
const FREE_VIDEO_MODEL = 'agnes-video-2.5-flash'
const IMAGE_SIZES = ['1K', '2K', '3K', '4K']
const IMAGE_RATIOS = ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9']
const VIDEO_RATIOS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']
const REQUEST_TIMEOUT_MS = 360_000
const RESULT_SCHEMA = { type: 'object', additionalProperties: true, properties: {} }

/**
 * Resolve the Agnes section of the media config.
 * `enabled: false` opts out; baseURL/credentialRef are overridable.
 */
export function resolveAgnesConfig(source) {
  const section = source?.agnes === undefined || source?.agnes === null ? {} : source.agnes
  const baseURL = section.baseURL === undefined || section.baseURL === '' ? DEFAULT_AGNES_BASE : String(section.baseURL).replace(/\/+$/u, '')
  const outputDir = section.outputDir === undefined || section.outputDir === ''
    ? join(homedir(), '.dsh', 'media-output')
    : String(section.outputDir)
  if (!isAbsolute(outputDir)) throw new TypeError('agnes.outputDir must be absolute')
  return {
    enabled: section.enabled === undefined ? true : section.enabled === true,
    baseURL,
    queryBase: section.queryBase === undefined ? `${new URL(baseURL).origin}/agnesapi` : String(section.queryBase),
    credentialRef: section.credentialRef === undefined || section.credentialRef === '' ? DEFAULT_CREDENTIAL_REF : String(section.credentialRef),
    outputDir: resolve(outputDir),
  }
}

/** Build the Agnes tools and HTTP actions; an unresolved credential disables the lane. */
export function createAgnesMedia(ctx, mediaConfig, fetchImpl = fetch) {
  const config = resolveAgnesConfig(mediaConfig)
  if (!config.enabled) return { enabled: false, reason: 'disabled', config, tools: [], routes: new Map() }
  const resolveKey = async () => {
    try {
      const resolved = await ctx?.credentials?.resolve?.(config.credentialRef)
      return resolved?.value
    } catch {
      return undefined
    }
  }
  // The credential is probed once at registration; the lane stays hidden until the key exists.
  let credentialReady = false
  let keyProbe = resolveKey().then((key) => { credentialReady = key !== undefined; return key }).catch(() => { credentialReady = false; return undefined })
  mkdirSync(config.outputDir, { recursive: true })

  const requireKey = async () => {
    const key = await keyProbe
    if (key === undefined) throw Object.assign(new Error(`credential ${config.credentialRef} is not configured; Agnes media needs the local key`), { status: 503 })
    return key
  }

  const models = async () => {
    keyProbe = resolveKey().then((key) => { credentialReady = key !== undefined; return key }).catch(() => { credentialReady = false; return undefined })
    await keyProbe
    return ({
    provider: 'agnes',
    free: true,
    credential_ready: credentialReady,
    images: FREE_IMAGE_MODELS.map((id) => ({ id, free: true, supported_sizes: IMAGE_SIZES, supported_ratios: IMAGE_RATIOS })),
    videos: [{ id: FREE_VIDEO_MODEL, free: true, supported_sizes: ['720P'], supported_durations: [4, 5, 6, 7, 8, 9, 10, 11, 12], supported_aspect_ratios: VIDEO_RATIOS }],
    })
  }

  const image = async (args, signal) => {
    const key = await requireKey()
    const model = FREE_IMAGE_MODELS.includes(args?.model) ? args.model : FREE_IMAGE_MODELS[0]
    const prompt = requireString(args?.prompt, 'prompt')
    const size = IMAGE_SIZES.includes(args?.size) ? args.size : '1K'
    const ratio = IMAGE_RATIOS.includes(args?.ratio) ? args.ratio : '1:1'
    const response = await fetchImpl(`${config.baseURL}/images/generations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, size, ratio, return_base64: true }),
      signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    })
    if (!response.ok) throw Object.assign(new Error(`Agnes image generation returned HTTP ${String(response.status)}: ${truncate(await response.text())}`), { status: 502 })
    const payload = await response.json()
    const record = Array.isArray(payload?.data) ? payload.data[0] : undefined
    const bytes = decodeImage(record)
    if (bytes === undefined) throw Object.assign(new Error('Agnes returned no image payload'), { status: 502 })
    const mediaType = typeof record?.media_type === 'string' ? record.media_type : 'image/png'
    const suffix = mediaType.includes('jpeg') ? '.jpg' : mediaType.includes('webp') ? '.webp' : '.png'
    const imageName = safeName(args?.output_name) ?? `agnes-${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID().slice(0, 8)}`
    const path = join(config.outputDir, `${imageName}${suffix}`)
    await writeFile(path, bytes)
    return { provider: 'agnes', model, free_endpoint: true, manual_paid_override: false, files: [{ path, media_type: mediaType, bytes: bytes.byteLength }] }
  }

  const video = async (args, signal) => {
    const key = await requireKey()
    const prompt = requireString(args?.prompt, 'prompt')
    const seconds = clampInteger(args?.seconds, 4, 12, 5)
    const aspectRatio = VIDEO_RATIOS.includes(args?.aspect_ratio) ? args.aspect_ratio : '16:9'
    // The free flash queue reports 503 video_queue_full under load; back off and retry.
    let response = undefined
    for (let attempt = 0; ; attempt += 1) {
      response = await fetchImpl(`${config.baseURL}/videos`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: FREE_VIDEO_MODEL, prompt, mode: 'text', seconds: String(seconds), size: '720P', aspect_ratio: aspectRatio }),
        signal: signal ?? AbortSignal.timeout(60_000),
        redirect: 'error',
      })
      if (response.ok || response.status !== 503 || attempt >= 3) break
      await new Promise((resolve) => setTimeout(resolve, 8000 * (attempt + 1)))
    }
    if (!response.ok) throw Object.assign(new Error(`Agnes video submit returned HTTP ${String(response.status)}: ${truncate(await response.text())}`), { status: 502 })
    const payload = await response.json()
    const id = typeof payload?.video_id === 'string' ? payload.video_id : typeof payload?.id === 'string' ? payload.id : ''
    if (id === '') throw Object.assign(new Error('Agnes returned no video id'), { status: 502 })
    return { provider: 'agnes', id, model: FREE_VIDEO_MODEL, status: typeof payload?.status === 'string' ? payload.status : 'submitted', free_endpoint: true, manual_paid_override: false }
  }

  const status = async (args, signal) => {
    const key = await requireKey()
    const videoId = requireString(args?.video_id, 'video_id')
    const url = `${config.queryBase}?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(FREE_VIDEO_MODEL)}`
    const response = await fetchImpl(url, { headers: { accept: 'application/json', authorization: `Bearer ${key}` }, signal: signal ?? AbortSignal.timeout(60_000), redirect: 'error' })
    if (!response.ok) throw Object.assign(new Error(`Agnes video status returned HTTP ${String(response.status)}`), { status: 502 })
    return response.json()
  }

  const download = async (args, signal) => {
    const videoId = requireString(args?.video_id, 'video_id')
    const final = await status(args, signal)
    const mediaUrl = typeof final?.url === 'string' ? final.url : ''
    if (mediaUrl === '' || final?.status !== 'completed') throw Object.assign(new Error(`Agnes video is not ready (status ${String(final?.status ?? '?')})`), { status: 400 })
    const response = await fetchImpl(mediaUrl, { signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS), redirect: 'error' })
    if (!response.ok) throw Object.assign(new Error(`Agnes video download returned HTTP ${String(response.status)}`), { status: 502 })
    const bytes = Buffer.from(await response.arrayBuffer())
    const videoName = safeName(args?.output_name) ?? `agnes-video-${videoId}-${randomUUID().slice(0, 8)}`
    const path = join(config.outputDir, `${videoName}.mp4`)
    await writeFile(path, bytes)
    return { provider: 'agnes', video_id: videoId, path, bytes: bytes.byteLength, media_type: 'video/mp4' }
  }

  const tools = [
    tool('agnes_media_models', 'List free Agnes flash image/video generation models (requires the local AGNES_API_KEY credential).', {}, models, (value) => [
      `Agnes free media (${value?.credential_ready === true ? 'credential ready' : 'credential missing'}):`,
      ...(value?.images ?? []).map((row) => `- image ${row.id} (${(row.supported_sizes ?? []).join('/')})`),
      ...(value?.videos ?? []).map((row) => `- video ${row.id} (${(row.supported_sizes ?? []).join('/')})`),
    ].join('\n'), () => ({ card: 'generic', title: 'Agnes media models', kind: 'search', rawInput: {} })),
    tool('agnes_generate_image', 'Generate a free Agnes flash image (1K-4K, ratio) and save it locally.', {
      model: { type: 'string', enum: FREE_IMAGE_MODELS }, prompt: { type: 'string' },
      size: { type: 'string', enum: IMAGE_SIZES }, ratio: { type: 'string', enum: IMAGE_RATIOS }, output_name: { type: 'string' },
    }, image, renderImage, (args) => ({ card: 'generic', title: 'Generate Agnes image', rawInput: args })),
    tool('agnes_generate_video', 'Submit a free Agnes flash 720P video task (async; poll with agnes_video_status).', {
      prompt: { type: 'string' }, seconds: { type: 'integer', minimum: 4, maximum: 12 }, aspect_ratio: { type: 'string', enum: VIDEO_RATIOS },
    }, video, (value) => `Agnes video submitted: ${String(value?.id ?? '?')} (${String(value?.status ?? '?')})`, (args) => ({ card: 'generic', title: 'Generate Agnes video', rawInput: args })),
    tool('agnes_video_status', 'Poll an Agnes video task.', { video_id: { type: 'string' } }, status, (value) => JSON.stringify(value), (args) => ({ card: 'generic', title: 'Agnes video status', rawInput: args })),
    tool('agnes_video_download', 'Download a completed Agnes video to the local media output directory.', { video_id: { type: 'string' }, output_name: { type: 'string' } }, download, (value) => `Agnes video saved: ${String(value?.path ?? '?')}`, (args) => ({ card: 'generic', title: 'Download Agnes video', rawInput: args })),
  ]

  const routes = new Map([
    ['agnes/models', async () => { await keyProbe; return models() }],
    ['agnes/images/generate', image],
    ['agnes/videos/generate', video],
    ['agnes/videos/status', status],
    ['agnes/videos/download', download],
  ])
  return { enabled: true, config, tools, routes }
}

function tool(name, description, properties, execute, render, presentCall) {
  const required = name === 'agnes_generate_image'
    ? ['prompt']
    : ['video_id', 'prompt'].filter((field) => properties[field] !== undefined)
  return {
    name,
    description,
    parameters: { type: 'object', additionalProperties: false, properties, required },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: render(value) }] },
    isConcurrencySafe: () => true,
    presentCall,
    execute,
  }
}

function decodeImage(record) {
  if (record === null || typeof record !== 'object') return undefined
  if (typeof record.b64_json === 'string' && record.b64_json !== '') return Buffer.from(record.b64_json, 'base64')
  return undefined
}

function renderImage(value) {
  const files = Array.isArray(value?.files) ? value.files : []
  return [`Agnes image saved (${String(value?.model ?? '?')}):`, ...files.map((file) => `- ${file.path} (${String(file.bytes)} bytes)`)].join('\n')
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} must be a non-empty string`)
  return value.trim()
}

function clampInteger(value, min, max, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Math.trunc(Number(value))
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`seconds must be an integer between ${String(min)} and ${String(max)}`)
  return parsed
}

function safeName(value) {
  if (value === undefined || value === null) return null
  const name = String(value).trim().replace(/[^\w.-]+/gu, '-')
  return name === '' ? null : name.replace(/^\.+/u, '')
}

function truncate(text) {
  return String(text).slice(0, 200)
}
