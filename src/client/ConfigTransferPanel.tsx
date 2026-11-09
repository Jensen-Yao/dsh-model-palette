/** Saved-provider backup and selective batch import controls. */
import { useMemo, useState } from 'react'
import type { SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import { BACKUP_FILE_LIMIT, createConfigBackup, parseConfigBackup, planConfigImport, type ConfigBackup, type ImportStrategy } from './config-transfer.ts'
import { providerProfiles } from './model-config.ts'
import type { PaletteApi } from './remote-compat.ts'

interface ConfigTransferProps {
  api: PaletteApi
  namespace: SettingsNamespaceView
  pluginNamespace: SettingsNamespaceView
  disabled: boolean
  beforeImport: () => boolean
  onBusy: (busy: boolean) => void
  onApplied: (namespace: SettingsNamespaceView, pluginNamespace: SettingsNamespaceView) => void
  t: (key: string, params?: Record<string, unknown>) => string
}

/**
 * Export only saved overrides; imports remain a preview until explicitly applied.
 * @param props Live descriptors, revision-aware API, and parent editor callbacks.
 * @returns Native disclosure with labeled batch-selection and file controls.
 */
export function ConfigTransferPanel({ api, namespace, pluginNamespace, disabled, beforeImport, onBusy, onApplied, t }: ConfigTransferProps): JSX.Element {
  const profiles = useMemo(() => providerProfiles(namespace.user ?? namespace.value), [namespace])
  const ids = Object.keys(profiles).sort()
  const [exportSelection, setExportSelection] = useState<string[]>([])
  const [incoming, setIncoming] = useState<ConfigBackup | null>(null)
  const [removed, setRemoved] = useState<string[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [strategy, setStrategy] = useState<ImportStrategy>('skip')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const plan = useMemo(() => incoming === null ? null : planConfigImport(incoming, profiles, selection, strategy), [incoming, profiles, selection, strategy])
  const selectedExports = exportSelection.filter(id => Object.hasOwn(profiles, id))
  const locked = disabled || reading
  const toggle = (values: string[], id: string) => values.includes(id) ? values.filter(value => value !== id) : [...values, id]

  const download = () => {
    setError(null)
    try {
      const result = createConfigBackup(namespace.user ?? namespace.value, pluginNamespace.value, selectedExports)
      const url = URL.createObjectURL(new Blob([`${JSON.stringify(result.backup, null, 2)}\n`], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'dsh-model-palette-backup.json'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setRemoved(result.removed)
      setMessage(t('transfer.exported', { count: selectedExports.length }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const readFile = async (file: File) => {
    setReading(true)
    setIncoming(null)
    setMessage(null)
    setError(null)
    setRemoved([])
    try {
      if (file.size > BACKUP_FILE_LIMIT) throw new Error(t('transfer.tooLarge'))
      const result = parseConfigBackup(await file.text())
      setIncoming(result.backup)
      setSelection(Object.keys(result.backup.providers))
      setRemoved(result.removed)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setReading(false)
    }
  }

  const apply = async () => {
    if (locked || plan === null || plan.providerOps.length === 0 || !beforeImport()) return
    onBusy(true)
    setError(null)
    setMessage(null)
    let nextNamespace = namespace
    try {
      const response = await api.settings.mutate({ ns: namespace.ns, ops: plan.providerOps, expectedRevision: namespace.revision })
      if (!response.result.ok) throw new Error(response.result.error.message)
      nextNamespace = response.result.value
      onApplied(nextNamespace, pluginNamespace)
      let nextPlugin = pluginNamespace
      if (plan.pluginOps.length > 0) {
        const rules = await api.settings.mutate({ ns: pluginNamespace.ns, ops: plan.pluginOps, expectedRevision: pluginNamespace.revision })
        if (!rules.result.ok) throw new Error(rules.result.error.message)
        nextPlugin = rules.result.value
      }
      onApplied(nextNamespace, nextPlugin)
      setIncoming(null)
      setMessage(t('transfer.imported', { count: plan.rows.filter(row => row.action !== 'skip').length }))
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause)
      setError(nextNamespace === namespace ? detail : t('transfer.partial', { error: detail }))
    } finally {
      onBusy(false)
    }
  }

  return (
    <details className="dmp-transfer">
      <summary>{t('transfer.title')}</summary>
      <p>{t('transfer.hint')}</p>
      {error !== null && <p role="alert">{error}</p>}
      {message !== null && <p role="status">{message}</p>}
      {removed.length > 0 && <p>{t('transfer.removed', { fields: removed.join(', ') })}</p>}
      <fieldset disabled={locked}>
        <legend>{t('transfer.export')}</legend>
        <div className="dmp-transfer-actions">
          <button type="button" onClick={() => setExportSelection(ids)}>{t('transfer.selectAll')}</button>
          <button type="button" onClick={() => setExportSelection([])}>{t('transfer.selectNone')}</button>
          <button type="button" disabled={selectedExports.length === 0} onClick={download}>{t('transfer.download', { count: selectedExports.length })}</button>
        </div>
        <div className="dmp-transfer-options">
          {ids.map(id => <label key={id}><input type="checkbox" checked={selectedExports.includes(id)} onChange={() => setExportSelection(toggle(selectedExports, id))} />{id}</label>)}
          {ids.length === 0 && <span>{t('transfer.noProviders')}</span>}
        </div>
      </fieldset>
      <label className="dmp-transfer-file">
        <span>{t('transfer.file')}</span>
        <input type="file" accept=".json,application/json" disabled={locked} onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file !== undefined) void readFile(file)
        }} />
      </label>
      {plan !== null && incoming !== null && (
        <fieldset disabled={locked}>
          <legend>{t('transfer.preview')}</legend>
          <label>{t('transfer.conflict')}
            <select value={strategy} onChange={event => setStrategy(event.currentTarget.value as ImportStrategy)}>
              <option value="skip">{t('transfer.skip')}</option>
              <option value="merge">{t('transfer.merge')}</option>
              <option value="copy">{t('transfer.copy')}</option>
            </select>
          </label>
          <div className="dmp-transfer-actions">
            <button type="button" onClick={() => setSelection(Object.keys(incoming.providers))}>{t('transfer.selectAll')}</button>
            <button type="button" onClick={() => setSelection([])}>{t('transfer.selectNone')}</button>
          </div>
          <div className="dmp-transfer-options">
            {Object.keys(incoming.providers).map(id => {
              const row = plan.rows.find(candidate => candidate.source === id)
              return <label key={id}><input type="checkbox" checked={selection.includes(id)} onChange={() => setSelection(toggle(selection, id))} />
                <span>{id}{row === undefined ? '' : ` → ${row.target} · ${t(`transfer.action.${row.action}`)}`}</span>
              </label>
            })}
          </div>
          <p>{t('transfer.previewHint')}</p>
          <div className="dmp-transfer-actions">
            <button type="button" disabled={plan.providerOps.length === 0} onClick={() => void apply()}>{t('transfer.apply', { count: plan.rows.filter(row => row.action !== 'skip').length })}</button>
            <button type="button" onClick={() => { setIncoming(null); setRemoved([]) }}>{t('transfer.cancel')}</button>
          </div>
        </fieldset>
      )}
    </details>
  )
}
