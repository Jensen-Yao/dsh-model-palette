import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CredentialView, DiscoveredModelView, IApiClient, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import { probeProviderProtocols, revealCredential, type ProtocolProbeResult } from './config-api.ts'
import {
  CREDENTIAL_REF_PATTERN,
  PROVIDER_ID_PATTERN,
  applyMissingPresets,
  compatValue,
  deriveCredentialRef,
  duplicateModelIds,
  duplicateModelTemplate,
  isRecord,
  mergeDiscoveredModels,
  modelRecords,
  nextProviderCopyId,
  providerProfiles,
  repairProviderCompatibility,
  setCompatField,
  setInputModality,
  setOptionalPositiveInteger,
  setOptionalString,
  stringField,
} from './model-config.ts'
import {
  BUNDLED_PRESET_REGISTRY,
  applyModelPreset,
  loadOnlinePresetRegistry,
  matchModelPreset,
  type ModelPreset,
  type ModelPresetRegistry,
} from './model-presets.ts'

interface ConfigPanelProps {
  api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>
  isLoopback: boolean
  t: (key: string, params?: Record<string, unknown>) => string
}

const SETTINGS_NAMESPACE = 'llm-pi-ai'
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
  return isRecord(value) ? structuredClone(value) : { api: 'openai-completions', models: [] }
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

export function ConfigPanel({ api, isLoopback, t }: ConfigPanelProps) {
  const [namespace, setNamespace] = useState<SettingsNamespaceView | null>(null)
  const [providerId, setProviderId] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({ api: 'openai-completions', models: [] })
  const [baselineSignature, setBaselineSignature] = useState('')
  const [previousProviderId, setPreviousProviderId] = useState('')
  const [modelQuery, setModelQuery] = useState('')
  const [credential, setCredential] = useState<CredentialView | null>(null)
  const [keyDraft, setKeyDraft] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [registry, setRegistry] = useState<ModelPresetRegistry>(BUNDLED_PRESET_REGISTRY)
  const [presetState, setPresetState] = useState<'bundled' | 'loading' | 'online' | 'error'>('bundled')
  const [manualPresets, setManualPresets] = useState<Record<number, string>>({})
  const [discovered, setDiscovered] = useState<DiscoveredModelView[]>([])
  const [protocolResults, setProtocolResults] = useState<ProtocolProbeResult[] | null>(null)
  const [protocolTestModelId, setProtocolTestModelId] = useState('')
  const [busy, setBusy] = useState<'load' | 'save' | 'delete' | 'probe' | 'protocol-probe' | 'reveal' | 'presets' | null>('load')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const profiles = useMemo(
    () => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value),
    [namespace],
  )
  const providerIds = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles])
  const models = useMemo(() => modelRecords(draft), [draft])
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
  const recommendedProtocol = protocolResults?.filter(result => result.available).length === 1
    ? protocolResults.find(result => result.available)?.protocol
    : undefined
  const credentialRef = stringField(draft, 'apiKeyEnv') || deriveCredentialRef(providerId || 'provider')
  const dirty = baselineSignature !== '' && (draftSignature(providerId, draft) !== baselineSignature || keyDraft !== '')

  const describeCredential = useCallback(async (ref: string) => {
    if (!CREDENTIAL_REF_PATTERN.test(ref)) {
      setCredential(null)
      return
    }
    const response = await api.credentials.describe({ refs: [ref] })
    if (!response.result.ok) throw new Error(response.result.error.message)
    setCredential(response.result.value.credentials[ref] ?? null)
  }, [api.credentials])

  const confirmDiscard = useCallback(() => !dirty || window.confirm(t('config.discardConfirm')), [dirty, t])

  const openProvider = useCallback((id: string, view: SettingsNamespaceView | null = namespace) => {
    if (view === null) return
    const nextProfiles = providerProfiles(view.user ?? view.value)
    const profile = cloneProfile(nextProfiles[id])
    const ref = stringField(profile, 'apiKeyEnv') || deriveCredentialRef(id)
    setProviderId(id)
    setCreating(false)
    setDraft(profile)
    setBaselineSignature(draftSignature(id, profile))
    setPreviousProviderId(id)
    setModelQuery('')
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setDiscovered([])
    setProtocolResults(null)
    setProtocolTestModelId('')
    setError(null)
    setFeedback(null)
    void describeCredential(ref).catch(cause => setError(messageOf(cause)))
  }, [describeCredential, namespace])

  const selectProvider = (id: string) => {
    if (confirmDiscard()) openProvider(id)
  }

  const load = useCallback(async (force = false) => {
    if (!force && !confirmDiscard()) return
    setBusy('load')
    setError(null)
    try {
      const response = await api.settings.describe({})
      if (!response.result.ok) throw new Error(response.result.error.message)
      const view = response.result.value.namespaces.find(candidate => candidate.ns === SETTINGS_NAMESPACE)
      if (view === undefined) throw new Error(t('config.namespaceMissing'))
      setNamespace(view)
      const ids = Object.keys(providerProfiles(view.user ?? view.value)).sort((left, right) => left.localeCompare(right))
      const selected = ids.includes(providerId) ? providerId : ids[0]
      if (selected !== undefined) openProvider(selected, view)
      else {
        const empty = { api: 'openai-completions', models: [] }
        setProviderId('')
        setCreating(true)
        setDraft(empty)
        setBaselineSignature(draftSignature('', empty))
        setPreviousProviderId('')
        setModelQuery('')
        setProtocolResults(null)
        setProtocolTestModelId('')
      }
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }, [api.settings, confirmDiscard, openProvider, providerId, t])

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
    const empty = { api: 'openai-completions', models: [] }
    setPreviousProviderId(creating ? previousProviderId : providerId)
    setCreating(true)
    setProviderId('')
    setDraft(empty)
    setBaselineSignature(draftSignature('', empty))
    setModelQuery('')
    setCredential(null)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setDiscovered([])
    setProtocolResults(null)
    setProtocolTestModelId('')
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
    setModelQuery('')
    setCredential(null)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setDiscovered([])
    setProtocolResults(null)
    setError(null)
    setFeedback(t('config.copyReady'))
  }

  const updateProfileString = (key: string, value: string) => {
    setDraft(current => setOptionalString(current, key, value))
    setProtocolResults(null)
    if (key === 'apiKeyEnv') {
      setKeyDraft('')
      setKeyVisible(false)
      void describeCredential(value.trim()).catch(cause => setError(messageOf(cause)))
    }
  }

  const setModels = (next: Record<string, unknown>[]) => {
    setDraft(current => ({ ...structuredClone(current), models: next }))
    setProtocolResults(null)
  }

  const updateModel = (index: number, next: Record<string, unknown>) => {
    setModels(models.map((model, position) => position === index ? next : model))
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
    setModels(models.filter((_model, position) => position !== index))
    setManualPresets({})
  }

  const autoApplyPresets = () => {
    const result = applyMissingPresets(models, registry.presets)
    setModels(result.models)
    setFeedback(t('config.presetsApplied', { count: result.applied }))
  }

  const applyPreset = (index: number, presetId: string) => {
    const preset = registry.presets.find(candidate => candidate.id === presetId)
    if (preset === undefined) return
    updateModel(index, applyModelPreset(models[index] ?? {}, preset, true))
    setManualPresets(current => ({ ...current, [index]: preset.id }))
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
      setDiscovered(response.result.value.models)
      setFeedback(t('config.probeSuccess', { count: response.result.value.models.length }))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const importDiscovered = () => {
    const result = mergeDiscoveredModels(models, discovered)
    setModels(result.models)
    setFeedback(t('config.discoveryApplied', { added: result.added, enriched: result.enriched }))
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
      setFeedback(t(available.length === 0 ? 'config.protocolProbeNone' : available.length === 1 ? 'config.protocolProbeOne' : 'config.protocolProbeBoth', {
        protocol: available[0]?.protocol ?? '',
      }))
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
      setFeedback(t('config.revealSuccess'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const deleteProvider = async () => {
    if (namespace === null || creating || busy !== null || !confirmDiscard()) return
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
      setNamespace(response.result.value)
      const remaining = Object.keys(providerProfiles(response.result.value.user ?? response.result.value.value))
        .filter(id => id !== providerId)
        .sort((left, right) => left.localeCompare(right))
      const next = remaining[0]
      if (next === undefined) {
        const empty = { api: 'openai-completions', models: [] }
        setCreating(true)
        setProviderId('')
        setDraft(empty)
        setBaselineSignature(draftSignature('', empty))
        setPreviousProviderId('')
        setModelQuery('')
        setCredential(null)
        setKeyDraft('')
        setKeyVisible(false)
      } else {
        openProvider(next, response.result.value)
      }
      setFeedback(t('config.deleted'))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (namespace === null || busy !== null) return
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
      profile.models = models.map(model => ({ ...model, id: String(model.id).trim() }))
      const repaired = repairProviderCompatibility(profile)
      const savedProfile = repaired.profile
      const response = await api.settings.mutate({
        ns: SETTINGS_NAMESPACE,
        ops: [{ op: 'set', path: ['providers', id], value: savedProfile }],
        expectedRevision: namespace.revision,
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      setNamespace(response.result.value)
      setDraft(savedProfile)
      setBaselineSignature(draftSignature(id, savedProfile))
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

  const readOnly = namespace === null || busy !== null
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
          <button type="button" disabled={busy !== null} onClick={() => void load()}>{t('config.reload')}</button>
          <button type="button" disabled={busy !== null} onClick={startCreate}>{t('config.addProvider')}</button>
        </div>
      </section>

      {error !== null && <div className="dmp-media-error" role="alert">{error}</div>}
      {feedback !== null && <div className="dmp-media-feedback" aria-live="polite"><strong>{t('config.done')}</strong><span>{feedback}</span></div>}
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
            <input value={providerId} disabled={!creating || busy !== null} onChange={event => setProviderId(event.currentTarget.value.toLocaleLowerCase())} placeholder="my-provider" />
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
                onChange={event => { setKeyDraft(event.currentTarget.value); setProtocolResults(null) }}
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
            <button type="button" disabled={busy !== null || protocolTestModel === undefined} onClick={() => void probeProtocols()}>{busy === 'protocol-probe' ? t('config.protocolProbing') : t('config.protocolProbe')}</button>
            {discovered.length > 0 && <button type="button" disabled={busy !== null} onClick={importDiscovered}>{t('config.importDiscovery', { count: discovered.length })}</button>}
            <button className="dmp-media-primary" type="button" disabled={busy !== null || (!dirty && !compatibilityRepair.changed)} onClick={() => void save()}>{busy === 'save' ? t('config.saving') : t('config.save')}</button>
          </div>
        </div>
        {protocolResults !== null && (
          <div className="dmp-config-protocol-results">
            {protocolResults.map(result => <span className={result.available ? 'is-ok' : 'is-error'} key={result.protocol}>
              <strong>{result.protocol}</strong>{result.available ? t('config.protocolAvailable') : t('config.protocolUnavailable', { error: result.error ?? '?' })}
            </span>)}
            {recommendedProtocol !== undefined && recommendedProtocol !== protocol && <button type="button" disabled={busy !== null} onClick={applyRecommendedProtocol}>{t('config.protocolApplyRecommended', { protocol: recommendedProtocol })}</button>}
          </div>
        )}
      </section>

      <section className="dmp-config-card dmp-config-model-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.modelsTitle')}</h3><p>{t('config.modelsDescription')}</p></div>
          <div className="dmp-config-heading-actions">
            <span>{presetStatusText}</span>
            <input className="dmp-config-model-search" value={modelQuery} onChange={event => setModelQuery(event.currentTarget.value)} placeholder={t('config.searchModels')} aria-label={t('config.searchModels')} />
            <button type="button" disabled={busy !== null} onClick={() => void refreshPresets()}>{t('config.refreshPresets')}</button>
            <button type="button" disabled={busy !== null || models.length === 0} onClick={autoApplyPresets}>{t('config.autoPreset')}</button>
            <button type="button" disabled={busy !== null} onClick={addModel}>{t('config.addModel')}</button>
          </div>
        </div>

        {models.length === 0 && <div className="dmp-config-empty">{t('config.noModels')}</div>}
        {models.length > 0 && visibleModels.length === 0 && <div className="dmp-config-empty">{t('config.noMatchingModels')}</div>}
        <div className="dmp-config-models">
          {visibleModels.map(({ model, index }) => {
            const automatic = sourcePreset(model, registry.presets)
            const selectedPresetId = manualPresets[index] ?? automatic?.id ?? ''
            const selectedPreset = registry.presets.find(preset => preset.id === selectedPresetId)
            const input = Array.isArray(model.input) ? model.input : []
            return (
              <article className="dmp-config-model" key={`${String(model.id)}-${index}`}>
                <div className="dmp-config-model-top">
                  <strong>{typeof model.name === 'string' && model.name !== '' ? model.name : typeof model.id === 'string' && model.id !== '' ? model.id : `${t('config.model')} ${index + 1}`}</strong>
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
                  <fieldset className="dmp-config-inputs">
                    <legend>{t('config.inputTypes')}</legend>
                    <label><input type="checkbox" checked={input.includes('text')} disabled={readOnly} onChange={event => updateModel(index, setInputModality(model, 'text', event.currentTarget.checked))} /> Text</label>
                    <label><input type="checkbox" checked={input.includes('image')} disabled={readOnly} onChange={event => updateModel(index, setInputModality(model, 'image', event.currentTarget.checked))} /> Image</label>
                    <small>{t('config.inputInherit')}</small>
                  </fieldset>
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
                  </div>
                </div>

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
