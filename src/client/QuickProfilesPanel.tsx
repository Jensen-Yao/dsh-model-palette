/** Named model selections, with explicit update, reorder and undo controls. */
import { useId, useRef, useState } from 'react'
import { QUICK_PROFILE_NAME_LIMIT, moveQuickProfile, sameSelection, saveQuickProfile, type QuickProfile } from './quick-profiles.ts'
import type { ModelChoice, Selection } from './types.ts'

interface QuickProfilesProps {
  profiles: QuickProfile[]
  current: Selection | null
  choices: ModelChoice[]
  busy: boolean
  onChange: (profiles: QuickProfile[]) => void
  onActivate: (selection: Selection) => void
  onReload: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}

/**
 * Manage local named selections without writing provider configuration.
 * @param props Current selection, available directory and shortcut actions.
 * @returns Labeled save form and ordered shortcut cards.
 */
export function QuickProfilesPanel({ profiles, current, choices, busy, onChange, onActivate, onReload, t }: QuickProfilesProps): JSX.Element {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<{ profile: QuickProfile; index: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const errorId = useId()
  const nameInput = useRef<HTMLInputElement>(null)
  const editing = profiles.find(profile => profile.id === editingId)
  const selection = editing?.selection ?? current
  const selectedChoice = choices.find(choice => choice.provider.id === selection?.provider && choice.model.id === selection?.model)

  const change = (next: QuickProfile[]): boolean => {
    try {
      onChange(next)
      setError(null)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'quick.storageFailed')
      return false
    }
  }

  const save = () => {
    if (selection === null || busy) return
    try {
      const profile = { id: editing?.id ?? crypto.randomUUID(), name, selection }
      if (!change(saveQuickProfile(profiles, profile))) return
      setFeedback(t('quick.saved', { name: name.trim() }))
      setName('')
      setEditingId(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'quick.storageFailed')
    }
  }

  const undo = () => {
    if (deleted === null) return
    try {
      if (profiles.some(profile => profile.id === deleted.profile.id || profile.name.toLocaleLowerCase() === deleted.profile.name.toLocaleLowerCase())) throw new Error('quick.nameTaken')
      const restored = saveQuickProfile(profiles, deleted.profile)
      const index = restored.findIndex(profile => profile.id === deleted.profile.id)
      const profile = restored.splice(index, 1)[0]!
      restored.splice(Math.min(deleted.index, restored.length), 0, profile)
      if (change(restored)) { setDeleted(null); setFeedback(t('quick.restored')) }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'quick.storageFailed')
    }
  }

  return (
    <main className="dmp-quick-panel">
      <h3>{t('quick.title')}</h3>
      <p>{t('quick.description')}</p>
      {error !== null && <p id={errorId} role="alert">{t(error)}</p>}
      {feedback !== null && <p role="status">{feedback}</p>}
      <form onSubmit={event => { event.preventDefault(); save() }} className="dmp-quick-form">
        <label>{t('quick.name')}
          <input ref={nameInput} autoFocus required value={name} maxLength={QUICK_PROFILE_NAME_LIMIT} placeholder={t('quick.namePlaceholder')}
            disabled={busy} onChange={event => setName(event.currentTarget.value)} aria-invalid={error === 'quick.nameInvalid' || error === 'quick.nameTaken'} aria-describedby={error === null ? undefined : errorId} />
        </label>
        <div className="dmp-quick-selection">
          <strong>{selectedChoice?.model.name ?? selection?.model ?? t('quick.noCurrent')}</strong>
          {selection !== null && <span>{selectedChoice?.provider.name ?? selection.provider} · {selection.reasoningEffort ?? t('palette.providerDefault')}</span>}
        </div>
        <div className="dmp-quick-actions">
          <button type="submit" disabled={busy || selection === null || name.trim() === ''}>{t(editing === undefined ? 'quick.saveCurrent' : 'quick.saveName')}</button>
          {editingId !== null && <button type="button" disabled={busy} onClick={() => { setEditingId(null); setName(''); setError(null) }}>{t('quick.cancelEdit')}</button>}
          <button type="button" disabled={busy} onClick={onReload}>{t('quick.refresh')}</button>
        </div>
      </form>
      {deleted !== null && <div className="dmp-quick-undo"><span>{t('quick.deleted', { name: deleted.profile.name })}</span><button type="button" disabled={busy} onClick={undo}>{t('quick.undo')}</button></div>}
      {profiles.length === 0 && <div className="dmp-empty">{t('quick.empty')}</div>}
      <ol className="dmp-quick-list">
        {profiles.map((profile, index) => {
          const choice = choices.find(item => item.provider.id === profile.selection.provider && item.model.id === profile.selection.model)
          const active = sameSelection(current, profile.selection)
          return (
            <li key={profile.id} className={active ? 'is-current' : ''}>
              <div className="dmp-quick-card-head">
                <button type="button" className="dmp-quick-activate" disabled={busy || choice === undefined} onClick={() => onActivate(profile.selection)}>
                  <strong>{profile.name}</strong>{active && <em>{t('palette.current')}</em>}
                  {index < 3 && <kbd>Alt Shift {index + 1}</kbd>}
                </button>
                <button type="button" disabled={busy || index === 0} aria-label={t('quick.moveUp', { name: profile.name })} onClick={() => change(moveQuickProfile(profiles, profile.id, -1))}>↑</button>
                <button type="button" disabled={busy || index === profiles.length - 1} aria-label={t('quick.moveDown', { name: profile.name })} onClick={() => change(moveQuickProfile(profiles, profile.id, 1))}>↓</button>
              </div>
              <div className="dmp-quick-selection"><strong>{choice?.model.name ?? profile.selection.model}</strong><span>{choice?.provider.name ?? profile.selection.provider} · {profile.selection.reasoningEffort ?? t('palette.providerDefault')}</span></div>
              {choice === undefined && <p className="dmp-quick-unavailable">{t('quick.unavailable')}</p>}
              <div className="dmp-quick-actions">
                <button type="button" disabled={busy} onClick={() => {
                  setEditingId(profile.id); setName(profile.name); setError(null)
                  nameInput.current?.focus()
                  nameInput.current?.scrollIntoView({ block: 'nearest' })
                }}>{t('quick.rename')}</button>
                <button type="button" disabled={busy || current === null} onClick={() => {
                  if (current !== null && change(saveQuickProfile(profiles, { ...profile, selection: current }))) setFeedback(t('quick.updated', { name: profile.name }))
                }}>{t('quick.updateCurrent')}</button>
                <button type="button" disabled={busy} onClick={() => {
                  if (change(profiles.filter(item => item.id !== profile.id))) {
                    setDeleted({ profile, index })
                    setFeedback(null)
                    if (editingId === profile.id) { setEditingId(null); setName('') }
                  }
                }}>{t('quick.remove')}</button>
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
