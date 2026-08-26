import { describe, expect, it } from 'vitest'
import {
  imageGenerationRequest,
  mediaModelsRequest,
  videoDownloadRequest,
  videoGenerationRequest,
  videoStatusRequest,
} from '../src/client/media.ts'

describe('media shortcut requests', () => {
  it('builds free-only model catalog requests', () => {
    const request = mediaModelsRequest('all')
    expect(request).toContain('openrouter_media_models')
    expect(request).toContain('"kind":"all"')
    expect(request).toContain('"free_only":true')
  })

  it('uses an explicit image model without a catalog lookup', () => {
    const request = imageGenerationRequest({ prompt: 'cat', model: 'vendor/model', outputName: 'cat-one' })
    expect(request).toContain('openrouter_generate_image')
    expect(request).toContain('"model":"vendor/model"')
    expect(request).not.toContain('preferred_only')
  })

  it('asks the agent to select a free model when omitted', () => {
    const image = imageGenerationRequest({ prompt: 'cat' })
    const video = videoGenerationRequest({ prompt: 'sunset', duration: 5 })
    expect(image).toContain('openrouter_media_models')
    expect(image).toContain('不要改用付费模型')
    expect(video).toContain('openrouter_generate_video')
    expect(video).toContain('"duration":5')
  })

  it('builds status and download requests with the same job id', () => {
    expect(videoStatusRequest('job-1')).toContain('"job_id":"job-1"')
    expect(videoDownloadRequest('job-1', 'clip')).toContain('"output_name":"clip"')
  })

  it('rejects blank prompts, blank job ids, and invalid duration', () => {
    expect(() => imageGenerationRequest({ prompt: ' ' })).toThrow('prompt is required')
    expect(() => videoGenerationRequest({ prompt: 'clip', duration: 0 })).toThrow('duration')
    expect(() => videoStatusRequest(' ')).toThrow('job_id is required')
  })
})
