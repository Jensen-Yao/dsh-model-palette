export type MediaModelKind = 'image' | 'video' | 'all'

export interface ImageRequest {
  prompt: string
  model?: string
  outputName?: string
}

export interface VideoRequest {
  prompt: string
  model?: string
  duration?: number
}

function required(value: string, field: string): string {
  const normalized = value.trim()
  if (normalized === '') throw new Error(`${field} is required`)
  return normalized
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized === undefined || normalized === '' ? undefined : normalized
}

export function mediaModelsRequest(kind: MediaModelKind): string {
  return [
    '请调用 `openrouter_media_models` 查询 OpenRouter 媒体模型。',
    `参数：${JSON.stringify({ kind, preferred_only: false, free_only: true })}。`,
    '请用简洁表格列出模型 ID、类型、是否为首选模型和可用规格，不要发起生成。',
  ].join('\n')
}

export function imageGenerationRequest(input: ImageRequest): string {
  const prompt = required(input.prompt, 'prompt')
  const model = optional(input.model)
  const outputName = optional(input.outputName)
  const generation = {
    ...(model === undefined ? {} : { model }),
    prompt,
    ...(outputName === undefined ? {} : { output_name: outputName }),
  }
  if (model !== undefined) {
    return [
      '请调用 `openrouter_generate_image` 生成图像。',
      `参数：${JSON.stringify(generation)}。`,
      '完成后告诉我生成文件的绝对路径。',
    ].join('\n')
  }
  return [
    '请完成一次 OpenRouter 免费图像生成。',
    `生成要求：${JSON.stringify(generation)}。`,
    '先调用 `openrouter_media_models`，参数为 {"kind":"image","preferred_only":true,"free_only":true}；如果没有结果，再把 preferred_only 改为 false 查询。',
    '从结果中选择当前可用的免费模型，再调用 `openrouter_generate_image`。不要改用付费模型。完成后告诉我生成文件的绝对路径。',
  ].join('\n')
}

export function videoGenerationRequest(input: VideoRequest): string {
  const prompt = required(input.prompt, 'prompt')
  const model = optional(input.model)
  if (input.duration !== undefined && (!Number.isInteger(input.duration) || input.duration < 1 || input.duration > 60)) {
    throw new Error('duration must be an integer from 1 to 60')
  }
  const generation = {
    ...(model === undefined ? {} : { model }),
    prompt,
    ...(input.duration === undefined ? {} : { duration: input.duration }),
  }
  if (model !== undefined) {
    return [
      '请调用 `openrouter_generate_video` 提交视频生成任务。',
      `参数：${JSON.stringify(generation)}。`,
      '提交后告诉我任务 ID 和当前状态，不要自动重复提交。',
    ].join('\n')
  }
  return [
    '请完成一次 OpenRouter 免费视频生成任务提交。',
    `生成要求：${JSON.stringify(generation)}。`,
    '先调用 `openrouter_media_models`，参数为 {"kind":"video","preferred_only":true,"free_only":true}；如果没有结果，再把 preferred_only 改为 false 查询。',
    '从结果中选择当前可用的免费模型，再调用 `openrouter_generate_video`。不要改用付费模型。提交后告诉我任务 ID 和当前状态，不要自动重复提交。',
  ].join('\n')
}

export function videoStatusRequest(jobId: string): string {
  return [
    '请调用 `openrouter_video_status` 查询视频任务。',
    `参数：${JSON.stringify({ job_id: required(jobId, 'job_id') })}。`,
    '请报告任务状态；如果尚未完成，不要重新提交生成任务。',
  ].join('\n')
}

export function videoDownloadRequest(jobId: string, outputName?: string): string {
  const normalizedOutputName = optional(outputName)
  const args = {
    job_id: required(jobId, 'job_id'),
    ...(normalizedOutputName === undefined ? {} : { output_name: normalizedOutputName }),
  }
  return [
    '请调用 `openrouter_download_video` 下载已完成的视频任务。',
    `参数：${JSON.stringify(args)}。`,
    '完成后告诉我视频文件的绝对路径。',
  ].join('\n')
}
