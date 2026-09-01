import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CredentialInfo, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import {
  fetchOpenRouterFreeModels,
  probeProviderModelProtocols,
  probeProviderProtocols,
  resolveProviderModels,
  revealCredential,
  validateProviderApiKeys,
  validateProviderApiKey,
  type ApiKeyValidationResult,
  type BatchApiKeyValidationResult,
  type ModelProtocolProbeResult,
  type OpenRouterFreeModelCatalog,
  type ProtocolProbeResult,
} from './config-api.ts'
import {
  CREDENTIAL_REF_PATTERN,
  PROVIDER_ID_PATTERN,
  REASONING_LEVELS,
  applyMissingPresets,
  applyReasoningDispatchDefaults,
  applyUniversalReasoningDefaults,
  applyUniversalReasoningToProvider,
  compatValue,
  deriveCredentialRef,
  duplicateModelIds,
  duplicateModelTemplate,
  inputMode,
  importSelectedOpenRouterFreeModels,
  isRecord,
  materializeProviderModels,
  mergeDiscoveredModelsWithPresets,
  modelRecords,
  nextProviderCopyId,
  providerProfiles,
  repairProviderCompatibility,
  reasoningEffortsValue,
  setCompatField,
  setInputMode,
  setOptionalPositiveInteger,
  setOptionalString,
  setReasoningEffort,
  setReasoningMode,
  splitProviderByProtocol,
  stringField,
  type ProviderRetryRule,
} from './model-config.ts'
import {
  BUNDLED_PRESET_REGISTRY,
  applyModelPreset,
  loadOnlinePresetRegistry,
  matchModelPreset,
  type ModelPreset,
  type ModelPresetRegistry,
} from './model-presets.ts'
import type { PaletteApi } from './remote-compat.ts'

interface ConfigPanelProps {
  api: PaletteApi
  isLoopback: boolean
  t: (key: string, params?: Record<string, unknown>) => string
}

const SETTINGS_NAMESPACE = 'llm-pi-ai'
const RETRY_SETTINGS_NAMESPACE = 'dsh-model-palette'
const MAX_REQUEST_RETRIES = 1_000
const PROTOCOL_SCAN_BATCH_SIZE = 100
const PROTOCOLS = ['openai-completions', 'openai-responses', 'anthropic-messages'] as const
const THINKING_FORMATS = [
  'openai', 'deepseek', 'openrouter', 'together', 'zai', 'qwen',
  'chat-template', 'qwen-chat-template', 'string-thinking', 'ant-ling',
] as const
const LEGAL_API_KEY = /^[\x21-\x7E]+$/

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function cloneProfile(value: unknown): Record<string, unknown> {
  return isRecord(value) ? structuredClone(value) : { api: 'openai-responses', models: [] }
}

type RequestRetryDraft = ProviderRetryRule

function requestRetryProfiles(value: unknown): Record<string, Record<string, unknown>> {
  if (!isRecord(value) || !isRecord(value.requestRetries) || !isRecord(value.requestRetries.providers)) return {}
  return Object.fromEntries(Object.entries(value.requestRetries.providers)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1])))
}

function cloneRequestRetryDraft(value: unknown): RequestRetryDraft {
  if (!isRecord(value)) return { enabled: false, maxRetries: 0, models: {} }
  const models = isRecord(value.models)
    ? Object.fromEntries(Object.entries(value.models).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isInteger(entry[1]) && entry[1] >= 0 && entry[1] <= MAX_REQUEST_RETRIES))
    : {}
  return {
    enabled: value.enabled !== false,
    maxRetries: typeof value.maxRetries === 'number' && Number.isInteger(value.maxRetries) && value.maxRetries >= 0 && value.maxRetries <= MAX_REQUEST_RETRIES
      ? value.maxRetries
      : 0,
    models,
  }
}

function requestRetrySignature(value: RequestRetryDraft): string {
  return JSON.stringify(value)
}

function parseRequestRetryCount(value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_REQUEST_RETRIES) {
    throw new Error(`request retries must be an integer from 0 to ${MAX_REQUEST_RETRIES}`)
  }
  return parsed
}

function modelRetryMode(value: RequestRetryDraft, modelId: string): 'inherit' | 'disabled' | 'custom' {
  if (!Object.hasOwn(value.models, modelId)) return 'inherit'
  return value.models[modelId] === 0 ? 'disabled' : 'custom'
}

function positiveIntegerText(value: unknown): string {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? String(value) : ''
}

function booleanChoice(value: unknown): string {
  return value === true ? 'true' : value === false ? 'false' : ''
}

function sourcePreset(model: Record<string, unknown>, presets: readonly ModelPreset[]): ModelPreset | undefined {
  return typeof model.id === 'string' ? matchModelPreset(model.id, presets) : undefined
}

function draftSignature(providerId: string, draft: Record<string, unknown>): string {
  return JSON.stringify({ providerId, draft })
}

function apiKeyValidationLabel(status: ApiKeyValidationResult['status'] | 'missing'): string {
  switch (status) {
    case 'valid': return 'config.apiKeyValidationValid'
    case 'invalid': return 'config.apiKeyValidationInvalid'
    case 'blocked': return 'config.apiKeyValidationBlocked'
    case 'unavailable': return 'config.apiKeyValidationUnavailable'
    case 'unknown': return 'config.apiKeyValidationUnknown'
    case 'missing': return 'config.apiKeyValidationMissing'
  }
}

function protocolClassificationLabel(classification: ModelProtocolProbeResult['classification']): string {
  switch (classification) {
    case 'responses-preferred': return 'config.protocolScanResponses'
    case 'completions-only': return 'config.protocolScanCompletionsOnly'
    case 'both': return 'config.protocolScanBoth'
    case 'unsupported': return 'config.protocolScanUnsupported'
  }
}

function protocolProbeFailureFeedback(results: readonly ProtocolProbeResult[]): string {
  if (results.some(result => result.failure === 'authentication')) return 'config.protocolProbeAuthentication'
  if (results.some(result => result.failure === 'blocked')) return 'config.protocolProbeBlocked'
  if (results.some(result => result.failure === 'unavailable' || result.failure === 'transport')) return 'config.protocolProbeTransient'
  return 'config.protocolProbeNone'
}

function firstConfiguredModelId(profile: Record<string, unknown>): string {
  const declared = modelRecords(profile).find(model => typeof model.id === 'string' && model.id.trim() !== '')
  if (typeof declared?.id === 'string') return declared.id.trim()
  const overrides = isRecord(profile.modelOverrides) ? Object.keys(profile.modelOverrides) : []
  return overrides.find(id => id.trim() !== '')?.trim() ?? ''
}

function liveCatalogCandidates(value: unknown): Record<string, Record<string, unknown>[]> {
  if (!isRecord(value) || !Array.isArray(value.groups)) return {}
  return Object.fromEntries(value.groups.filter(isRecord).flatMap(group => {
    const provider = stringField(group, 'id')
    if (provider === '' || !Array.isArray(group.models)) return []
    const models = group.models.filter(isRecord).flatMap(model => {
      const id = stringField(model, 'id').trim()
      if (id === '') return []
      return [{
        id,
        ...(stringField(model, 'name') === '' ? {} : { name: stringField(model, 'name') }),
      }]
    })
    return [[provider, models]]
  }))
}

function mergeCatalogOverrides(
  models: readonly Record<string, unknown>[],
  profile: Record<string, unknown>,
): Record<string, unknown>[] {
  const overrides = isRecord(profile.modelOverrides) ? profile.modelOverrides : {}
  const merged = new Map(models.map((model) => {
    const id = stringField(model, 'id')
    const configured = overrides[id]
    return [id, {
      ...structuredClone(model),
      ...(isRecord(configured) ? structuredClone(configured) : {}),
      id,
    }]
  }))
  for (const [id, value] of Object.entries(overrides)) {
    if (!merged.has(id) && isRecord(value)) merged.set(id, { id, ...structuredClone(value) })
  }
  return [...merged.values()]
}

const MODEL_OVERRIDE_FIELDS = ['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts', 'compat'] as const

function catalogOverrides(
  catalog: readonly Record<string, unknown>[],
  models: readonly Record<string, unknown>[],
): Record<string, Record<string, unknown>> | undefined {
  const catalogIds = new Set(catalog.map(model => stringField(model, 'id')))
  const modelIds = new Set(models.flatMap(model => typeof model.id === 'string' && model.id.trim() !== '' ? [model.id.trim()] : []))
  if (catalogIds.size !== modelIds.size || [...catalogIds].some(id => !modelIds.has(id))) return undefined
  const defaults = new Map(catalog.map(model => [stringField(model, 'id'), model] as const))
  const overrides: Record<string, Record<string, unknown>> = {}
  for (const model of models) {
    const id = typeof model.id === 'string' ? model.id.trim() : ''
    const base = defaults.get(id)
    if (base === undefined) return undefined
    const override: Record<string, unknown> = {}
    for (const field of MODEL_OVERRIDE_FIELDS) {
      if (model[field] !== undefined && JSON.stringify(model[field]) !== JSON.stringify(base[field])) {
        override[field] = structuredClone(model[field])
      }
    }
    if (Object.keys(override).length > 0) overrides[id] = override
  }
  return overrides
}

function mergeModelCandidates(...groups: readonly (readonly Record<string, unknown>[])[]): Record<string, unknown>[] {
  const merged = new Map<string, Record<string, unknown>>()
  for (const group of groups) {
    for (const candidate of group) {
      const id = stringField(candidate, 'id')
      if (id !== '') merged.set(id, { ...(merged.get(id) ?? { id }), ...structuredClone(candidate), id })
    }
  }
  return [...merged.values()]
}

function isOpenRouterProfile(providerId: string, profile: Record<string, unknown>): boolean {
  if (providerId.toLocaleLowerCase().includes('openrouter')) return true
  try {
    const hostname = new URL(stringField(profile, 'baseURL')).hostname.toLocaleLowerCase()
    return hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai')
  } catch {
    return false
  }
}

export function ConfigPanel({ api, isLoopback, t }: ConfigPanelProps) {
  const [namespace, setNamespace] = useState<SettingsNamespaceView | null>(null)
  const [retryNamespace, setRetryNamespace] = useState<SettingsNamespaceView | null>(null)
  const [providerId, setProviderId] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({ api: 'openai-responses', models: [] })
  const [baselineSignature, setBaselineSignature] = useState('')
  const [retryDraft, setRetryDraft] = useState<RequestRetryDraft>({ enabled: false, maxRetries: 0, models: {} })
  const [retryBaselineSignature, setRetryBaselineSignature] = useState('')
  const [previousProviderId, setPreviousProviderId] = useState('')
  const [modelQuery, setModelQuery] = useState('')
  const [credential, setCredential] = useState<CredentialInfo | null>(null)
  const [keyDraft, setKeyDraft] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [registry, setRegistry] = useState<ModelPresetRegistry>(BUNDLED_PRESET_REGISTRY)
  const [presetState, setPresetState] = useState<'bundled' | 'loading' | 'online' | 'error'>('bundled')
  const [manualPresets, setManualPresets] = useState<Record<number, string>>({})
  const [protocolResults, setProtocolResults] = useState<ProtocolProbeResult[] | null>(null)
  const [modelProtocolResults, setModelProtocolResults] = useState<ModelProtocolProbeResult[] | null>(null)
  const [protocolTestModelId, setProtocolTestModelId] = useState('')
  const [apiKeyValidation, setApiKeyValidation] = useState<ApiKeyValidationResult | null>(null)
  const [batchApiKeyValidation, setBatchApiKeyValidation] = useState<BatchApiKeyValidationResult[] | null>(null)
  const [openRouterFreeCatalog, setOpenRouterFreeCatalog] = useState<OpenRouterFreeModelCatalog | null>(null)
  const [openRouterFreeSelection, setOpenRouterFreeSelection] = useState<string[]>([])
  const [openRouterFreeQuery, setOpenRouterFreeQuery] = useState('')
  const [liveCatalogModels, setLiveCatalogModels] = useState<Record<string, Record<string, unknown>[]>>({})
  const [busy, setBusy] = useState<'load' | 'save' | 'delete' | 'probe' | 'openrouter-free' | 'protocol-probe' | 'protocol-scan' | 'protocol-split' | 'api-key-validation' | 'api-key-batch' | 'reveal' | 'presets' | null>('load')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const profiles = useMemo(
    () => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value),
    [namespace],
  )
  const providerIds = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles])
  const explicitModels = useMemo(() => modelRecords(draft), [draft])
  const models = useMemo(() => explicitModels.length > 0
    ? explicitModels
    : mergeCatalogOverrides(liveCatalogModels[providerId] ?? [], draft), [draft, explicitModels, liveCatalogModels, providerId])
  const catalogBacked = !creating && explicitModels.length === 0
  const compatibilityRepair = useMemo(() => repairProviderCompatibility(draft), [draft])
  const visibleModels = useMemo(() => {
    const query = modelQuery.trim().toLocaleLowerCase()
    return models.map((model, index) => ({ model, index })).filter(({ model }) => query === '' || [model.id, model.name]
      .some(value => typeof value === 'string' && value.toLocaleLowerCase().includes(query)))
  }, [modelQuery, models])
  const protocol = stringField(draft, 'api')
  const protocolTestModel = models.find(model => model.id === protocolTestModelId)
    ?? models.find(model => typeof model.id === 'string' && model.id.trim() !== '')
  const protocolTestModelValue = typeof protocolTestModel?.id === 'string' ? protocolTestModel.id : ''
  const hasApiKey = keyDraft.trim() !== '' || credential?.configured === true
  const recommendedProtocol = protocolResults?.filter(result => result.available).length === 1
    ? protocolResults.find(result => result.available)?.protocol
    : undefined
  const credentialRef = stringField(draft, 'apiKeyEnv') || deriveCredentialRef(providerId || 'provider')
  const retryDirty = retryBaselineSignature !== '' && requestRetrySignature(retryDraft) !== retryBaselineSignature
  const dirty = baselineSignature !== '' && (draftSignature(providerId, draft) !== baselineSignature || keyDraft !== '' || retryDirty)
  const batchProblemCount = batchApiKeyValidation?.filter(result => result.status !== 'valid').length ?? 0
  const openRouterProfile = isOpenRouterProfile(providerId, draft)
  const configuredModelIds = useMemo(() => new Set([
    ...models.flatMap(model => typeof model.id === 'string' ? [model.id] : []),
    ...(isRecord(draft.modelOverrides) ? Object.keys(draft.modelOverrides) : []),
  ]), [draft, models])
  const visibleOpenRouterFreeModels = useMemo(() => {
    const query = openRouterFreeQuery.trim().toLocaleLowerCase()
    return (openRouterFreeCatalog?.models ?? []).filter(model => query === '' || [model.id, model.name]
      .some(value => typeof value === 'string' && value.toLocaleLowerCase().includes(query)))
  }, [openRouterFreeCatalog, openRouterFreeQuery])
  const modelProtocolSummary = useMemo(() => ({
    responses: modelProtocolResults?.filter(result => result.classification === 'responses-preferred' || result.classification === 'both').length ?? 0,
    completionsOnly: modelProtocolResults?.filter(result => result.classification === 'completions-only').length ?? 0,
    unsupported: modelProtocolResults?.filter(result => result.classification === 'unsupported').length ?? 0,
  }), [modelProtocolResults])
  const protocolSplitPreview = useMemo(() => {
    if (modelProtocolResults === null || modelProtocolSummary.responses === 0 || modelProtocolSummary.completionsOnly === 0) return null
    try {
      return splitProviderByProtocol({
        providerId: providerId.trim(),
        profile: materializeProviderModels(draft, models),
        retry: retryDraft,
        completionsOnlyIds: modelProtocolResults.filter(result => result.classification === 'completions-only').map(result => result.model),
        existingProviderIds: providerIds,
      })
    } catch {
      return null
    }
  }, [draft, modelProtocolResults, modelProtocolSummary.completionsOnly, modelProtocolSummary.responses, models, providerId, providerIds, retryDraft])

  const describeCredential = useCallback(async (ref: string) => {
    if (!CREDENTIAL_REF_PATTERN.test(ref)) {
      setCredential(null)
      return
    }
    const response = await api.credentials.describe({ refs: [ref] })
    if (!response.result.ok) throw new Error(response.result.error.message)
    setCredential(response.result.value.credentials[ref] ?? null)
  }, [api.credentials])

  const enrichCatalogModels = useCallback(async (
    id: string,
    current: readonly Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> => {
    const discoveredResponse = await api.llm.discoverModels({ settingsNs: SETTINGS_NAMESPACE, provider: id })
    if (!discoveredResponse.result.ok) throw new Error(discoveredResponse.result.error.message)
    const discovered = discoveredResponse.result.value.models.map(model => ({ ...model }))
    const ids = discovered.flatMap(model => model.id.trim() === '' ? [] : [model.id.trim()])
    const resolved = []
    for (let offset = 0; offset < ids.length; offset += PROTOCOL_SCAN_BATCH_SIZE) {
      resolved.push(...await resolveProviderModels({ provider: id, models: ids.slice(offset, offset + PROTOCOL_SCAN_BATCH_SIZE) }))
    }
    return mergeModelCandidates(current, discovered, resolved)
  }, [api.llm])

  const confirmDiscard = useCallback(() => !dirty || window.confirm(t('config.discardConfirm')), [dirty, t])

  const openProvider = useCallback((
    id: string,
    view: SettingsNamespaceView | null = namespace,
    nextRetryNamespace: SettingsNamespaceView | null = retryNamespace,
  ) => {
    if (view === null || nextRetryNamespace === null) return
    const nextProfiles = providerProfiles(view.user ?? view.value)
    const profile = cloneProfile(nextProfiles[id])
    const nextRetryDraft = cloneRequestRetryDraft(requestRetryProfiles(nextRetryNamespace.value)[id])
    const ref = stringField(profile, 'apiKeyEnv') || deriveCredentialRef(id)
    setProviderId(id)
    setCreating(false)
    setDraft(profile)
    setBaselineSignature(draftSignature(id, profile))
    setRetryDraft(nextRetryDraft)
    setRetryBaselineSignature(requestRetrySignature(nextRetryDraft))
    setPreviousProviderId(id)
    setModelQuery('')
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setProtocolResults(null)
    setModelProtocolResults(null)
    setProtocolTestModelId('')
    setApiKeyValidation(null)
    setOpenRouterFreeCatalog(null)
    setOpenRouterFreeSelection([])
    setOpenRouterFreeQuery('')
    setError(null)
    setFeedback(null)
    void describeCredential(ref).catch(cause => setError(messageOf(cause)))
  }, [describeCredential, namespace, retryNamespace])

  const selectProvider = (id: string) => {
    if (confirmDiscard()) openProvider(id)
  }

  const load = useCallback(async (force = false) => {
    if (!force && !confirmDiscard()) return
    setBusy('load')
    setError(null)
    setBatchApiKeyValidation(null)
    try {
      const response = await api.settings.describe({})
      if (!response.result.ok) throw new Error(response.result.error.message)
      const view = response.result.value.namespaces.find(candidate => candidate.ns === SETTINGS_NAMESPACE)
      if (view === undefined) throw new Error(t('config.namespaceMissing'))
      const nextRetryNamespace = response.result.value.namespaces.find(candidate => candidate.ns === RETRY_SETTINGS_NAMESPACE)
      if (nextRetryNamespace === undefined) throw new Error(t('config.retryNamespaceMissing'))
      const catalogResponse = await api.llm.models({})
      if (!catalogResponse.result.ok) throw new Error(catalogResponse.result.error.message)
      setNamespace(view)
      setRetryNamespace(nextRetryNamespace)
      setLiveCatalogModels(liveCatalogCandidates(catalogResponse.result.value))
      const ids = Object.keys(providerProfiles(view.user ?? view.value)).sort((left, right) => left.localeCompare(right))
      const selected = ids.includes(providerId) ? providerId : ids[0]
      if (selected !== undefined) openProvider(selected, view, nextRetryNamespace)
      else {
        const empty = { api: 'openai-responses', models: [] }
        const emptyRetry = { enabled: false, maxRetries: 0, models: {} }
        setProviderId('')
        setCreating(true)
        setDraft(empty)
        setBaselineSignature(draftSignature('', empty))
        setRetryDraft(emptyRetry)
        setRetryBaselineSignature(requestRetrySignature(emptyRetry))
        setPreviousProviderId('')
        setModelQuery('')
        setProtocolResults(null)
        setModelProtocolResults(null)
        setProtocolTestModelId('')
        setApiKeyValidation(null)
      }
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }, [api.llm, api.settings, confirmDiscard, openProvider, providerId, t])

  const refreshPresets = useCallback(async () => {
    setPresetState('loading')
    setBusy(current => current ?? 'presets')
    try {
      setRegistry(await loadOnlinePresetRegistry())
      setPresetState('online')
    } catch {
      setRegistry(BUNDLED_PRESET_REGISTRY)
      setPresetState('error')
    } finally {
      setBusy(current => current === 'presets' ? null : current)
    }
  }, [])

  useEffect(() => { void load(true) }, [])
  useEffect(() => { void refreshPresets() }, [refreshPresets])
  useEffect(() => {
    if (creating || explicitModels.length > 0 || providerId === '') return
    const current = liveCatalogModels[providerId] ?? []
    void enrichCatalogModels(providerId, current).then((resolved) => {
      setLiveCatalogModels(catalog => ({ ...catalog, [providerId]: resolved }))
    }).catch((cause) => {
      console.error('[dsh-model-palette] catalog metadata resolution failed', cause)
    })
  }, [creating, enrichCatalogModels, explicitModels.length, providerId])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const startCreate = () => {
    if (!confirmDiscard()) return
    const empty = { api: 'openai-responses', models: [] }
    const emptyRetry = { enabled: false, maxRetries: 0, models: {} }
    setPreviousProviderId(creating ? previousProviderId : providerId)
    setCreating(true)
    setProviderId('')
    setDraft(empty)
    setBaselineSignature(draftSignature('', empty))
    setRetryDraft(emptyRetry)
    setRetryBaselineSignature(requestRetrySignature(emptyRetry))
    setModelQuery('')
    setCredential(null)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setProtocolResults(null)
    setModelProtocolResults(null)
    setProtocolTestModelId('')
    setApiKeyValidation(null)
    setOpenRouterFreeCatalog(null)
    setOpenRouterFreeSelection([])
    setOpenRouterFreeQuery('')
    setError(null)
    setFeedback(null)
  }

  const cancelCreate = () => {
    if (!confirmDiscard()) return
    const target = providerIds.includes(previousProviderId) ? previousProviderId : providerIds[0]
    if (target !== undefined) openProvider(target)
  }

  const duplicateProvider = () => {
    const id = nextProviderCopyId(providerId, providerIds)
    const profile = structuredClone(draft)
    profile.apiKeyEnv = deriveCredentialRef(id)
    const displayName = stringField(profile, 'displayName') || providerId
    profile.displayName = t('config.copyName', { name: displayName })
    setPreviousProviderId(providerId)
    setCreating(true)
    setProviderId(id)
    setDraft(profile)
    setRetryDraft(structuredClone(retryDraft))
    setRetryBaselineSignature(requestRetrySignature({ enabled: false, maxRetries: 0, models: {} }))
    setModelQuery('')
    setCredential(null)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setProtocolResults(null)
    setModelProtocolResults(null)
    setApiKeyValidation(null)
    setOpenRouterFreeCatalog(null)
    setOpenRouterFreeSelection([])
    setOpenRouterFreeQuery('')
    setError(null)
    setFeedback(t('config.copyReady'))
  }

  const updateProfileString = (key: string, value: string) => {
    setDraft(current => setOptionalString(current, key, value))
    setProtocolResults(null)
    setModelProtocolResults(null)
    setApiKeyValidation(null)
    if (key === 'apiKeyEnv') {
      setKeyDraft('')
      setKeyVisible(false)
      void describeCredential(value.trim()).catch(cause => setError(messageOf(cause)))
    }
  }

  const setModels = (next: Record<string, unknown>[]) => {
    setDraft(current => materializeProviderModels(current, next))
    setProtocolResults(null)
    setModelProtocolResults(null)
    setApiKeyValidation(null)
  }

  const updateModel = (index: number, next: Record<string, unknown>) => {
    setModels(models.map((model, position) => position === index ? next : model))
  }

  const updateProviderRetryCount = (value: string) => {
    try {
      setRetryDraft(current => ({ ...current, maxRetries: parseRequestRetryCount(value) }))
      setError(null)
    } catch {
      setError(t('config.retryCountInvalid', { max: MAX_REQUEST_RETRIES }))
    }
  }

  const updateModelRetryMode = (modelId: string, mode: 'inherit' | 'disabled' | 'custom') => {
    setRetryDraft((current) => {
      const models = { ...current.models }
      if (mode === 'inherit') delete models[modelId]
      else if (mode === 'disabled') models[modelId] = 0
      else models[modelId] = models[modelId] !== undefined && models[modelId] > 0
        ? models[modelId]
        : current.enabled && current.maxRetries > 0 ? current.maxRetries : 3
      return { ...current, models }
    })
  }

  const updateModelRetryCount = (modelId: string, value: string) => {
    try {
      const maxRetries = parseRequestRetryCount(value)
      setRetryDraft(current => ({ ...current, models: { ...current.models, [modelId]: maxRetries } }))
      setError(null)
    } catch {
      setError(t('config.retryCountInvalid', { max: MAX_REQUEST_RETRIES }))
    }
  }

  const addModel = () => {
    setModels([...models, { id: '' }])
    setModelQuery('')
    setManualPresets(current => ({ ...current, [models.length]: '' }))
  }

  const duplicateModel = (index: number) => {
    const template = duplicateModelTemplate(models[index] ?? {})
    setModels([...models.slice(0, index + 1), template, ...models.slice(index + 1)])
    setModelQuery('')
    setManualPresets({})
    setFeedback(t('config.modelCopyReady'))
  }

  const removeModel = (index: number) => {
    const modelId = typeof models[index]?.id === 'string' ? models[index].id.trim() : ''
    setModels(models.filter((_model, position) => position !== index))
    if (modelId !== '') {
      setRetryDraft((current) => {
        const nextModels = { ...current.models }
        delete nextModels[modelId]
        return { ...current, models: nextModels }
      })
    }
    setManualPresets({})
  }

  const autoApplyPresets = () => {
    const result = applyMissingPresets(models, registry.presets)
    setModels(result.models.map(model => model.reasoningEfforts === undefined
      ? model
      : applyReasoningDispatchDefaults(providerId || 'provider', draft, model)))
    setFeedback(t('config.presetsApplied', { count: result.applied }))
  }

  const applyPreset = (index: number, presetId: string) => {
    const preset = registry.presets.find(candidate => candidate.id === presetId)
    if (preset === undefined) return
    const updated = applyModelPreset(models[index] ?? {}, preset, true)
    updateModel(index, updated.reasoningEfforts === undefined
      ? updated
      : applyReasoningDispatchDefaults(providerId || 'provider', draft, updated))
    setManualPresets(current => ({ ...current, [index]: preset.id }))
  }

  const applyCandidateMetadata = (nextModels: Record<string, unknown>[]) => {
    const presetResult = applyMissingPresets(nextModels, registry.presets)
    const prepared = presetResult.models.map(model => model.reasoningEfforts === undefined
      ? model
      : applyReasoningDispatchDefaults(providerId || 'provider', draft, model))
    setModels(prepared)
    return presetResult.applied
  }

  const probe = async () => {
    if (busy !== null) return
    setBusy('probe')
    setError(null)
    setFeedback(null)
    try {
      const id = providerId.trim()
      const baseURL = stringField(draft, 'baseURL').trim()
      const apiProtocol = stringField(draft, 'api').trim()
      if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t('config.providerIdInvalid'))
      if (baseURL === '') throw new Error(t('config.baseUrlRequired'))
      if (apiProtocol === '') throw new Error(t('config.protocolRequired'))
      const key = keyDraft.trim()
      const response = await api.llm.discoverModels({
        settingsNs: SETTINGS_NAMESPACE,
        provider: id,
        baseURL,
        api: apiProtocol,
        ...(key === '' ? {} : { apiKey: key }),
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      const result = mergeDiscoveredModelsWithPresets(models, response.result.value.models, registry.presets)
      const prepared = result.models.map(model => model.reasoningEfforts === undefined
        ? model
        : applyReasoningDispatchDefaults(providerId || 'provider', draft, model))
      setModels(prepared)
      setFeedback(t('config.probeSuccessApplied', {
        count: response.result.value.models.length,
        added: result.added,
        enriched: result.enriched,
        presets: result.presetsApplied,
      }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const scanOpenRouterFreeModels = async () => {
    if (busy !== null) return
    setBusy('openrouter-free')
    setError(null)
    setFeedback(null)
    try {
      const catalog = await fetchOpenRouterFreeModels()
      setOpenRouterFreeCatalog(catalog)
      setOpenRouterFreeSelection([])
      setOpenRouterFreeQuery('')
      setFeedback(t('config.openRouterFreeScanned', {
        count: catalog.models.length,
        unconfigured: catalog.models.filter(model => !configuredModelIds.has(model.id)).length,
      }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const toggleOpenRouterFreeModel = (modelId: string) => {
    setOpenRouterFreeSelection(current => current.includes(modelId)
      ? current.filter(id => id !== modelId)
      : [...current, modelId])
  }

  const selectVisibleOpenRouterFreeModels = () => {
    const visibleIds = new Set(visibleOpenRouterFreeModels.map(model => model.id))
    setOpenRouterFreeSelection(current => [...new Set([...current, ...visibleIds])])
  }

  const selectUnconfiguredOpenRouterFreeModels = () => {
    setOpenRouterFreeSelection((openRouterFreeCatalog?.models ?? [])
      .filter(model => !configuredModelIds.has(model.id))
      .map(model => model.id))
  }

  const importOpenRouterFreeModels = () => {
    if (openRouterFreeCatalog === null || openRouterFreeSelection.length === 0) return
    const result = importSelectedOpenRouterFreeModels(models, openRouterFreeCatalog.models, openRouterFreeSelection)
    const presets = applyCandidateMetadata(result.models)
    setFeedback(t('config.openRouterFreeImported', {
      selected: openRouterFreeSelection.length,
      added: result.added,
      enriched: result.enriched,
      presets,
    }))
    setOpenRouterFreeSelection([])
  }

  const enableReasoningForProvider = () => {
    const result = applyUniversalReasoningToProvider(providerId || 'provider', draft)
    setDraft(result.profile)
    setProtocolResults(null)
    setModelProtocolResults(null)
    setApiKeyValidation(null)
    setFeedback(t('config.reasoningProviderApplied', { count: result.changed }))
  }

  const enableReasoningForModel = (index: number) => {
    updateModel(index, applyUniversalReasoningDefaults(providerId || 'provider', draft, models[index] ?? {}))
    setFeedback(t('config.reasoningModelApplied'))
  }

  const probeProtocols = async () => {
    if (busy !== null) return
    const model = protocolTestModel?.id
    if (typeof model !== 'string' || model.trim() === '') {
      setError(t('config.protocolProbeModelRequired'))
      return
    }
    if (!window.confirm(t('config.protocolProbeConfirm', { model: model.trim() }))) return
    setBusy('protocol-probe')
    setError(null)
    setFeedback(null)
    try {
      const results = await probeProviderProtocols({
        baseURL: stringField(draft, 'baseURL').trim(),
        credentialRef,
        model: model.trim(),
        ...(keyDraft.trim() === '' ? {} : { apiKey: keyDraft.trim() }),
      })
      setProtocolResults(results)
      const available = results.filter(result => result.available)
      setFeedback(t(available.length === 0 ? protocolProbeFailureFeedback(results) : available.length === 1 ? 'config.protocolProbeOne' : 'config.protocolProbeBoth', {
        protocol: available[0]?.protocol ?? '',
      }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const probeAllModelProtocols = async () => {
    if (busy !== null) return
    const baseURL = stringField(draft, 'baseURL').trim()
    const modelIds = models.flatMap(model => typeof model.id === 'string' && model.id.trim() !== '' ? [model.id.trim()] : [])
    if (baseURL === '') {
      setError(t('config.baseUrlRequired'))
      return
    }
    if (!hasApiKey) {
      setError(t('config.apiKeyValidationKeyRequired'))
      return
    }
    if (modelIds.length === 0) {
      setError(t('config.protocolProbeModelRequired'))
      return
    }
    if (!window.confirm(t('config.protocolScanConfirm', { count: modelIds.length, requests: modelIds.length * 2 }))) return
    setBusy('protocol-scan')
    setError(null)
    setFeedback(null)
    try {
      const results: ModelProtocolProbeResult[] = []
      for (let offset = 0; offset < modelIds.length; offset += PROTOCOL_SCAN_BATCH_SIZE) {
        results.push(...await probeProviderModelProtocols({
          baseURL,
          credentialRef,
          models: modelIds.slice(offset, offset + PROTOCOL_SCAN_BATCH_SIZE),
          ...(keyDraft.trim() === '' ? {} : { apiKey: keyDraft.trim() }),
        }))
      }
      setModelProtocolResults(results)
      const completionsOnly = results.filter(result => result.classification === 'completions-only').length
      const unsupported = results.filter(result => result.classification === 'unsupported').length
      const authenticationFailure = results.some(result => result.responses.failure === 'authentication' || result.completions.failure === 'authentication')
      setFeedback(t(authenticationFailure ? 'config.protocolScanAuthentication' : 'config.protocolScanDone', { count: results.length, completionsOnly, unsupported }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const applyWholeRouteCompletions = () => {
    const profile: Record<string, unknown> = { ...materializeProviderModels(draft, models), api: 'openai-completions' }
    profile.models = models.map(model => applyReasoningDispatchDefaults(providerId || 'provider', profile, model))
    setDraft(repairProviderCompatibility(profile).profile)
    setProtocolResults(null)
    setApiKeyValidation(null)
    setFeedback(t('config.protocolWholeCompletionsApplied'))
  }

  const splitProtocols = async () => {
    if (namespace === null || retryNamespace === null || busy !== null || protocolSplitPreview === null) return
    const id = providerId.trim()
    const ref = credentialRef.trim()
    let splitModels = models
    if (catalogBacked) {
      try {
        splitModels = await enrichCatalogModels(id, models)
      } catch (cause) {
        setError(t('config.protocolCatalogMetadataFailed', { error: messageOf(cause) }))
        return
      }
    }
    const presetResult = applyMissingPresets(splitModels, registry.presets)
    const normalizedModels = presetResult.models.map(model => ({ ...model, id: String(model.id).trim() }))
    if (!PROVIDER_ID_PATTERN.test(id)) {
      setError(t('config.providerIdInvalid'))
      return
    }
    if (creating && profiles[id] !== undefined) {
      setError(t('config.providerExists'))
      return
    }
    if (!CREDENTIAL_REF_PATTERN.test(ref)) {
      setError(t('config.credentialRefInvalid'))
      return
    }
    if (stringField(draft, 'baseURL').trim() === '') {
      setError(t('config.baseUrlRequired'))
      return
    }
    if (normalizedModels.some(model => typeof model.id !== 'string' || model.id === '')) {
      setError(t('config.modelIdRequired'))
      return
    }
    const duplicateIds = duplicateModelIds(normalizedModels)
    if (duplicateIds.length > 0) {
      setError(t('config.modelIdDuplicate', { ids: duplicateIds.join(', ') }))
      return
    }
    const key = keyDraft.trim()
    if (key !== '' && !LEGAL_API_KEY.test(key)) {
      setError(t('config.keyInvalid'))
      return
    }
    const split = splitProviderByProtocol({
      providerId: id,
      profile: { ...materializeProviderModels(draft, normalizedModels), apiKeyEnv: ref },
      retry: retryDraft,
      completionsOnlyIds: modelProtocolResults?.filter(result => result.classification === 'completions-only').map(result => result.model) ?? [],
      existingProviderIds: providerIds,
    })
    if (!window.confirm(t('config.protocolSplitConfirm', {
      provider: split.completionsProviderId,
      count: modelProtocolSummary.completionsOnly,
    }))) return
    setBusy('protocol-split')
    setError(null)
    setFeedback(null)
    try {
      if (key !== '') {
        const stored = await api.credentials.set({ ref, value: key })
        if (!stored.result.ok) throw new Error(stored.result.error.message)
      }
      const response = await api.settings.mutate({
        ns: SETTINGS_NAMESPACE,
        ops: [
          { op: 'set', path: ['providers', split.responsesProviderId], value: split.responsesProfile },
          { op: 'set', path: ['providers', split.completionsProviderId], value: split.completionsProfile },
        ],
        expectedRevision: namespace.revision,
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      let nextRetryNamespace = retryNamespace
      let retryWarning = ''
      const retryResponse = await api.settings.mutate({
        ns: RETRY_SETTINGS_NAMESPACE,
        ops: [
          { op: 'set', path: ['requestRetries', 'providers', split.responsesProviderId], value: split.responsesRetry },
          { op: 'set', path: ['requestRetries', 'providers', split.completionsProviderId], value: split.completionsRetry },
        ],
        expectedRevision: retryNamespace.revision,
      })
      if (retryResponse.result.ok) nextRetryNamespace = retryResponse.result.value
      else retryWarning = t('config.protocolSplitRetryWarning', { error: retryResponse.result.error.message })
      setNamespace(response.result.value)
      setRetryNamespace(nextRetryNamespace)
      openProvider(split.responsesProviderId, response.result.value, nextRetryNamespace)
      const splitFeedback = t('config.protocolSplitDone', {
        responses: split.responsesProviderId,
        completions: split.completionsProviderId,
        count: modelProtocolSummary.completionsOnly,
      })
      setFeedback(retryWarning === '' ? splitFeedback : `${splitFeedback} ${retryWarning}`)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const applyRecommendedProtocol = () => {
    if (recommendedProtocol === undefined) return
    updateProfileString('api', recommendedProtocol)
    setFeedback(t('config.protocolApplied', { protocol: recommendedProtocol }))
  }

  const chooseProtocolTestModel = (modelId: string) => {
    setProtocolTestModelId(modelId)
    setProtocolResults(null)
    setApiKeyValidation(null)
  }

  const validateApiKey = async () => {
    if (busy !== null) return
    const baseURL = stringField(draft, 'baseURL').trim()
    const apiProtocol = stringField(draft, 'api').trim()
    if (baseURL === '') {
      setError(t('config.baseUrlRequired'))
      return
    }
    if (!PROTOCOLS.includes(apiProtocol as typeof PROTOCOLS[number])) {
      setError(t('config.protocolRequired'))
      return
    }
    if (!hasApiKey) {
      setError(t('config.apiKeyValidationKeyRequired'))
      return
    }
    if (protocolTestModelValue === '') {
      setError(t('config.protocolProbeModelRequired'))
      return
    }
    if (!window.confirm(t('config.apiKeyValidationConfirm', { model: protocolTestModelValue }))) return
    setBusy('api-key-validation')
    setError(null)
    setFeedback(null)
    try {
      const result = await validateProviderApiKey({
        baseURL,
        credentialRef,
        protocol: apiProtocol as ApiKeyValidationResult['protocol'],
        ...(protocolTestModelValue === '' ? {} : { model: protocolTestModelValue }),
        ...(keyDraft.trim() === '' ? {} : { apiKey: keyDraft.trim() }),
      })
      setApiKeyValidation(result)
      setFeedback(t('config.apiKeyValidationDone'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const validateAllApiKeys = async () => {
    if (busy !== null || providerIds.length === 0) return
    if (!window.confirm(t('config.apiKeyBatchConfirm', { count: providerIds.length }))) return
    setBusy('api-key-batch')
    setError(null)
    setFeedback(null)
    try {
      const localResults: BatchApiKeyValidationResult[] = []
      const requests: Parameters<typeof validateProviderApiKeys>[0]['providers'] = []
      for (const id of providerIds) {
        const profile = profiles[id] ?? {}
        const displayName = stringField(profile, 'displayName') || id
        const baseURL = stringField(profile, 'baseURL').trim()
        const apiProtocol = stringField(profile, 'api')
        const ref = stringField(profile, 'apiKeyEnv') || deriveCredentialRef(id)
        const model = firstConfiguredModelId(profile)
        let localMessage = ''
        if (baseURL === '') localMessage = t('config.apiKeyBatchNoBaseUrl')
        else {
          try { new URL(baseURL) } catch { localMessage = t('config.apiKeyBatchInvalidBaseUrl') }
        }
        if (!PROTOCOLS.includes(apiProtocol as typeof PROTOCOLS[number])) localMessage = t('config.apiKeyBatchInvalidProtocol')
        if (localMessage !== '') {
          localResults.push({
            provider: id,
            displayName,
            baseURL,
            credentialRef: ref,
            protocol: PROTOCOLS.includes(apiProtocol as typeof PROTOCOLS[number])
              ? apiProtocol as BatchApiKeyValidationResult['protocol']
              : 'openai-responses',
            model,
            status: 'unknown',
            checkedBy: 'request',
            message: localMessage,
          })
          continue
        }
        requests.push({
          provider: id,
          displayName,
          baseURL,
          credentialRef: ref,
          protocol: apiProtocol as BatchApiKeyValidationResult['protocol'],
          model,
        })
      }
      const remoteResults = requests.length === 0 ? [] : await validateProviderApiKeys({ providers: requests })
      const resultByProvider = new Map([...localResults, ...remoteResults].map(result => [result.provider, result]))
      const ordered = providerIds.flatMap(id => resultByProvider.get(id) ?? [])
      setBatchApiKeyValidation(ordered)
      const problems = ordered.filter(result => result.status !== 'valid').length
      setFeedback(t(problems === 0 ? 'config.apiKeyBatchAllValid' : 'config.apiKeyBatchProblems', { count: problems }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const reveal = async () => {
    if (busy !== null) return
    if (!isLoopback) {
      setError(t('config.revealLoopbackOnly'))
      return
    }
    setBusy('reveal')
    setError(null)
    try {
      setKeyDraft(await revealCredential(credentialRef))
      setKeyVisible(true)
      setApiKeyValidation(null)
      setModelProtocolResults(null)
      setFeedback(t('config.revealSuccess'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const deleteProvider = async () => {
    if (namespace === null || retryNamespace === null || creating || busy !== null || !confirmDiscard()) return
    if (!window.confirm(t('config.deleteConfirm', { provider: providerId }))) return
    setBusy('delete')
    setError(null)
    setFeedback(null)
    try {
      const response = await api.settings.mutate({
        ns: SETTINGS_NAMESPACE,
        ops: [{ op: 'unset', path: ['providers', providerId] }],
        expectedRevision: namespace.revision,
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      const retryResponse = await api.settings.mutate({
        ns: RETRY_SETTINGS_NAMESPACE,
        ops: [{ op: 'unset', path: ['requestRetries', 'providers', providerId] }],
        expectedRevision: retryNamespace.revision,
      })
      if (!retryResponse.result.ok) throw new Error(retryResponse.result.error.message)
      setNamespace(response.result.value)
      setRetryNamespace(retryResponse.result.value)
      const remaining = Object.keys(providerProfiles(response.result.value.user ?? response.result.value.value))
        .filter(id => id !== providerId)
        .sort((left, right) => left.localeCompare(right))
      const next = remaining[0]
      if (next === undefined) {
        const empty = { api: 'openai-responses', models: [] }
        const emptyRetry = { enabled: false, maxRetries: 0, models: {} }
        setCreating(true)
        setProviderId('')
        setDraft(empty)
        setBaselineSignature(draftSignature('', empty))
        setRetryDraft(emptyRetry)
        setRetryBaselineSignature(requestRetrySignature(emptyRetry))
        setPreviousProviderId('')
        setModelQuery('')
        setCredential(null)
        setKeyDraft('')
        setKeyVisible(false)
        setProtocolResults(null)
        setModelProtocolResults(null)
        setProtocolTestModelId('')
        setApiKeyValidation(null)
      } else {
        openProvider(next, response.result.value, retryResponse.result.value)
      }
      setFeedback(t('config.deleted'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (namespace === null || retryNamespace === null || busy !== null) return
    setBusy('save')
    setError(null)
    setFeedback(null)
    try {
      const id = providerId.trim()
      const ref = credentialRef.trim()
      if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t('config.providerIdInvalid'))
      if (creating && profiles[id] !== undefined) throw new Error(t('config.providerExists'))
      if (!CREDENTIAL_REF_PATTERN.test(ref)) throw new Error(t('config.credentialRefInvalid'))
      if (stringField(draft, 'baseURL').trim() === '') throw new Error(t('config.baseUrlRequired'))
      if (!PROTOCOLS.includes(stringField(draft, 'api') as typeof PROTOCOLS[number])) throw new Error(t('config.protocolRequired'))
      if (models.length === 0 || models.some(model => typeof model.id !== 'string' || model.id.trim() === '')) {
        throw new Error(t('config.modelIdRequired'))
      }
      const duplicateIds = duplicateModelIds(models)
      if (duplicateIds.length > 0) throw new Error(t('config.modelIdDuplicate', { ids: duplicateIds.join(', ') }))
      const key = keyDraft.trim()
      if (key !== '' && !LEGAL_API_KEY.test(key)) throw new Error(t('config.keyInvalid'))
      const profile = structuredClone(draft)
      profile.apiKeyEnv = ref
      const normalizedModels = models.map(model => ({ ...model, id: String(model.id).trim() }))
      const overrides = catalogBacked ? catalogOverrides(liveCatalogModels[id] ?? [], normalizedModels) : undefined
      if (catalogBacked && overrides !== undefined) {
        delete profile.models
        if (Object.keys(overrides).length === 0) delete profile.modelOverrides
        else profile.modelOverrides = overrides
      } else {
        profile.models = normalizedModels
        delete profile.modelOverrides
      }
      const savedModelIds = new Set(normalizedModels.map(model => String(model.id)))
      const savedRetryDraft: RequestRetryDraft = {
        ...retryDraft,
        models: Object.fromEntries(Object.entries(retryDraft.models)
          .filter(([modelId]) => savedModelIds.has(modelId.trim()))
          .map(([modelId, maxRetries]) => [modelId.trim(), maxRetries])),
      }
      const repaired = repairProviderCompatibility(profile)
      const savedProfile = repaired.profile
      const response = await api.settings.mutate({
        ns: SETTINGS_NAMESPACE,
        ops: [{ op: 'set', path: ['providers', id], value: savedProfile }],
        expectedRevision: namespace.revision,
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      let nextRetryNamespace = retryNamespace
      if (retryDirty) {
        const retryResponse = await api.settings.mutate({
          ns: RETRY_SETTINGS_NAMESPACE,
          ops: [{ op: 'set', path: ['requestRetries', 'providers', id], value: savedRetryDraft }],
          expectedRevision: retryNamespace.revision,
        })
        if (!retryResponse.result.ok) throw new Error(retryResponse.result.error.message)
        nextRetryNamespace = retryResponse.result.value
        setRetryNamespace(nextRetryNamespace)
      }
      setNamespace(response.result.value)
      setDraft(savedProfile)
      setBaselineSignature(draftSignature(id, savedProfile))
      const appliedRetryDraft = cloneRequestRetryDraft(requestRetryProfiles(nextRetryNamespace.value)[id])
      setRetryDraft(appliedRetryDraft)
      setRetryBaselineSignature(requestRetrySignature(appliedRetryDraft))
      setApiKeyValidation(null)
      setModelProtocolResults(null)
      if (key !== '') {
        const stored = await api.credentials.set({ ref, value: key })
        if (!stored.result.ok) throw new Error(`${t('config.settingsSavedKeyFailed')}: ${stored.result.error.message}`)
      }
      setCreating(false)
      setPreviousProviderId(id)
      setKeyDraft('')
      setKeyVisible(false)
      await describeCredential(ref)
      setFeedback(repaired.changed
        ? t('config.savedWithCompatibilityRepair', { count: repaired.repairedModels.length })
        : t('config.saved'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const readOnly = namespace === null || retryNamespace === null || busy !== null
  const presetStatusText = presetState === 'online'
    ? t('config.presetsOnline', { date: registry.updatedAt, count: registry.presets.length })
    : presetState === 'loading'
      ? t('config.presetsLoading')
      : presetState === 'error'
        ? t('config.presetsFallback', { date: registry.updatedAt, count: registry.presets.length })
        : t('config.presetsBundled', { date: registry.updatedAt, count: registry.presets.length })

  return (
    <main className="dmp-config">
      <section className="dmp-config-toolbar">
        <div>
          <strong>{t('config.title')}</strong>
          <span>{t('config.intro')}</span>
        </div>
        <div className="dmp-config-toolbar-actions">
          {dirty && <span className="dmp-config-dirty">{t('config.unsaved')}</span>}
          <button type="button" disabled={busy !== null || providerIds.length === 0} onClick={() => void validateAllApiKeys()}>{busy === 'api-key-batch' ? t('config.apiKeyBatchRunning') : t('config.apiKeyBatch')}</button>
          <button type="button" disabled={busy !== null} onClick={() => void load()}>{t('config.reload')}</button>
          <button type="button" disabled={busy !== null} onClick={startCreate}>{t('config.addProvider')}</button>
        </div>
      </section>

      {error !== null && <div className="dmp-media-error" role="alert">{error}</div>}
      {feedback !== null && <div className="dmp-media-feedback" aria-live="polite"><strong>{t('config.done')}</strong><span>{feedback}</span></div>}
      {batchApiKeyValidation !== null && (
        <section className="dmp-config-batch-results" aria-label={t('config.apiKeyBatchResults')}>
          <div className="dmp-config-batch-heading">
            <div>
              <strong>{t('config.apiKeyBatchResults')}</strong>
              <span>{batchProblemCount === 0 ? t('config.apiKeyBatchAllValid') : t('config.apiKeyBatchProblems', { count: batchProblemCount })}</span>
            </div>
            <button type="button" disabled={busy !== null} onClick={() => setBatchApiKeyValidation(null)}>{t('config.apiKeyBatchClose')}</button>
          </div>
          <div className="dmp-config-batch-list">
            {batchApiKeyValidation.map(result => (
              <article className={`is-${result.status}`} key={result.provider}>
                <div>
                  <strong>{result.displayName}</strong>
                  <span>{result.provider} · {result.credentialRef} · {result.protocol} · {result.model}</span>
                  <small>{result.message}</small>
                </div>
                <div>
                  <span>{t(apiKeyValidationLabel(result.status))}</span>
                  {result.credentialSource !== undefined && <small>{result.credentialSource}</small>}
                  <button type="button" disabled={busy !== null} onClick={() => selectProvider(result.provider)}>{t('config.apiKeyBatchEdit')}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {compatibilityRepair.changed && (
        <div className="dmp-config-compat-warning" role="status">
          <div>
            <strong>{t('config.reasoningRepairTitle')}</strong>
            <span>{t('config.reasoningRepairDescription', {
              count: compatibilityRepair.repairedModels.length,
              models: compatibilityRepair.repairedModels.join(', '),
            })}</span>
          </div>
          <button type="button" disabled={busy !== null} onClick={() => void save()}>
            {busy === 'save' ? t('config.saving') : t('config.reasoningRepairApply')}
          </button>
        </div>
      )}

      <section className="dmp-config-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.providerTitle')}</h3><p>{t('config.providerDescription')}</p></div>
          <div className="dmp-config-provider-actions">
            {!creating && providerIds.length > 0 && <>
              <select value={providerId} onChange={event => selectProvider(event.currentTarget.value)} disabled={busy !== null}>
                {providerIds.map(id => <option key={id} value={id}>{stringField(profiles[id] ?? {}, 'displayName') || id}</option>)}
              </select>
              <button type="button" disabled={busy !== null} onClick={duplicateProvider}>{t('config.duplicateProvider')}</button>
              <button type="button" className="dmp-danger" disabled={busy !== null} onClick={() => void deleteProvider()}>{busy === 'delete' ? t('config.deleting') : t('config.deleteProvider')}</button>
            </>}
            {creating && providerIds.length > 0 && <button type="button" disabled={busy !== null} onClick={cancelCreate}>{t('config.cancelCreate')}</button>}
          </div>
        </div>

        <div className="dmp-config-provider-grid">
          <label className="dmp-media-field">
            <span>{t('config.providerId')}</span>
            <input value={providerId} disabled={!creating || busy !== null} onChange={event => { setProviderId(event.currentTarget.value.toLocaleLowerCase()); setProtocolResults(null); setModelProtocolResults(null); setApiKeyValidation(null) }} placeholder="my-provider" />
          </label>
          <label className="dmp-media-field">
            <span>{t('config.displayName')}</span>
            <input value={stringField(draft, 'displayName')} disabled={readOnly} onChange={event => updateProfileString('displayName', event.currentTarget.value)} placeholder={providerId || 'My Provider'} />
          </label>
          <label className="dmp-media-field dmp-config-span-2">
            <span>{t('config.baseUrl')}</span>
            <input value={stringField(draft, 'baseURL')} disabled={readOnly} onChange={event => updateProfileString('baseURL', event.currentTarget.value)} placeholder="https://api.example.com/v1" />
          </label>
          <label className="dmp-media-field">
            <span>{t('config.protocol')}</span>
            <select value={protocol} disabled={readOnly} onChange={event => updateProfileString('api', event.currentTarget.value)}>
              {PROTOCOLS.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="dmp-config-protocol-note">{t('config.protocolNote')}</div>
          <label className="dmp-media-field">
            <span>{t('config.providerDefaultInput')}</span>
            <select value={inputMode(draft, 'defaultInput')} disabled={readOnly} onChange={event => setDraft(current => setInputMode(current, event.currentTarget.value as ReturnType<typeof inputMode>, 'defaultInput'))}>
              <option value="inherit">{t('config.inputDshDefault')}</option>
              <option value="text">{t('config.inputText')}</option>
              <option value="text-image">{t('config.inputTextImage')}</option>
              <option value="image">{t('config.inputImageOnly')}</option>
            </select>
          </label>
          <label className="dmp-media-field">
            <span>{t('config.credentialRef')}</span>
            <input value={credentialRef} disabled={readOnly} onChange={event => updateProfileString('apiKeyEnv', event.currentTarget.value)} placeholder={deriveCredentialRef(providerId || 'provider')} />
          </label>
          <label className="dmp-media-field dmp-config-key-field">
            <span>{t('config.apiKey')}</span>
            <span className="dmp-config-key-input">
              <input
                type={keyVisible ? 'text' : 'password'}
                value={keyDraft}
                disabled={readOnly || credential?.writable === false}
                onChange={event => { setKeyDraft(event.currentTarget.value); setProtocolResults(null); setModelProtocolResults(null); setApiKeyValidation(null) }}
                autoComplete="off"
                placeholder={credential?.configured ? t('config.keyConfigured') : t('config.keyNotConfigured')}
              />
              <button type="button" disabled={busy !== null || keyDraft === ''} onClick={() => setKeyVisible(value => !value)}>{keyVisible ? t('config.hide') : t('config.show')}</button>
              <button type="button" disabled={busy !== null || !isLoopback || credential?.configured !== true} onClick={() => void reveal()}>{t('config.loadStoredKey')}</button>
            </span>
          </label>
        </div>

        <div className="dmp-config-status-row">
          <span className={credential?.configured ? 'is-ok' : ''}>
            {credential?.configured ? t('config.credentialStatusConfigured', { source: credential.source ?? '?' }) : t('config.credentialStatusMissing')}
          </span>
          <span>{isLoopback ? t('config.revealLocalReady') : t('config.revealLoopbackOnly')}</span>
          <label className="dmp-config-protocol-model">
            <span>{t('config.protocolProbeModel')}</span>
            <select value={protocolTestModelValue} disabled={busy !== null || protocolTestModel === undefined} onChange={event => chooseProtocolTestModel(event.currentTarget.value)}>
              {models.filter(model => typeof model.id === 'string' && model.id.trim() !== '').map(model => <option key={model.id as string} value={model.id as string}>{model.id as string}</option>)}
            </select>
          </label>
          <div>
            <button type="button" disabled={busy !== null} onClick={() => void probe()}>{busy === 'probe' ? t('config.probing') : t('config.probe')}</button>
            {openRouterProfile && <button type="button" disabled={busy !== null} onClick={() => void scanOpenRouterFreeModels()}>{busy === 'openrouter-free' ? t('config.openRouterFreeScanning') : t('config.openRouterFreeScan')}</button>}
            <button type="button" disabled={busy !== null || !hasApiKey} onClick={() => void validateApiKey()}>{busy === 'api-key-validation' ? t('config.apiKeyValidating') : t('config.validateApiKey')}</button>
            <button type="button" disabled={busy !== null || protocolTestModel === undefined} onClick={() => void probeProtocols()}>{busy === 'protocol-probe' ? t('config.protocolProbing') : t('config.protocolProbe')}</button>
            <button type="button" disabled={busy !== null || models.length === 0 || !hasApiKey} onClick={() => void probeAllModelProtocols()}>{busy === 'protocol-scan' ? t('config.protocolScanning') : t('config.protocolScan')}</button>
            <button className="dmp-media-primary" type="button" disabled={busy !== null || (!dirty && !compatibilityRepair.changed)} onClick={() => void save()}>{busy === 'save' ? t('config.saving') : t('config.save')}</button>
          </div>
        </div>
        {openRouterFreeCatalog !== null && (
          <section className="dmp-config-free-picker">
            <div className="dmp-config-free-picker-heading">
              <div>
                <strong>{t('config.openRouterFreePickerTitle')}</strong>
                <span>{t('config.openRouterFreePickerSummary', {
                  count: openRouterFreeCatalog.models.length,
                  selected: openRouterFreeSelection.length,
                  checkedAt: new Date(openRouterFreeCatalog.checkedAt).toLocaleString(),
                })}</span>
              </div>
              <button type="button" onClick={() => { setOpenRouterFreeCatalog(null); setOpenRouterFreeSelection([]); setOpenRouterFreeQuery('') }}>{t('config.openRouterFreeClose')}</button>
            </div>
            <div className="dmp-config-free-picker-toolbar">
              <input value={openRouterFreeQuery} onChange={event => setOpenRouterFreeQuery(event.currentTarget.value)} placeholder={t('config.openRouterFreeSearch')} />
              <button type="button" onClick={selectVisibleOpenRouterFreeModels}>{t('config.openRouterFreeSelectVisible')}</button>
              <button type="button" onClick={selectUnconfiguredOpenRouterFreeModels}>{t('config.openRouterFreeSelectNew')}</button>
              <button type="button" disabled={openRouterFreeSelection.length === 0} onClick={() => setOpenRouterFreeSelection([])}>{t('config.openRouterFreeClear')}</button>
            </div>
            <div className="dmp-config-free-picker-list">
              {visibleOpenRouterFreeModels.map(model => (
                <label key={model.id}>
                  <input type="checkbox" checked={openRouterFreeSelection.includes(model.id)} onChange={() => toggleOpenRouterFreeModel(model.id)} />
                  <span className="dmp-config-free-picker-model">
                    <strong>{model.name ?? model.id}</strong>
                    <small>{model.id}</small>
                  </span>
                  <span className="dmp-config-free-picker-meta">
                    {configuredModelIds.has(model.id) && <em>{t('config.openRouterFreeConfigured')}</em>}
                    <small>{t('config.openRouterFreeContext', { value: model.contextWindow?.toLocaleString() ?? '?' })}</small>
                    <small>{t('config.openRouterFreeOutput', { value: model.maxTokens?.toLocaleString() ?? '?' })}</small>
                    <small>{model.input.join(' + ')}</small>
                  </span>
                </label>
              ))}
              {visibleOpenRouterFreeModels.length === 0 && <div className="dmp-config-empty">{t('config.openRouterFreeEmpty')}</div>}
            </div>
            <div className="dmp-config-free-picker-footer">
              <span>{t('config.openRouterFreeImportHint')}</span>
              <button className="dmp-media-primary" type="button" disabled={openRouterFreeSelection.length === 0} onClick={importOpenRouterFreeModels}>{t('config.openRouterFreeImportSelected', { count: openRouterFreeSelection.length })}</button>
            </div>
          </section>
        )}
        {protocolResults !== null && (
          <div className="dmp-config-protocol-results">
            {protocolResults.map(result => <span className={result.available ? 'is-ok' : 'is-error'} key={result.protocol}>
              <strong>{result.protocol}</strong>{result.available ? t('config.protocolAvailable') : t('config.protocolUnavailable', { error: result.error ?? '?' })}
            </span>)}
            {recommendedProtocol !== undefined && recommendedProtocol !== protocol && <button type="button" disabled={busy !== null} onClick={applyRecommendedProtocol}>{t('config.protocolApplyRecommended', { protocol: recommendedProtocol })}</button>}
          </div>
        )}
        {modelProtocolResults !== null && (
          <section className="dmp-config-protocol-scan" aria-label={t('config.protocolScanResults')}>
            <div className="dmp-config-protocol-scan-heading">
              <div>
                <strong>{t('config.protocolScanResults')}</strong>
                <span>{t('config.protocolScanSummary', {
                  responses: modelProtocolSummary.responses,
                  completionsOnly: modelProtocolSummary.completionsOnly,
                  unsupported: modelProtocolSummary.unsupported,
                })}</span>
              </div>
              <div>
                {protocolSplitPreview !== null && <button className="dmp-media-primary" type="button" disabled={busy !== null} onClick={() => void splitProtocols()}>{busy === 'protocol-split' ? t('config.protocolSplitting') : t('config.protocolSplit')}</button>}
                {modelProtocolSummary.completionsOnly === modelProtocolResults.length && <button type="button" disabled={busy !== null} onClick={applyWholeRouteCompletions}>{t('config.protocolWholeCompletions')}</button>}
              </div>
            </div>
            {protocolSplitPreview !== null && <p>{t('config.protocolSplitPreview', {
              responses: protocolSplitPreview.responsesProviderId,
              completions: protocolSplitPreview.completionsProviderId,
              count: modelProtocolSummary.completionsOnly,
            })}</p>}
            <div className="dmp-config-protocol-scan-list">
              {modelProtocolResults.map(result => (
                <article className={`is-${result.classification}`} key={result.model}>
                  <div><strong>{result.model}</strong><span>{t(protocolClassificationLabel(result.classification))}</span></div>
                  <small>Responses: {result.responses.available ? t('config.protocolAvailable') : result.responses.error ?? '?'} · Completions: {result.completions.available ? t('config.protocolAvailable') : result.completions.error ?? '?'}</small>
                </article>
              ))}
            </div>
          </section>
        )}
        {apiKeyValidation !== null && (
          <div className={`dmp-config-key-validation is-${apiKeyValidation.status}`} role="status">
            <strong>{apiKeyValidation.credentialTarget === 'runtime'
              ? t('config.apiKeyValidationRuntimeTarget', { source: apiKeyValidation.credentialSource ?? '?' })
              : t('config.apiKeyValidationDraftTarget')}</strong>
            <strong>{t(apiKeyValidationLabel(apiKeyValidation.status))}</strong>
            <span>{apiKeyValidation.message}</span>
            {apiKeyValidation.runtimeConfigured === false && <span>{t('config.apiKeyValidationDraftOnly')}</span>}
            {apiKeyValidation.runtimeMatchesDraft === false && <span>{t('config.apiKeyValidationMismatch')}</span>}
            {apiKeyValidation.draft !== undefined && (
              <>
                <strong>{t('config.apiKeyValidationDraftResult')}: {t(apiKeyValidationLabel(apiKeyValidation.draft.status))}</strong>
                <span>{apiKeyValidation.draft.message}</span>
              </>
            )}
            {apiKeyValidation.status === 'valid' && <span>{t('config.apiKeyValidationScope')}</span>}
          </div>
        )}
      </section>

      <section className="dmp-config-card dmp-config-retry-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.retryTitle')}</h3><p>{t('config.retryDescription')}</p></div>
          {retryDraft.enabled && retryDraft.maxRetries === 50 && <span className="dmp-config-retry-preset">{t('config.retryPreset50')}</span>}
        </div>
        <div className="dmp-config-provider-grid">
          <label className="dmp-media-field">
            <span>{t('config.retryProviderMode')}</span>
            <select value={retryDraft.enabled ? 'custom' : 'inherit'} disabled={readOnly} onChange={event => setRetryDraft(current => ({
              ...current,
              enabled: event.currentTarget.value === 'custom',
              maxRetries: event.currentTarget.value === 'custom' && current.maxRetries === 0 ? 3 : current.maxRetries,
            }))}>
              <option value="inherit">{t('config.retryProviderInherit')}</option>
              <option value="custom">{t('config.retryProviderCustom')}</option>
            </select>
          </label>
          <label className="dmp-media-field">
            <span>{t('config.retryProviderCount')}</span>
            <input type="number" min="0" max={MAX_REQUEST_RETRIES} step="1" value={retryDraft.maxRetries} disabled={readOnly || !retryDraft.enabled} onChange={event => updateProviderRetryCount(event.currentTarget.value)} />
          </label>
          <div className="dmp-config-retry-note dmp-config-span-2">
            <strong>{t('config.retrySafetyTitle')}</strong>
            <span>{t('config.retrySafetyDescription', { retries: retryDraft.maxRetries, attempts: retryDraft.maxRetries + 1 })}</span>
          </div>
        </div>
      </section>

      <section className="dmp-config-card dmp-config-model-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.modelsTitle')}</h3><p>{t('config.modelsDescription')}</p></div>
          <div className="dmp-config-heading-actions">
            <span>{presetStatusText}</span>
            <input className="dmp-config-model-search" value={modelQuery} onChange={event => setModelQuery(event.currentTarget.value)} placeholder={t('config.searchModels')} aria-label={t('config.searchModels')} />
            <button type="button" disabled={busy !== null} onClick={() => void refreshPresets()}>{t('config.refreshPresets')}</button>
            <button type="button" disabled={busy !== null || models.length === 0} onClick={autoApplyPresets}>{t('config.autoPreset')}</button>
            <button type="button" disabled={busy !== null || models.length === 0} onClick={enableReasoningForProvider}>{t('config.reasoningProviderEnable')}</button>
            <button type="button" disabled={busy !== null} onClick={addModel}>{t('config.addModel')}</button>
          </div>
        </div>
        {catalogBacked && <div className="dmp-config-catalog-note">{t('config.catalogModelsManaged')}</div>}

        {models.length === 0 && <div className="dmp-config-empty">{t('config.noModels')}</div>}
        {models.length > 0 && visibleModels.length === 0 && <div className="dmp-config-empty">{t('config.noMatchingModels')}</div>}
        <div className="dmp-config-models">
          {visibleModels.map(({ model, index }) => {
            const automatic = sourcePreset(model, registry.presets)
            const selectedPresetId = manualPresets[index] ?? automatic?.id ?? ''
            const selectedPreset = registry.presets.find(preset => preset.id === selectedPresetId)
            const modelInputMode = inputMode(model)
            const modelId = typeof model.id === 'string' ? model.id.trim() : ''
            const retryMode = modelRetryMode(retryDraft, modelId)
            const reasoningEfforts = reasoningEffortsValue(model)
            const reasoningMode = reasoningEfforts === undefined ? 'inherit' : reasoningEfforts === false ? 'disabled' : 'custom'
            return (
              <article className="dmp-config-model" key={`${String(model.id)}-${index}`}>
                <div className="dmp-config-model-top">
                  <span className="dmp-config-model-title">
                    <strong>{typeof model.name === 'string' && model.name !== '' ? model.name : typeof model.id === 'string' && model.id !== '' ? model.id : `${t('config.model')} ${index + 1}`}</strong>
                    {openRouterProfile && typeof model.id === 'string' && model.id.toLocaleLowerCase().endsWith(':free') && <small>{t('config.freeModelBadge')}</small>}
                  </span>
                  <div>
                    <button type="button" disabled={busy !== null} onClick={() => duplicateModel(index)}>{t('config.duplicateModel')}</button>
                    <button type="button" className="dmp-danger" disabled={busy !== null} onClick={() => removeModel(index)}>{t('config.remove')}</button>
                  </div>
                </div>
                <div className="dmp-config-model-grid">
                  <label className="dmp-media-field dmp-config-span-2">
                    <span>{t('config.modelId')}</span>
                    <input value={typeof model.id === 'string' ? model.id : ''} disabled={readOnly} onChange={event => updateModel(index, setOptionalString(model, 'id', event.currentTarget.value))} />
                  </label>
                  <label className="dmp-media-field dmp-config-span-2">
                    <span>{t('config.modelName')}</span>
                    <input value={typeof model.name === 'string' ? model.name : ''} disabled={readOnly} onChange={event => updateModel(index, setOptionalString(model, 'name', event.currentTarget.value))} placeholder={t('config.optional')} />
                  </label>
                  <label className="dmp-media-field">
                    <span>{t('config.contextWindow')}</span>
                    <input inputMode="numeric" value={positiveIntegerText(model.contextWindow)} disabled={readOnly} onChange={event => {
                      try { updateModel(index, setOptionalPositiveInteger(model, 'contextWindow', event.currentTarget.value)); setError(null) } catch (cause) { setError(messageOf(cause)) }
                    }} placeholder="262144" />
                  </label>
                  <label className="dmp-media-field">
                    <span>{t('config.maxTokens')}</span>
                    <input inputMode="numeric" value={positiveIntegerText(model.maxTokens)} disabled={readOnly} onChange={event => {
                      try { updateModel(index, setOptionalPositiveInteger(model, 'maxTokens', event.currentTarget.value)); setError(null) } catch (cause) { setError(messageOf(cause)) }
                    }} placeholder="32768" />
                  </label>
                  <label className="dmp-media-field">
                    <span>{t('config.inputTypes')}</span>
                    <select value={modelInputMode} disabled={readOnly} onChange={event => updateModel(index, setInputMode(model, event.currentTarget.value as ReturnType<typeof inputMode>))}>
                      <option value="inherit">{t('config.inputInherit')}</option>
                      <option value="text">{t('config.inputText')}</option>
                      <option value="text-image">{t('config.inputTextImage')}</option>
                      <option value="image">{t('config.inputImageOnly')}</option>
                    </select>
                  </label>
                  <div className="dmp-config-model-retry">
                    <label className="dmp-media-field">
                      <span>{t('config.retryModelMode')}</span>
                      <select value={retryMode} disabled={readOnly || modelId === ''} onChange={event => updateModelRetryMode(modelId, event.currentTarget.value as 'inherit' | 'disabled' | 'custom')}>
                        <option value="inherit">{t('config.retryModelInherit')}</option>
                        <option value="disabled">{t('config.retryModelDisabled')}</option>
                        <option value="custom">{t('config.retryModelCustom')}</option>
                      </select>
                    </label>
                    {retryMode === 'custom' && <input type="number" min="1" max={MAX_REQUEST_RETRIES} step="1" value={retryDraft.models[modelId]} disabled={readOnly || modelId === ''} onChange={event => updateModelRetryCount(modelId, event.currentTarget.value)} aria-label={t('config.retryModelCount')} />}
                  </div>
                  <div className="dmp-config-preset">
                    <label className="dmp-media-field">
                      <span>{t('config.preset')}</span>
                      <select value={selectedPresetId} disabled={readOnly} onChange={event => setManualPresets(current => ({ ...current, [index]: event.currentTarget.value }))}>
                        <option value="">{t('config.noPreset')}</option>
                        {registry.presets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
                      </select>
                    </label>
                    <button type="button" disabled={readOnly || selectedPreset === undefined} onClick={() => applyPreset(index, selectedPresetId)}>{t('config.applyPreset')}</button>
                    {selectedPreset !== undefined && <a href={selectedPreset.sourceUrl} target="_blank" rel="noreferrer">{selectedPreset.sourceLabel}</a>}
                    {selectedPreset !== undefined && <small>{[
                      selectedPreset.input?.join(' + '),
                      selectedPreset.reasoningEfforts === undefined ? undefined : t('config.presetReasoningLevels', { count: Object.keys(selectedPreset.reasoningEfforts).length }),
                    ].filter(Boolean).join(' · ')}</small>}
                  </div>
                </div>

                <details className="dmp-config-reasoning" open={reasoningMode === 'custom'}>
                  <summary>{t('config.reasoningTitle')}</summary>
                  <div className="dmp-config-reasoning-toolbar">
                    <label className="dmp-media-field">
                      <span>{t('config.reasoningMode')}</span>
                      <select value={reasoningMode} disabled={readOnly} onChange={event => {
                        const mode = event.currentTarget.value
                        if (mode === 'inherit' || mode === 'disabled') updateModel(index, setReasoningMode(model, mode))
                        else enableReasoningForModel(index)
                      }}>
                        <option value="inherit">{t('config.reasoningInherit')}</option>
                        <option value="disabled">{t('config.reasoningDisabled')}</option>
                        <option value="custom">{t('config.reasoningAll')}</option>
                      </select>
                    </label>
                    <button type="button" disabled={readOnly} onClick={() => enableReasoningForModel(index)}>{t('config.reasoningEnableAll')}</button>
                    <small>{t('config.reasoningDescription')}</small>
                  </div>
                  {reasoningEfforts !== undefined && reasoningEfforts !== false && (
                    <div className="dmp-config-reasoning-grid">
                      {REASONING_LEVELS.map(level => {
                        const enabled = Object.hasOwn(reasoningEfforts, level)
                        const wireValue = reasoningEfforts[level]
                        return (
                          <label key={level}>
                            <span><input type="checkbox" checked={enabled} disabled={readOnly} onChange={event => updateModel(index, setReasoningEffort(model, level, event.currentTarget.checked))} /> {level}</span>
                            <input
                              value={wireValue ?? ''}
                              disabled={readOnly || !enabled}
                              onChange={event => updateModel(index, setReasoningEffort(model, level, true, event.currentTarget.value))}
                              placeholder={level === 'off' ? t('config.reasoningOffWire') : level}
                              aria-label={t('config.reasoningWireValue', { level })}
                            />
                          </label>
                        )
                      })}
                    </div>
                  )}
                </details>

                <details className="dmp-config-compat">
                  <summary>{t('config.compatibility')}</summary>
                  {protocol === 'openai-completions' ? (
                    <div className="dmp-config-compat-grid">
                      <label className="dmp-media-field">
                        <span>supportsDeveloperRole</span>
                        <select value={booleanChoice(compatValue(model, 'supportsDeveloperRole'))} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'supportsDeveloperRole', event.currentTarget.value === '' ? undefined : event.currentTarget.value === 'true'))}>
                          <option value="">{t('config.inherit')}</option><option value="true">true</option><option value="false">false</option>
                        </select>
                      </label>
                      <label className="dmp-media-field">
                        <span>supportsReasoningEffort</span>
                        <select value={booleanChoice(compatValue(model, 'supportsReasoningEffort'))} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'supportsReasoningEffort', event.currentTarget.value === '' ? undefined : event.currentTarget.value === 'true'))}>
                          <option value="">{t('config.inherit')}</option><option value="true">true</option><option value="false">false</option>
                        </select>
                      </label>
                      <label className="dmp-media-field">
                        <span>maxTokensField</span>
                        <select value={typeof compatValue(model, 'maxTokensField') === 'string' ? String(compatValue(model, 'maxTokensField')) : ''} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'maxTokensField', event.currentTarget.value || undefined))}>
                          <option value="">{t('config.inherit')}</option><option value="max_tokens">max_tokens</option><option value="max_completion_tokens">max_completion_tokens</option>
                        </select>
                      </label>
                      <label className="dmp-media-field">
                        <span>thinkingFormat</span>
                        <select value={typeof compatValue(model, 'thinkingFormat') === 'string' ? String(compatValue(model, 'thinkingFormat')) : ''} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'thinkingFormat', event.currentTarget.value || undefined))}>
                          <option value="">{t('config.inherit')}</option>{THINKING_FORMATS.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className="dmp-media-field">
                        <span>requiresReasoningContentOnAssistantMessages</span>
                        <select value={booleanChoice(compatValue(model, 'requiresReasoningContentOnAssistantMessages'))} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'requiresReasoningContentOnAssistantMessages', event.currentTarget.value === '' ? undefined : event.currentTarget.value === 'true'))}>
                          <option value="">{t('config.inherit')}</option><option value="true">true</option><option value="false">false</option>
                        </select>
                      </label>
                    </div>
                  ) : protocol === 'openai-responses' ? (
                    <div className="dmp-config-compat-grid">
                      <label className="dmp-media-field">
                        <span>supportsDeveloperRole</span>
                        <select value={booleanChoice(compatValue(model, 'supportsDeveloperRole'))} disabled={readOnly} onChange={event => updateModel(index, setCompatField(model, 'supportsDeveloperRole', event.currentTarget.value === '' ? undefined : event.currentTarget.value === 'true'))}>
                          <option value="">{t('config.inherit')}</option><option value="true">true</option><option value="false">false</option>
                        </select>
                      </label>
                    </div>
                  ) : <p>{t('config.compatNone')}</p>}
                </details>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
