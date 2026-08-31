import type {
  ClientRemote,
  CredentialInfo,
  LlmDiscoveredModel,
  LlmModelDiscoveryRequest,
  RemoteResult,
  SettingsDescribeValue,
  SettingsNamespaceView,
  SettingsPathOpView,
} from '@deepseek-ai/dsh-api-remotes/client'

interface LegacyResponse<T> {
  result: RemoteResult<T>
}

interface SettingsMutationRequest {
  ns: string
  ops: PaletteSettingsPathOp[]
  expectedRevision?: number
}

type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }

type PaletteSettingsPathOp =
  | { op: 'set'; path: string[]; value: unknown }
  | { op: 'unset'; path: string[] }

interface ModelDiscoveryRequest extends LlmModelDiscoveryRequest {
  settingsNs: string
}

/** Existing palette API surface backed by DSH alpha.3 generated Remotes. */
export interface PaletteApi {
  settings: {
    describe(request: Record<string, never>): Promise<LegacyResponse<SettingsDescribeValue>>
    mutate(request: SettingsMutationRequest): Promise<LegacyResponse<SettingsNamespaceView>>
  }
  credentials: {
    describe(request: { refs: string[] }): Promise<LegacyResponse<{ credentials: Record<string, CredentialInfo> }>>
    set(request: { ref: string; value: string }): Promise<LegacyResponse<void>>
  }
  llm: {
    discoverModels(request: ModelDiscoveryRequest): Promise<LegacyResponse<{ models: LlmDiscoveredModel[] }>>
    models(request: Record<string, never>): Promise<LegacyResponse<unknown>>
  }
}

function jsonValue(value: unknown, location: string): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${location} must contain only finite JSON numbers`)
    return value
  }
  if (Array.isArray(value)) return value.map((item, index) => jsonValue(item, `${location}[${index}]`))
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item, `${location}.${key}`)]))
  }
  throw new TypeError(`${location} must be JSON-compatible`)
}

function settingsPathOps(ops: PaletteSettingsPathOp[]): SettingsPathOpView[] {
  return ops.map((op, index) => op.op === 'unset'
    ? { op: 'unset', path: [...op.path] }
    : { op: 'set', path: [...op.path], value: jsonValue(op.value, `settings operation ${index} value`) })
}

/** Adapt DSH alpha.3 positional Remote methods to the palette's request objects. */
export function paletteApi(remote: ClientRemote): PaletteApi {
  return {
    settings: {
      describe: async () => ({ result: await remote.settings.describe() }),
      mutate: async request => ({
        result: await remote.settings.mutate(request.ns, settingsPathOps(request.ops), request.expectedRevision),
      }),
    },
    credentials: {
      describe: async request => {
        const result = await remote.credentials.describe(request.refs)
        return {
          result: result.ok
            ? { ok: true, value: { credentials: result.value } }
            : result,
        }
      },
      set: async request => ({ result: await remote.credentials.set(request.ref, request.value) }),
    },
    llm: {
      discoverModels: async ({ settingsNs, ...request }) => {
        const result = await remote.llm.discoverModels(settingsNs, request)
        return {
          result: result.ok
            ? { ok: true, value: { models: result.value } }
            : result,
        }
      },
      models: async () => ({ result: await remote.session.modelCatalog() }),
    },
  }
}
