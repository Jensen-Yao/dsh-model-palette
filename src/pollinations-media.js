/**
 * Keyless Pollinations image generation for the media panel.
 *
 * Pollinations serves URL-based generation without any credential; this module
 * wraps it behind the same tool + HTTP action surface as the OpenRouter media
 * backend so additional providers can follow the same shape.
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

const DEFAULT_IMAGE_BASE = 'https://image.pollinations.ai'
const DEFAULT_MODEL = 'flux'
const REQUEST_TIMEOUT_MS = 180_000
const RESULT_SCHEMA = { type: 'object', additionalProperties: true, properties: {} }
const IMAGE_EXTENSIONS = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
])

/**
 * Resolve the Pollinations section of the media config.
 * `enabled: false` opts out; baseURL is overridable for proxies.
 */
export function resolvePollinationsConfig(source) {
  const section = source?.pollinations === undefined || source?.pollinations === null ? {} : source.pollinations
  const baseURL = section.baseURL === undefined || section.baseURL === '' ? DEFAULT_IMAGE_BASE : String(section.baseURL).replace(/\/+$/u, '')
  const outputDir = section.outputDir === undefined || section.outputDir === ''
    ? join(homedir(), '.dsh', 'media-output')
    : String(section.outputDir)
  if (!isAbsolute(outputDir)) throw new TypeError('pollinations.outputDir must be absolute')
  return {
    enabled: section.enabled === undefined ? true : section.enabled === true,
    baseURL,
    outputDir: resolve(outputDir),
  }
}

/** Build the Pollinations tools and HTTP actions for the media registration. */
export function createPollinationsMedia(ctx, mediaConfig, fetchImpl = fetch) {
  const config = resolvePollinationsConfig(mediaConfig)
  if (!config.enabled) return { enabled: false, config, tools: [], routes: new Map() }
  mkdirSync(config.outputDir, { recursive: true })

  const models = async (_args, signal) => {
    const rows = await pollinationsModels(config, fetchImpl, signal)
    return { provider: 'pollinations', free: true, models: rows }
  }

  const image = async (args, signal) => {
    const prompt = requireString(args?.prompt, 'prompt')
    const model = args?.model === undefined || args?.model === '' ? DEFAULT_MODEL : requireString(args.model, 'model')
    const width = boundedDimension(args?.width, 'width', 1024)
    const height = boundedDimension(args?.height, 'height', 1024)
    const seed = args?.seed === undefined ? '' : `&seed=${encodeURIComponent(String(Math.trunc(Number(args.seed)) || 0))}`
    const url = `${config.baseURL}/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}&width=${String(width)}&height=${String(height)}&nologo=true${seed}`
    const response = await fetchImpl(url, { signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS), redirect: 'error' })
    if (!response.ok) throw Object.assign(new Error(`Pollinations image generation returned HTTP ${String(response.status)}`), { status: 502 })
    const mediaType = String(response.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!mediaType.startsWith('image/')) {
      throw Object.assign(new Error(`Pollinations returned ${mediaType === '' ? 'no' : 'a non-image'} content type${mediaType === '' ? '' : ` (${mediaType})`}`), { status: 502 })
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength === 0) throw Object.assign(new Error('Pollinations returned an empty image'), { status: 502 })
    const suffix = IMAGE_EXTENSIONS.get(mediaType) ?? '.img'
    const name = outputName(args?.output_name) ?? `pollinations-${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID().slice(0, 8)}`
    const path = join(config.outputDir, `${name}${suffix}`)
    await writeFile(path, bytes)
    return {
      provider: 'pollinations',
      model,
      free_endpoint: true,
      manual_paid_override: false,
      files: [{ path, media_type: mediaType, bytes: bytes.byteLength }],
    }
  }

  const tools = [
    {
      name: 'pollinations_media_models',
      description: 'List keyless Pollinations image generation models. No credential is required.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
      output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: renderModels(value) }] },
      isConcurrencySafe: () => true,
      presentCall: (args) => ({ card: 'generic', title: 'Pollinations media models', kind: 'search', rawInput: args }),
      execute: models,
    },
    {
      name: 'pollinations_generate_image',
      description: 'Generate an image through keyless Pollinations (no API key) and save the bytes locally.',
      parameters: {
        type: 'object', additionalProperties: false, properties: {
          prompt: { type: 'string' }, model: { type: 'string' },
          width: { type: 'integer', minimum: 64, maximum: 2048 },
          height: { type: 'integer', minimum: 64, maximum: 2048 },
          seed: { type: 'integer' }, output_name: { type: 'string' },
        },
        required: ['prompt'],
      },
      output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: renderImageResult(value) }] },
      isConcurrencySafe: () => true,
      presentCall: (args) => ({ card: 'generic', title: 'Generate Pollinations image', rawInput: args }),
      execute: image,
    },
  ]

  const routes = new Map([
    ['pollinations/models', models],
    ['pollinations/images/generate', image],
  ])
  return { enabled: true, config, tools, routes }
}

async function pollinationsModels(config, fetchImpl, signal) {
  const response = await fetchImpl(`${config.baseURL}/models`, {
    headers: { accept: 'application/json' },
    signal: signal ?? AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  if (!response.ok) throw Object.assign(new Error(`Pollinations model list returned HTTP ${String(response.status)}`), { status: 502 })
  const payload = await response.json()
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  const seen = new Set()
  const models = []
  for (const row of rows) {
    const id = typeof row === 'string' ? row : typeof row?.name === 'string' ? row.name : typeof row?.id === 'string' ? row.id : ''
    if (id.trim() === '' || seen.has(id)) continue
    seen.add(id)
    models.push({ id, ...(typeof row?.description === 'string' && row.description.trim() !== '' ? { description: row.description.trim() } : {}), free: true })
  }
  return models
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} must be a non-empty string`)
  return value.trim()
}

function boundedDimension(value, field, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Math.trunc(Number(value))
  if (!Number.isInteger(parsed) || parsed < 64 || parsed > 2048) throw new Error(`${field} must be an integer between 64 and 2048`)
  return parsed
}

function outputName(value) {
  if (value === undefined || value === null) return null
  const name = String(value).trim().replace(/[^\w.-]+/gu, '-')
  return name === '' ? null : name.replace(/^\.+/u, '')
}

function renderModels(value) {
  const rows = Array.isArray(value?.models) ? value.models : []
  return [`Pollinations keyless image models (${String(rows.length)}):`, ...rows.map((row) => `- ${row.id}`)].join('\n')
}

function renderImageResult(value) {
  const files = Array.isArray(value?.files) ? value.files : []
  return [`Pollinations image saved (${value?.model ?? '?'}):`, ...files.map((file) => `- ${file.path} (${String(file.bytes)} bytes)`)].join('\n')
}
