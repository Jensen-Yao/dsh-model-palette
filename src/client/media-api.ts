import { MANUAL_PAID_ACKNOWLEDGEMENT } from '../media-protocol.ts'

export interface MediaModel {
  id: string
  name?: string
  preferred: boolean
  free: boolean
  supported_resolutions?: string[]
  supported_aspect_ratios?: string[]
  supported_durations?: number[]
}

export interface MediaCatalog {
  images: MediaModel[]
  videos: MediaModel[]
  paid_images_enabled: boolean
  paid_videos_enabled: boolean
}

export interface ImageGenerationResult {
  model: string
  free_endpoint: boolean
  manual_paid_override: boolean
  files: Array<{ path: string; media_type: string; bytes: number }>
}

export interface VideoGenerationResult {
  id: string
  status?: string
  model: string
  free_endpoint: boolean
  manual_paid_override: boolean
}

export interface VideoDownloadResult {
  job_id: string
  path: string
  bytes: number
  media_type?: string | null
}

interface MediaApiSuccess<T> {
  ok: true
  value: T
}

interface MediaApiFailure {
  ok: false
  error?: { message?: string }
}

const API_BASE = '/model-palette/api/media'

export function mediaModelNeedsConfirmation(model: MediaModel, allowPaid: boolean): boolean {
  return !model.free && !allowPaid
}

export function pickDefaultMediaModel(models: readonly MediaModel[], allowPaid: boolean): string {
  const available = models.filter((model) => !mediaModelNeedsConfirmation(model, allowPaid))
  return available.find((model) => model.free && model.preferred)?.id
    ?? available.find((model) => model.free)?.id
    ?? available.find((model) => model.preferred)?.id
    ?? available[0]?.id
    ?? ''
}

export async function listMediaModels(): Promise<MediaCatalog> {
  return mediaApiRequest<MediaCatalog>('/models', { kind: 'all', preferred_only: false, free_only: false })
}

export async function generateImage(input: {
  model: string
  prompt: string
  outputName?: string
  acknowledgePossibleCharge?: boolean
}): Promise<ImageGenerationResult> {
  return mediaApiRequest<ImageGenerationResult>('/images/generate', {
    model: input.model,
    prompt: input.prompt,
    ...(input.outputName === undefined ? {} : { output_name: input.outputName }),
    ...(input.acknowledgePossibleCharge === true ? { manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT } : {}),
  })
}

export async function generateVideo(input: {
  model: string
  prompt: string
  duration?: number
  acknowledgePossibleCharge?: boolean
}): Promise<VideoGenerationResult> {
  return mediaApiRequest<VideoGenerationResult>('/videos/generate', {
    model: input.model,
    prompt: input.prompt,
    ...(input.duration === undefined ? {} : { duration: input.duration }),
    ...(input.acknowledgePossibleCharge === true ? { manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT } : {}),
  })
}

export async function getVideoStatus(jobId: string): Promise<Record<string, unknown>> {
  return mediaApiRequest<Record<string, unknown>>('/videos/status', { job_id: jobId })
}

export async function downloadVideo(jobId: string, outputName?: string): Promise<VideoDownloadResult> {
  return mediaApiRequest<VideoDownloadResult>('/videos/download', {
    job_id: jobId,
    ...(outputName === undefined ? {} : { output_name: outputName }),
  })
}

export interface PollinationsModel {
  id: string
  description?: string
  free: true
}

export interface PollinationsImageResult {
  provider: 'pollinations'
  model: string
  free_endpoint: boolean
  manual_paid_override: boolean
  files: Array<{ path: string; media_type: string; bytes: number }>
}

/** List keyless Pollinations image models (no credential involved). */
export async function listPollinationsModels(): Promise<PollinationsModel[]> {
  const value = await mediaApiRequest<{ models: PollinationsModel[] }>('/pollinations/models', {})
  return value.models
}

/** Generate an image through keyless Pollinations and save it locally. */
export async function generatePollinationsImage(input: {
  prompt: string
  model?: string
  width?: number
  height?: number
  seed?: number
  outputName?: string
}): Promise<PollinationsImageResult> {
  return mediaApiRequest<PollinationsImageResult>('/pollinations/images/generate', {
    prompt: input.prompt,
    ...(input.model === undefined || input.model === '' ? {} : { model: input.model }),
    ...(input.width === undefined ? {} : { width: input.width }),
    ...(input.height === undefined ? {} : { height: input.height }),
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    ...(input.outputName === undefined || input.outputName.trim() === '' ? {} : { output_name: input.outputName.trim() }),
  })
}

export interface AgnesMediaModels {
  provider: 'agnes'
  free: true
  credential_ready: boolean
  images: Array<{ id: string; free: true; supported_sizes?: string[]; supported_ratios?: string[] }>
  videos: Array<{ id: string; free: true; supported_sizes?: string[]; supported_durations?: number[]; supported_aspect_ratios?: string[] }>
}

export interface AgnesImageResult {
  provider: 'agnes'
  model: string
  free_endpoint: boolean
  manual_paid_override: boolean
  files: Array<{ path: string; media_type: string; bytes: number }>
}

export interface AgnesVideoSubmitResult {
  provider: 'agnes'
  id: string
  status?: string
  model: string
  free_endpoint: boolean
  manual_paid_override: boolean
}

export interface AgnesVideoDownloadResult {
  provider: 'agnes'
  video_id: string
  path: string
  bytes: number
  media_type?: string
}

/** List the free Agnes flash media models (local key required). */
export async function listAgnesMediaModels(): Promise<AgnesMediaModels> {
  return mediaApiRequest<AgnesMediaModels>('/agnes/models', {})
}

/** Generate a free Agnes flash image and save it locally. */
export async function generateAgnesImage(input: {
  model?: string
  prompt: string
  size?: string
  ratio?: string
  outputName?: string
}): Promise<AgnesImageResult> {
  return mediaApiRequest<AgnesImageResult>('/agnes/images/generate', {
    prompt: input.prompt,
    ...(input.model === undefined || input.model === '' ? {} : { model: input.model }),
    ...(input.size === undefined || input.size === '' ? {} : { size: input.size }),
    ...(input.ratio === undefined || input.ratio === '' ? {} : { ratio: input.ratio }),
    ...(input.outputName === undefined || input.outputName.trim() === '' ? {} : { output_name: input.outputName.trim() }),
  })
}

/** Submit a free Agnes flash 720P video task (async). */
export async function generateAgnesVideo(input: {
  prompt: string
  seconds?: number
  aspect_ratio?: string
}): Promise<AgnesVideoSubmitResult> {
  return mediaApiRequest<AgnesVideoSubmitResult>('/agnes/videos/generate', {
    prompt: input.prompt,
    ...(input.seconds === undefined ? {} : { seconds: input.seconds }),
    ...(input.aspect_ratio === undefined || input.aspect_ratio === '' ? {} : { aspect_ratio: input.aspect_ratio }),
  })
}

/** Poll an Agnes video task. */
export async function getAgnesVideoStatus(videoId: string): Promise<Record<string, unknown>> {
  return mediaApiRequest<Record<string, unknown>>('/agnes/videos/status', { video_id: videoId })
}

/** Download a completed Agnes video. */
export async function downloadAgnesVideo(videoId: string, outputName?: string): Promise<AgnesVideoDownloadResult> {
  return mediaApiRequest<AgnesVideoDownloadResult>('/agnes/videos/download', {
    video_id: videoId,
    ...(outputName === undefined || outputName.trim() === '' ? {} : { output_name: outputName.trim() }),
  })
}

export async function mediaApiRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  let payload: MediaApiSuccess<T> | MediaApiFailure
  try {
    payload = await response.json() as MediaApiSuccess<T> | MediaApiFailure
  } catch {
    throw new Error(`Media API returned HTTP ${response.status}`)
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? `Media API returned HTTP ${response.status}` : payload.error?.message ?? `Media API returned HTTP ${response.status}`)
  }
  return payload.value
}
