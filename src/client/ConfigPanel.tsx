import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CredentialView, DiscoveredModelView, IApiClient, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import { revealCredential } from './config-api.ts'
import {
  CREDENTIAL_REF_PATTERN,
  PROVIDER_ID_PATTERN,
  applyMissingPresets,
  compatValue,
  deriveCredentialRef,
  isRecord,
  mergeDiscoveredModels,
  modelRecords,
  providerProfiles,
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

export function ConfigPanel({ api, isLoopback, t }: ConfigPanelProps) {
  const [namespace, setNamespace] = useState<SettingsNamespaceView | null>(null)
  const [providerId, setProviderId] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({ api: 'openai-completions', models: [] })
  const [credential, setCredential] = useState<CredentialView | null>(null)
  const [keyDraft, setKeyDraft] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [registry, setRegistry] = useState<ModelPresetRegistry>(BUNDLED_PRESET_REGISTRY)
  const [presetState, setPresetState] = useState<'bundled' | 'loading' | 'online' | 'error'>('bundled')
  const [manualPresets, setManualPresets] = useState<Record<number, string>>({})
  const [discovered, setDiscovered] = useState<DiscoveredModelView[]>([])
  const [busy, setBusy] = useState<'load' | 'save' | 'probe' | 'reveal' | 'presets' | null>('load')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const profiles = useMemo(
    () => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value),
    [namespace],
  )
  const providerIds = useMemo(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles])
  const models = useMemo(() => modelRecords(draft), [draft])
  const protocol = stringField(draft, 'api')
  const credentialRef = stringField(draft, 'apiKeyEnv') || deriveCredentialRef(providerId || 'provider')

  const describeCredential = useCallback(async (ref: string) => {
    if (!CREDENTIAL_REF_PATTERN.test(ref)) {
      setCredential(null)
      return
    }
    const response = await api.credentials.describe({ refs: [ref] })
    if (!response.result.ok) throw new Error(response.result.error.message)
    setCredential(response.result.value.credentials[ref] ?? null)
  }, [api.credentials])

  const selectProvider = useCallback((id: string, view: SettingsNamespaceView | null = namespace) => {
    if (view === null) return
    const nextProfiles = providerProfiles(view.user ?? view.value)
    const profile = cloneProfile(nextProfiles[id])
    const ref = stringField(profile, 'apiKeyEnv') || deriveCredentialRef(id)
    setProviderId(id)
    setCreating(false)
    setDraft(profile)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setDiscovered([])
    setError(null)
    setFeedback(null)
    void describeCredential(ref).catch(cause => setError(messageOf(cause)))
  }, [describeCredential, namespace])

  const load = useCallback(async () => {
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
      if (selected !== undefined) selectProvider(selected, view)
      else {
        setProviderId('')
        setCreating(true)
        setDraft({ api: 'openai-completions', models: [] })
      }
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }, [api.settings, providerId, selectProvider, t])

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

  useEffect(() => { void load() }, [])
  useEffect(() => { void refreshPresets() }, [refreshPresets])

  const startCreate = () => {
    setCreating(true)
    setProviderId('')
    setDraft({ api: 'openai-completions', models: [] })
    setCredential(null)
    setKeyDraft('')
    setKeyVisible(false)
    setManualPresets({})
    setDiscovered([])
    setError(null)
    setFeedback(null)
  }

  const updateProfileString = (key: string, value: string) => {
    setDraft(current => setOptionalString(current, key, value))
    if (key === 'apiKeyEnv') {
      setKeyDraft('')
      setKeyVisible(false)
      void describeCredential(value.trim()).catch(cause => setError(messageOf(cause)))
    }
  }

  const setModels = (next: Record<string, unknown>[]) => {
    setDraft(current => ({ ...structuredClone(current), models: next }))
  }

  const updateModel = (index: number, next: Record<string, unknown>) => {
    setModels(models.map((model, position) => position === index ? next : model))
  }

  const addModel = () => {
    setModels([...models, { id: '' }])
    setManualPresets(current => ({ ...current, [models.length]: '' }))
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

  const save = async () => {
    if (namespace === null || busy !== null) return
    setBusy('save')
    setError(null)
    setFeedback(null)
    try {
      const id = providerId.trim()
      const ref = credentialRef.trim()
      if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t('config.providerIdInvalid'))
      if (!CREDENTIAL_REF_PATTERN.test(ref)) throw new Error(t('config.credentialRefInvalid'))
      if (stringField(draft, 'baseURL').trim() === '') throw new Error(t('config.baseUrlRequired'))
      if (!PROTOCOLS.includes(stringField(draft, 'api') as typeof PROTOCOLS[number])) throw new Error(t('config.protocolRequired'))
      if (models.length === 0 || models.some(model => typeof model.id !== 'string' || model.id.trim() === '')) {
        throw new Error(t('config.modelIdRequired'))
      }
      const key = keyDraft.trim()
      if (key !== '' && !LEGAL_API_KEY.test(key)) throw new Error(t('config.keyInvalid'))
      const profile = structuredClone(draft)
      profile.apiKeyEnv = ref
      profile.models = models.map(model => ({ ...model, id: String(model.id).trim() }))
      const response = await api.settings.mutate({
        ns: SETTINGS_NAMESPACE,
        ops: [{ op: 'set', path: ['providers', id], value: profile }],
        expectedRevision: namespace.revision,
      })
      if (!response.result.ok) throw new Error(response.result.error.message)
      setNamespace(response.result.value)
      if (key !== '') {
        const stored = await api.credentials.set({ ref, value: key })
        if (!stored.result.ok) throw new Error(`${t('config.settingsSavedKeyFailed')}: ${stored.result.error.message}`)
      }
      setCreating(false)
      setKeyDraft('')
      setKeyVisible(false)
      await describeCredential(ref)
      setFeedback(t('config.saved'))
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
          <button type="button" disabled={busy !== null} onClick={() => void load()}>{t('config.reload')}</button>
          <button type="button" disabled={busy !== null} onClick={startCreate}>{t('config.addProvider')}</button>
        </div>
      </section>

      {error !== null && <div className="dmp-media-error" role="alert">{error}</div>}
      {feedback !== null && <div className="dmp-media-feedback" aria-live="polite"><strong>{t('config.done')}</strong><span>{feedback}</span></div>}

      <section className="dmp-config-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.providerTitle')}</h3><p>{t('config.providerDescription')}</p></div>
          {!creating && providerIds.length > 0 && (
            <select value={providerId} onChange={event => selectProvider(event.currentTarget.value)} disabled={busy !== null}>
              {providerIds.map(id => <option key={id} value={id}>{stringField(profiles[id] ?? {}, 'displayName') || id}</option>)}
            </select>
          )}
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
                onChange={event => setKeyDraft(event.currentTarget.value)}
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
          <div>
            <button type="button" disabled={busy !== null} onClick={() => void probe()}>{busy === 'probe' ? t('config.probing') : t('config.probe')}</button>
            {discovered.length > 0 && <button type="button" disabled={busy !== null} onClick={importDiscovered}>{t('config.importDiscovery', { count: discovered.length })}</button>}
            <button className="dmp-media-primary" type="button" disabled={busy !== null} onClick={() => void save()}>{busy === 'save' ? t('config.saving') : t('config.save')}</button>
          </div>
        </div>
      </section>

      <section className="dmp-config-card dmp-config-model-card">
        <div className="dmp-config-card-heading">
          <div><h3>{t('config.modelsTitle')}</h3><p>{t('config.modelsDescription')}</p></div>
          <div className="dmp-config-heading-actions">
            <span>{presetStatusText}</span>
            <button type="button" disabled={busy !== null} onClick={() => void refreshPresets()}>{t('config.refreshPresets')}</button>
            <button type="button" disabled={busy !== null || models.length === 0} onClick={autoApplyPresets}>{t('config.autoPreset')}</button>
            <button type="button" disabled={busy !== null} onClick={addModel}>{t('config.addModel')}</button>
          </div>
        </div>

        {models.length === 0 && <div className="dmp-config-empty">{t('config.noModels')}</div>}
        <div className="dmp-config-models">
          {models.map((model, index) => {
            const automatic = sourcePreset(model, registry.presets)
            const selectedPresetId = manualPresets[index] ?? automatic?.id ?? ''
            const selectedPreset = registry.presets.find(preset => preset.id === selectedPresetId)
            const input = Array.isArray(model.input) ? model.input : []
            return (
              <article className="dmp-config-model" key={`${String(model.id)}-${index}`}>
                <div className="dmp-config-model-top">
                  <strong>{typeof model.name === 'string' && model.name !== '' ? model.name : typeof model.id === 'string' && model.id !== '' ? model.id : `${t('config.model')} ${index + 1}`}</strong>
                  <button type="button" disabled={busy !== null} onClick={() => removeModel(index)}>{t('config.remove')}</button>
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
