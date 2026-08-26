import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, resolve } from 'node:path'

const API_BASE = 'https://openrouter.ai/api/v1'
const MEDIA_API_PATH = '/model-palette/api/media'
const REQUEST_TIMEOUT_MS = 180_000
const DOWNLOAD_TIMEOUT_MS = 600_000
const REQUEST_BODY_LIMIT = 1_048_576
const CREDENTIAL_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

const RESULT_SCHEMA = { type: 'object', additionalProperties: true, properties: {} }
const IMAGE_EXTENSIONS = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
])

export function registerOpenRouterMedia(ctx, rawConfig) {
  const config = resolveConfig(rawConfig)
  mkdirSync(config.outputDir, { recursive: true })
  const tools = {
    models: modelsTool(ctx, config),
    image: imageTool(ctx, config),
    video: videoSubmitTool(ctx, config),
    status: videoStatusTool(ctx, config),
    download: videoDownloadTool(ctx, config),
  }
  ctx.effect(() => ctx.tools.register(tools.models), 'dsh-model-palette: OpenRouter media catalog tool')
  ctx.effect(() => ctx.tools.register(tools.image), 'dsh-model-palette: OpenRouter image tool')
  ctx.effect(() => ctx.tools.register(tools.video), 'dsh-model-palette: OpenRouter video submit tool')
  ctx.effect(() => ctx.tools.register(tools.status), 'dsh-model-palette: OpenRouter video status tool')
  ctx.effect(() => ctx.tools.register(tools.download), 'dsh-model-palette: OpenRouter video download tool')
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: MEDIA_API_PATH,
    handler: createMediaApiHandler({
      models: (args, signal) => tools.models.execute(args, { signal }),
      image: (args, signal) => tools.image.execute(args, { signal }),
      video: (args, signal) => tools.video.execute(args, { signal }),
      status: (args, signal) => tools.status.execute(args, { signal }),
      download: (args, signal) => tools.download.execute(args, { signal }),
    }),
  }), 'dsh-model-palette: direct media API')
}

export function createMediaApiHandler(actions) {
  const routes = new Map([
    [`${MEDIA_API_PATH}/models`, actions.models],
    [`${MEDIA_API_PATH}/images/generate`, actions.image],
    [`${MEDIA_API_PATH}/videos/generate`, actions.video],
    [`${MEDIA_API_PATH}/videos/status`, actions.status],
    [`${MEDIA_API_PATH}/videos/download`, actions.download],
  ])
  return async (req, res) => {
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, error: { message: 'method not allowed' } })
      return
    }
    if (!isTrustedBrowserRequest(req)) {
      writeJson(res, 403, { ok: false, error: { message: 'cross-site request rejected' } })
      return
    }
    if (!String(req.headers['content-type'] ?? '').toLocaleLowerCase().startsWith('application/json')) {
      writeJson(res, 415, { ok: false, error: { message: 'application/json is required' } })
      return
    }
    let pathname
    try {
      pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
    } catch {
      writeJson(res, 400, { ok: false, error: { message: 'invalid request path' } })
      return
    }
    const action = routes.get(pathname)
    if (action === undefined) {
      writeJson(res, 404, { ok: false, error: { message: 'unknown media action' } })
      return
    }
    const controller = new AbortController()
    const abort = () => controller.abort()
    req.once('aborted', abort)
    try {
      const value = await action(await readJsonBody(req), controller.signal)
      writeJson(res, 200, { ok: true, value })
    } catch (error) {
      writeJson(res, mediaErrorStatus(error), { ok: false, error: { message: errorMessage(error) } })
    } finally {
      req.removeListener('aborted', abort)
    }
  }
}

function isTrustedBrowserRequest(req) {
  const site = req.headers['sec-fetch-site']
  return site === undefined || site === 'same-origin' || site === 'same-site' || site === 'none'
}

async function readJsonBody(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (Buffer.byteLength(text) > REQUEST_BODY_LIMIT) throw new Error('request body is too large')
  }
  if (text.trim() === '') return {}
  try { return JSON.parse(text) } catch { throw new Error('request body must be valid JSON') }
}

function writeJson(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

function mediaErrorStatus(error) {
  const message = errorMessage(error)
  if (message.startsWith('OpenRouter ')) return 502
  if (message.includes('not configured in DSH')) return 503
  return 400
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function resolveConfig(rawConfig) {
  const credentialRef = requireString(rawConfig.credentialRef, 'credentialRef')
  if (!CREDENTIAL_PATTERN.test(credentialRef)) throw new TypeError(`credentialRef must match ${String(CREDENTIAL_PATTERN)}`)
  const rawOutputDir = requireString(rawConfig.outputDir, 'outputDir')
  if (!isAbsolute(rawOutputDir)) throw new TypeError('outputDir must be absolute')
  const outputDir = resolve(rawOutputDir)
  return {
    credentialRef,
    outputDir,
    allowPaidImages: requireBoolean(rawConfig.allowPaidImages, 'allowPaidImages'),
    allowPaidVideos: requireBoolean(rawConfig.allowPaidVideos, 'allowPaidVideos'),
    preferredImageModels: optionalStringArray(rawConfig.preferredImageModels, 'preferredImageModels'),
    preferredVideoModels: optionalStringArray(rawConfig.preferredVideoModels, 'preferredVideoModels'),
  }
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${field} must be a non-empty string`)
  return value.trim()
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be boolean`)
  return value
}

function optionalStringArray(value, field) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new TypeError(`${field} must be a string array`)
  const normalized = value.map((entry) => requireString(entry, field))
  if (new Set(normalized).size !== normalized.length) throw new TypeError(`${field} contains duplicates`)
  return normalized
}

function modelsTool(ctx, config) {
  return {
    name: 'openrouter_media_models',
    description: 'Inspect live OpenRouter image/video generation models and pricing without generating media.',
    parameters: {
      type: 'object', additionalProperties: false, properties: {
        kind: { type: 'string', enum: ['image', 'video', 'all'] },
        preferred_only: { type: 'boolean' },
        free_only: { type: 'boolean' },
      },
    },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: renderModels(value) }] },
    isConcurrencySafe: () => true,
    presentCall: (args) => ({ card: 'generic', title: 'OpenRouter media models', kind: 'search', rawInput: args }),
    async execute(args, exec) {
      const kind = args?.kind ?? 'all'
      if (!['image', 'video', 'all'].includes(kind)) throw new Error('kind must be image, video, or all')
      const preferredOnly = args?.preferred_only === true
      const freeOnly = args?.free_only === true
      const result = {
        kind,
        preferred_only: preferredOnly,
        free_only: freeOnly,
        paid_images_enabled: config.allowPaidImages,
        paid_videos_enabled: config.allowPaidVideos,
        images: [],
        videos: [],
      }
      if (kind === 'image' || kind === 'all') result.images = await listImages(ctx, config, preferredOnly, freeOnly, exec.signal)
      if (kind === 'video' || kind === 'all') result.videos = await listVideos(ctx, config, preferredOnly, freeOnly, exec.signal)
      return result
    },
  }
}

function imageTool(ctx, config) {
  return {
    name: 'openrouter_generate_image',
    description: 'Generate or edit images through OpenRouter POST /api/v1/images and save returned bytes locally. Paid generation obeys plugin configuration.',
    parameters: {
      type: 'object', additionalProperties: false, properties: {
        model: { type: 'string' }, prompt: { type: 'string' }, resolution: { type: 'string' },
        aspect_ratio: { type: 'string' }, quality: { type: 'string' }, output_format: { type: 'string' },
        n: { type: 'integer', minimum: 1, maximum: 8 },
        reference_images: { type: 'array', items: { type: 'string' }, maxItems: 8 },
        output_name: { type: 'string' },
      }, required: ['model', 'prompt'],
    },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: renderImageResult(value) }] },
    isConcurrencySafe: () => true,
    presentCall: (args) => ({ card: 'generic', title: 'Generate OpenRouter image', rawInput: args }),
    async execute(args, exec) {
      const model = requireString(args?.model, 'model')
      const prompt = requireString(args?.prompt, 'prompt')
      const catalog = await imageCatalog(ctx, config, exec.signal)
      const entry = catalog.find((candidate) => candidate.id === model)
      if (!entry) throw new Error(`OpenRouter image model not found: ${model}`)
      const endpoints = await imageEndpoints(ctx, config, entry, exec.signal)
      const freeEndpoint = endpoints.find((endpoint) => imageEndpointIsFree(endpoint) && typeof endpoint.provider_tag === 'string' && endpoint.provider_tag !== '')
      if (!freeEndpoint && !config.allowPaidImages) throw new Error(`Paid image generation is disabled. ${pricingText(model, endpoints)}`)

      const body = { model, prompt }
      copyOptional(body, args, ['resolution', 'aspect_ratio', 'quality', 'output_format', 'n'])
      if (Array.isArray(args.reference_images) && args.reference_images.length > 0) {
        body.input_references = await Promise.all(args.reference_images.map(async (source) => ({
          type: 'image_url', image_url: { url: await imageSource(source) },
        })))
      }
      if (freeEndpoint) body.provider = { only: [freeEndpoint.provider_tag], allow_fallbacks: false }
      const response = await apiJson(ctx, config, '/images', { method: 'POST', body, signal: exec.signal })
      const records = Array.isArray(response.data) ? response.data : []
      if (records.length === 0) throw new Error('OpenRouter returned no images')
      const files = []
      for (let index = 0; index < records.length; index += 1) {
        const record = records[index]
        const mediaType = typeof record.media_type === 'string' ? record.media_type : 'image/png'
        const bytes = await imageBytes(record, ctx, config, exec.signal)
        const path = outputPath(config.outputDir, args.output_name, IMAGE_EXTENSIONS.get(mediaType) ?? '.img', index, records.length)
        await writeFile(path, bytes)
        files.push({ path, media_type: mediaType, bytes: bytes.byteLength })
      }
      return { model, free_endpoint: Boolean(freeEndpoint), files, usage: response.usage ?? null }
    },
  }
}

function videoSubmitTool(ctx, config) {
  return {
    name: 'openrouter_generate_video',
    description: 'Submit asynchronous OpenRouter video generation. Poll with openrouter_video_status, then download with openrouter_download_video.',
    parameters: {
      type: 'object', additionalProperties: false, properties: {
        model: { type: 'string' }, prompt: { type: 'string' }, duration: { type: 'integer', minimum: 1, maximum: 60 },
        resolution: { type: 'string' }, aspect_ratio: { type: 'string' }, size: { type: 'string' },
        generate_audio: { type: 'boolean' }, seed: { type: 'integer' }, first_frame: { type: 'string' },
        last_frame: { type: 'string' }, reference_images: { type: 'array', items: { type: 'string' }, maxItems: 8 },
      }, required: ['model', 'prompt'],
    },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: `Submitted video job ${value.id}; status=${value.status}.` }] },
    isConcurrencySafe: () => true,
    presentCall: (args) => ({ card: 'generic', title: 'Submit OpenRouter video', rawInput: args }),
    async execute(args, exec) {
      const model = requireString(args?.model, 'model')
      const prompt = requireString(args?.prompt, 'prompt')
      const catalog = await videoCatalog(ctx, config, exec.signal)
      const entry = catalog.find((candidate) => candidate.id === model)
      if (!entry) throw new Error(`OpenRouter video model not found: ${model}`)
      const free = videoModelIsFree(entry)
      if (!free && !config.allowPaidVideos) throw new Error(`Paid video generation is disabled. ${JSON.stringify(entry.pricing_skus ?? {})}`)
      const body = { model, prompt }
      copyOptional(body, args, ['duration', 'resolution', 'aspect_ratio', 'size', 'generate_audio', 'seed'])
      const frames = []
      if (typeof args.first_frame === 'string' && args.first_frame.trim() !== '') frames.push({ type: 'image_url', image_url: { url: await imageSource(args.first_frame) }, frame_type: 'first_frame' })
      if (typeof args.last_frame === 'string' && args.last_frame.trim() !== '') frames.push({ type: 'image_url', image_url: { url: await imageSource(args.last_frame) }, frame_type: 'last_frame' })
      if (frames.length > 0) body.frame_images = frames
      if (frames.length === 0 && Array.isArray(args.reference_images) && args.reference_images.length > 0) {
        body.input_references = await Promise.all(args.reference_images.map(async (source) => ({ type: 'image_url', image_url: { url: await imageSource(source) } })))
      }
      const response = await apiJson(ctx, config, '/videos', { method: 'POST', body, signal: exec.signal })
      return { id: response.id, polling_url: response.polling_url, status: response.status, model, free_endpoint: free, pricing_skus: entry.pricing_skus ?? {} }
    },
  }
}

function videoStatusTool(ctx, config) {
  return {
    name: 'openrouter_video_status', description: 'Poll an existing OpenRouter video job without creating a new generation charge.',
    parameters: { type: 'object', additionalProperties: false, properties: { job_id: { type: 'string' } }, required: ['job_id'] },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }] },
    isConcurrencySafe: () => true,
    async execute(args, exec) { return apiJson(ctx, config, `/videos/${encodeURIComponent(safeJobId(args?.job_id))}`, { signal: exec.signal }) },
  }
}

function videoDownloadTool(ctx, config) {
  return {
    name: 'openrouter_download_video', description: 'Download a completed OpenRouter video job to the configured output directory.',
    parameters: { type: 'object', additionalProperties: false, properties: { job_id: { type: 'string' }, output_name: { type: 'string' } }, required: ['job_id'] },
    output: { schema: RESULT_SCHEMA, render: (_args, value) => [{ type: 'text', text: `Video saved to ${value.path} (${value.bytes} bytes).` }] },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const jobId = safeJobId(args?.job_id)
      const status = await apiJson(ctx, config, `/videos/${encodeURIComponent(jobId)}`, { signal: exec.signal })
      if (status.status !== 'completed') throw new Error(`Video job ${jobId} is ${String(status.status ?? 'unknown')}`)
      const response = await apiFetch(ctx, config, `/videos/${encodeURIComponent(jobId)}/content`, { signal: exec.signal, timeoutMs: DOWNLOAD_TIMEOUT_MS })
      const bytes = Buffer.from(await response.arrayBuffer())
      const mediaType = response.headers.get('content-type')
      const extension = mediaType?.includes('webm') ? '.webm' : mediaType?.includes('quicktime') ? '.mov' : '.mp4'
      const path = outputPath(config.outputDir, args.output_name ?? jobId, extension, 0, 1)
      await writeFile(path, bytes)
      return { job_id: jobId, path, bytes: bytes.byteLength, media_type: mediaType }
    },
  }
}

async function listImages(ctx, config, preferredOnly, freeOnly, signal) {
  const preferred = new Set(config.preferredImageModels)
  let catalog = await imageCatalog(ctx, config, signal)
  if (preferredOnly) catalog = catalog.filter((entry) => preferred.has(entry.id))
  const records = await mapLimit(catalog, 6, async (entry) => {
    const endpoints = await imageEndpoints(ctx, config, entry, signal)
    return { id: entry.id, name: entry.name, preferred: preferred.has(entry.id), free: endpoints.some(imageEndpointIsFree), architecture: entry.architecture ?? null, supported_parameters: entry.supported_parameters ?? {}, pricing: endpoints.map((endpoint) => ({ provider: endpoint.provider_tag ?? endpoint.provider_name ?? null, pricing: endpoint.pricing ?? null })) }
  })
  return freeOnly ? records.filter((entry) => entry.free) : records
}

async function listVideos(ctx, config, preferredOnly, freeOnly, signal) {
  const preferred = new Set(config.preferredVideoModels)
  let catalog = await videoCatalog(ctx, config, signal)
  if (preferredOnly) catalog = catalog.filter((entry) => preferred.has(entry.id))
  const records = catalog.map((entry) => ({ id: entry.id, name: entry.name, preferred: preferred.has(entry.id), free: videoModelIsFree(entry), pricing_skus: entry.pricing_skus ?? {}, supported_resolutions: entry.supported_resolutions ?? [], supported_aspect_ratios: entry.supported_aspect_ratios ?? [], supported_durations: entry.supported_durations ?? [] }))
  return freeOnly ? records.filter((entry) => entry.free) : records
}

async function imageCatalog(ctx, config, signal) {
  const response = await apiJson(ctx, config, '/images/models', { signal })
  return Array.isArray(response.data) ? response.data : []
}

async function imageEndpoints(ctx, config, entry, signal) {
  const path = typeof entry.endpoints === 'string' ? entry.endpoints.replace(/^https:\/\/openrouter\.ai/u, '').replace(/^\/api\/v1/u, '') : `/images/models/${entry.id}/endpoints`
  const response = await apiJson(ctx, config, path, { signal })
  return Array.isArray(response.endpoints) ? response.endpoints : []
}

async function videoCatalog(ctx, config, signal) {
  const response = await apiJson(ctx, config, '/videos/models', { signal })
  return Array.isArray(response.data) ? response.data : []
}

function imageEndpointIsFree(endpoint) {
  const lines = Array.isArray(endpoint.pricing) ? endpoint.pricing : endpoint.pricing ? [endpoint.pricing] : []
  return lines.length > 0 && lines.every((line) => Number(line?.cost_usd) === 0)
}

function videoModelIsFree(entry) {
  const values = Object.values(entry.pricing_skus ?? {})
  return values.length > 0 && values.every((value) => Number(value) === 0)
}

function pricingText(model, endpoints) {
  return `${model}: ${JSON.stringify(endpoints.map((endpoint) => ({ provider: endpoint.provider_tag ?? endpoint.provider_name ?? 'unknown', pricing: endpoint.pricing ?? null })))}`
}

async function apiJson(ctx, config, path, options = {}) {
  const response = await apiFetch(ctx, config, path, options)
  const text = await response.text()
  if (text.trim() === '') return {}
  try { return JSON.parse(text) } catch { throw new Error(`OpenRouter returned invalid JSON: ${text.slice(0, 500)}`) }
}

async function apiFetch(ctx, config, path, options = {}) {
  const resolved = await ctx.credentials.resolve(config.credentialRef)
  if (!resolved) throw new Error(`Credential ${config.credentialRef} is not configured in DSH`)
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${resolved.value}`)
  headers.set('Accept', 'application/json')
  headers.set('X-Title', 'DSH Model Palette OpenRouter Media')
  const body = options.body === undefined ? undefined : JSON.stringify(options.body)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const timeout = AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const url = path.startsWith('https://') ? path : `${API_BASE}${path}`
  const response = await fetch(url, { method: options.method ?? 'GET', headers, body, signal, redirect: 'follow' })
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`OpenRouter ${response.status} ${response.statusText}: ${message.slice(0, 1000)}`)
  }
  return response
}

async function imageSource(rawSource) {
  const source = requireString(rawSource, 'image source')
  if (/^https?:\/\//iu.test(source) || /^data:image\//iu.test(source)) return source
  if (!isAbsolute(source)) throw new Error(`Local image path must be absolute: ${source}`)
  const bytes = await readFile(source)
  const mediaType = localImageType(extname(source))
  return `data:${mediaType};base64,${bytes.toString('base64')}`
}

function localImageType(extension) {
  switch (extension.toLocaleLowerCase()) {
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    case '.png': return 'image/png'
    default: throw new Error(`Unsupported image extension: ${extension || '(none)'}`)
  }
}

async function imageBytes(record, ctx, config, signal) {
  if (typeof record.b64_json === 'string' && record.b64_json !== '') return Buffer.from(record.b64_json, 'base64')
  if (typeof record.url === 'string' && record.url !== '') {
    const response = await apiFetch(ctx, config, record.url, { signal, timeoutMs: DOWNLOAD_TIMEOUT_MS })
    return Buffer.from(await response.arrayBuffer())
  }
  throw new Error('Image record contains neither b64_json nor url')
}

function outputPath(outputDir, rawName, extension, index, total) {
  const requested = typeof rawName === 'string' && rawName.trim() !== '' ? rawName.trim() : `openrouter-${Date.now()}-${randomUUID().slice(0, 8)}`
  if (basename(requested) !== requested || requested === '.' || requested === '..') throw new Error('output_name must not contain directories')
  const sourceExtension = extname(requested)
  const stem = requested.slice(0, sourceExtension === '' ? requested.length : -sourceExtension.length).replace(/[^A-Za-z0-9._-]+/gu, '-')
  return join(outputDir, `${stem}${total > 1 ? `-${index + 1}` : ''}${extension}`)
}

function safeJobId(value) {
  const jobId = requireString(value, 'job_id')
  if (!/^[A-Za-z0-9._-]+$/u.test(jobId)) throw new Error('job_id contains invalid characters')
  return jobId
}

function copyOptional(target, source, keys) {
  for (const key of keys) if (source?.[key] !== undefined) target[key] = source[key]
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

function renderModels(value) {
  const lines = [`Paid images: ${value.paid_images_enabled ? 'enabled' : 'blocked'}`, `Paid videos: ${value.paid_videos_enabled ? 'enabled' : 'blocked'}`]
  for (const model of value.images ?? []) lines.push(`image ${model.id}: free=${model.free}`)
  for (const model of value.videos ?? []) lines.push(`video ${model.id}: free=${model.free}`)
  return lines.join('\n')
}

function renderImageResult(value) {
  const lines = [`Generated ${value.files?.length ?? 0} image(s) with ${value.model}.`]
  for (const file of value.files ?? []) lines.push(`${file.path} (${file.media_type}, ${file.bytes} bytes)`)
  if (value.usage?.cost !== undefined) lines.push(`Reported cost: $${value.usage.cost}`)
  return lines.join('\n')
}
