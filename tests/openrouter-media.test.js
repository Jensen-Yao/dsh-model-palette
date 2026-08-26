import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerOpenRouterMedia } from '../src/openrouter-media.js'

describe('OpenRouter media registration', () => {
  it('registers five tools through Cordis effects', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'dsh-model-palette-'))
    const toolNames = []
    const effectLabels = []
    const ctx = {
      effect(factory, label) {
        effectLabels.push(label)
        return factory()
      },
      tools: {
        register(tool) {
          toolNames.push(tool.name)
          return () => {}
        },
      },
    }

    try {
      registerOpenRouterMedia(ctx, {
        credentialRef: 'OPENROUTER_API_KEY',
        outputDir,
        allowPaidImages: false,
        allowPaidVideos: false,
        preferredImageModels: [],
        preferredVideoModels: [],
      })
    } finally {
      rmSync(outputDir, { recursive: true, force: true })
    }

    expect(toolNames).toEqual([
      'openrouter_media_models',
      'openrouter_generate_image',
      'openrouter_generate_video',
      'openrouter_video_status',
      'openrouter_download_video',
    ])
    expect(effectLabels).toHaveLength(5)
  })

  it('rejects a relative output directory before registration', () => {
    expect(() => registerOpenRouterMedia({ tools: {}, effect() {} }, {
      credentialRef: 'OPENROUTER_API_KEY',
      outputDir: 'relative/outputs',
      allowPaidImages: false,
      allowPaidVideos: false,
    })).toThrow('outputDir must be absolute')
  })
})
