/** Stable Skin Center v2 bridge for opening the model palette from a skin. */
export const MODEL_PALETTE_PLUGIN_ID = 'dsh-model-palette'
export const MODEL_PALETTE_OPEN_EVENT = 'dsh-model-palette:open'
export const MODEL_PALETTE_READY_EVENT = 'dsh-model-palette:ready'
export const MODEL_PALETTE_GLOBAL_KEY = '__DSH_MODEL_PALETTE__'
export const MODEL_PALETTE_SKIN_BRIDGE_VERSION = 2
const MODEL_PALETTE_BRIDGE_KEY = '__dshModelPaletteBridge'

export type ModelPaletteView = 'models' | 'media' | 'config'

export interface ModelPaletteApi {
  readonly id: typeof MODEL_PALETTE_PLUGIN_ID
  readonly skinBridgeVersion: typeof MODEL_PALETTE_SKIN_BRIDGE_VERSION
  readonly ready: boolean
  /**
   * Open a palette view or queue it until a usable palette instance mounts.
   * @param view - Palette view requested by the skin.
   * @returns Whether a mounted palette accepted the request immediately.
   */
  open(view?: ModelPaletteView): boolean
}

export interface ModelPaletteGlobalTarget {
  [MODEL_PALETTE_GLOBAL_KEY]?: ModelPaletteApi
}

declare global {
  interface Window extends ModelPaletteGlobalTarget {}
}

export interface ModelPaletteEventTarget extends ModelPaletteGlobalTarget {
  addEventListener(type: string, listener: EventListener): void
  dispatchEvent(event: Event): boolean
  removeEventListener(type: string, listener: EventListener): void
}

interface InternalModelPaletteApi extends ModelPaletteApi {
  [MODEL_PALETTE_BRIDGE_KEY]?: ModelPaletteSkinBridge
}

export interface ModelPaletteSkinBridge {
  readonly api: ModelPaletteApi
  /**
   * Register one mounted palette instance.
   * @param open - Opens the requested view and reports whether this instance can serve it.
   * @returns A disposer that removes exactly this instance.
   */
  register(open: (view: ModelPaletteView) => boolean): () => void
  dispose(): void
}

function normalizeView(value: unknown): ModelPaletteView {
  return value === 'media' || value === 'config' || value === 'models' ? value : 'models'
}

function eventView(event: Event): ModelPaletteView {
  const detail = (event as CustomEvent<unknown>).detail
  if (typeof detail !== 'object' || detail === null) return 'models'
  return normalizeView((detail as { view?: unknown }).view)
}

/**
 * Install the page-level bridge consumed by Skin Center v2 hooks.
 * Requests are routed to the newest usable palette instance and retained when
 * the composer has not mounted yet or its current instance is unavailable.
 * @param target - Browser window or an EventTarget-compatible test target.
 * @returns The installed bridge and its lifecycle disposer.
 */
export function installModelPaletteSkinBridge(target: ModelPaletteEventTarget): ModelPaletteSkinBridge {
  const previous = target[MODEL_PALETTE_GLOBAL_KEY] as InternalModelPaletteApi | undefined
  const previousBridge = previous?.id === MODEL_PALETTE_PLUGIN_ID
    ? previous[MODEL_PALETTE_BRIDGE_KEY]
    : undefined
  if (typeof previousBridge?.dispose === 'function') previousBridge.dispose()
  const launchers: Array<(view: ModelPaletteView) => boolean> = []
  const restored = target[MODEL_PALETTE_GLOBAL_KEY]
  const restorable = restored?.id === MODEL_PALETTE_PLUGIN_ID ? undefined : restored
  let pending: ModelPaletteView | undefined
  let disposed = false

  const openMounted = (view: ModelPaletteView): boolean => {
    for (let index = launchers.length - 1; index >= 0; index -= 1) {
      if (launchers[index]?.(view) === true) return true
    }
    return false
  }

  const requestOpen = (view: ModelPaletteView = 'models'): boolean => {
    const normalized = normalizeView(view)
    if (openMounted(normalized)) {
      pending = undefined
      return true
    }
    pending = normalized
    return false
  }

  const api: ModelPaletteApi = {
    id: MODEL_PALETTE_PLUGIN_ID,
    skinBridgeVersion: MODEL_PALETTE_SKIN_BRIDGE_VERSION,
    get ready() {
      return launchers.length > 0
    },
    open: requestOpen,
  }

  const listener: EventListener = (event) => {
    if (target[MODEL_PALETTE_GLOBAL_KEY] !== api) return
    requestOpen(eventView(event))
  }

  const bridge: ModelPaletteSkinBridge = {
    api,
    register(open) {
      if (disposed) return () => {}
      launchers.push(open)
      if (pending !== undefined && openMounted(pending)) pending = undefined
      target.dispatchEvent(new Event(MODEL_PALETTE_READY_EVENT))
      return () => {
        const index = launchers.lastIndexOf(open)
        if (index !== -1) launchers.splice(index, 1)
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      launchers.length = 0
      pending = undefined
      target.removeEventListener(MODEL_PALETTE_OPEN_EVENT, listener)
      const current = api as InternalModelPaletteApi
      delete current[MODEL_PALETTE_BRIDGE_KEY]
      if (target[MODEL_PALETTE_GLOBAL_KEY] !== api) return
      if (restorable === undefined || restorable === api) delete target[MODEL_PALETTE_GLOBAL_KEY]
      else target[MODEL_PALETTE_GLOBAL_KEY] = restorable
    },
  }
  Object.defineProperty(api, MODEL_PALETTE_BRIDGE_KEY, { configurable: true, value: bridge })
  target[MODEL_PALETTE_GLOBAL_KEY] = api
  target.addEventListener(MODEL_PALETTE_OPEN_EVENT, listener)

  return bridge
}
