import { describe, expect, it } from 'vitest'
import {
  installModelPaletteSkinBridge,
  MODEL_PALETTE_GLOBAL_KEY,
  MODEL_PALETTE_OPEN_EVENT,
  MODEL_PALETTE_READY_EVENT,
  MODEL_PALETTE_PLUGIN_ID,
  MODEL_PALETTE_SKIN_BRIDGE_VERSION,
  type ModelPaletteApi,
} from '../src/client/skin-v2.ts'

interface TestTarget extends EventTarget {
  [MODEL_PALETTE_GLOBAL_KEY]?: ModelPaletteApi
}

describe('Skin Center v2 bridge', () => {
  it('publishes a versioned page API', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)

    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBe(bridge.api)
    expect(bridge.api.id).toBe(MODEL_PALETTE_PLUGIN_ID)
    expect(bridge.api.skinBridgeVersion).toBe(MODEL_PALETTE_SKIN_BRIDGE_VERSION)
    expect(bridge.api.ready).toBe(false)
    bridge.dispose()
  })

  it('queues a skin event until a usable palette mounts', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    const opened: string[] = []

    target.dispatchEvent(new CustomEvent(MODEL_PALETTE_OPEN_EVENT, { detail: { view: 'media' } }))
    expect(bridge.register((view) => {
      opened.push(view)
      return true
    })).toBeTypeOf('function')

    expect(opened).toEqual(['media'])
    expect(bridge.api.ready).toBe(true)
    bridge.dispose()
  })

  it('queues a direct API request and clears it after a later mount', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    const opened: string[] = []

    expect(bridge.api.open('config')).toBe(false)
    const remove = bridge.register((view) => {
      opened.push(view)
      return true
    })

    expect(opened).toEqual(['config'])
    remove()
    expect(bridge.api.open('media')).toBe(false)
    bridge.dispose()
  })

  it('announces readiness for skins that activate before the palette mounts', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    let readyEvents = 0
    target.addEventListener(MODEL_PALETTE_READY_EVENT, () => {
      readyEvents += 1
    })

    bridge.register(() => true)

    expect(readyEvents).toBe(1)
    bridge.dispose()
  })

  it('falls back through mounted instances and normalizes unknown views', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    const opened: string[] = []
    bridge.register((view) => {
      opened.push(`usable:${view}`)
      return true
    })
    bridge.register((view) => {
      opened.push(`locked:${view}`)
      return false
    })

    target.dispatchEvent(new CustomEvent(MODEL_PALETTE_OPEN_EVENT, { detail: { view: 'unsupported' } }))

    expect(opened).toEqual(['locked:models', 'usable:models'])
    bridge.dispose()
  })

  it('removes one registered instance without disturbing the others', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    const opened: string[] = []
    bridge.register(() => {
      opened.push('first')
      return true
    })
    const removeSecond = bridge.register(() => {
      opened.push('second')
      return true
    })

    removeSecond()
    expect(bridge.api.open('config')).toBe(true)
    expect(opened).toEqual(['first'])
    bridge.dispose()
  })

  it('restores a foreign page API but removes a stale palette bridge', () => {
    const foreign = { id: 'another-plugin', skinBridgeVersion: 1, ready: true, open: () => true }
    const target = Object.assign(new EventTarget(), {
      [MODEL_PALETTE_GLOBAL_KEY]: foreign,
    }) as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    bridge.dispose()
    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBe(foreign)

    const stale: ModelPaletteApi = {
      id: MODEL_PALETTE_PLUGIN_ID,
      skinBridgeVersion: MODEL_PALETTE_SKIN_BRIDGE_VERSION,
      ready: false,
      open: () => false,
    }
    target[MODEL_PALETTE_GLOBAL_KEY] = stale
    const replacement = installModelPaletteSkinBridge(target)
    replacement.dispose()
    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBeUndefined()
  })

  it('keeps only the newest bridge after a repeated installation', () => {
    const target = new EventTarget() as TestTarget
    const first = installModelPaletteSkinBridge(target)
    let firstOpens = 0
    first.register(() => {
      firstOpens += 1
      return true
    })

    const second = installModelPaletteSkinBridge(target)
    let secondOpens = 0
    second.register(() => {
      secondOpens += 1
      return true
    })

    target.dispatchEvent(new CustomEvent(MODEL_PALETTE_OPEN_EVENT))

    expect(firstOpens).toBe(0)
    expect(secondOpens).toBe(1)
    first.dispose()
    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBe(second.api)
    second.dispose()
  })

  it('restores a foreign API after replacing a bridge that replaced it', () => {
    const foreign = { id: 'another-plugin', skinBridgeVersion: 1, ready: true, open: () => true }
    const target = Object.assign(new EventTarget(), {
      [MODEL_PALETTE_GLOBAL_KEY]: foreign,
    }) as TestTarget
    const first = installModelPaletteSkinBridge(target)
    const second = installModelPaletteSkinBridge(target)

    first.dispose()
    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBe(second.api)
    second.dispose()
    expect(target[MODEL_PALETTE_GLOBAL_KEY]).toBe(foreign)
  })

  it('ignores events after disposal', () => {
    const target = new EventTarget() as TestTarget
    const bridge = installModelPaletteSkinBridge(target)
    let opens = 0
    bridge.register(() => {
      opens += 1
      return true
    })
    bridge.dispose()

    target.dispatchEvent(new Event(MODEL_PALETTE_OPEN_EVENT))
    expect(opens).toBe(0)
  })
})
