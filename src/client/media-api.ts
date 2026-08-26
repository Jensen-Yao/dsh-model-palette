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
  files: Array<{ path: string; media_type: string; bytes: number }>
}

export interface VideoGenerationResult {
  id: string
  status?: string
  model: string
  free_endpoint: boolean
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

export function mediaModelEnabled(model: MediaModel, allowPaid: boolean): boolean {
  return model.free || allowPaid
}

export function pickDefaultMediaModel(models: readonly MediaModel[], allowPaid: boolean): string {
  const available = models.filter((model) => mediaModelEnabled(model, allowPaid))
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
}): Promise<ImageGenerationResult> {
  return mediaApiRequest<ImageGenerationResult>('/images/generate', {
    model: input.model,
    prompt: input.prompt,
    ...(input.outputName === undefined ? {} : { output_name: input.outputName }),
  })
}

export async function generateVideo(input: {
  model: string
  prompt: string
  duration?: number
}): Promise<VideoGenerationResult> {
  return mediaApiRequest<VideoGenerationResult>('/videos/generate', {
    model: input.model,
    prompt: input.prompt,
    ...(input.duration === undefined ? {} : { duration: input.duration }),
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
