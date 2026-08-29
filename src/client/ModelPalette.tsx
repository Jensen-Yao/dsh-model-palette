import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ConfigPanel } from './ConfigPanel.tsx'
import { MediaPanel } from './MediaPanel.tsx'
import { RelayPanel } from './RelayPanel.tsx'
import { choiceKey, currentChoice, flattenChoices, pushRecent, rankChoices, toggleFavorite } from './model.ts'
import { REASONING_LEVELS } from './model-config.ts'
import { ensureSelectionCompatibility, ensureSelectionReasoning, mayNeedReasoningCompatibility } from './selection-compatibility.ts'
import type { ModelChoice, PaletteProps, Selection } from './types.ts'

const FAVORITES_KEY = 'dsh-model-palette:favorites:v1'
const RECENTS_KEY = 'dsh-model-palette:recents:v1'
type ModelPaletteView = 'models' | 'media' | 'config' | 'relay'

function readStoredList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch (error) {
    console.warn(`[dsh-model-palette] ignored invalid ${key}`, error)
    return []
  }
}

function writeStoredList(key: string, values: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch (error) {
    console.warn(`[dsh-model-palette] failed to persist ${key}`, error)
  }
}

function useStoredList(key: string): [string[], (next: string[]) => void] {
  const [values, setValues] = useState<string[]>(() => readStoredList(key))
  const update = (next: string[]) => {
    setValues(next)
    writeStoredList(key, next)
  }
  return [values, update]
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }: PaletteProps) {
  const snapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot, directory.getSnapshot)
  const choices = useMemo(() => flattenChoices(snapshot.groups), [snapshot.groups])
  const current = currentChoice(choices, snapshot.current)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'models' | 'media' | 'config' | 'relay'>('models')
  const [query, setQuery] = useState('')
  const [providerId, setProviderId] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<'all' | 'favorites' | 'recents'>('all')
  const [cursor, setCursor] = useState(0)
  const [favorites, setFavorites] = useStoredList(FAVORITES_KEY)
  const [recents, setRecents] = useStoredList(RECENTS_KEY)
  const [error, setError] = useState<string | null>(null)
  const [effortBusy, setEffortBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([])

  const providers = useMemo(() => {
    const currentProvider = snapshot.current?.provider
    return [...snapshot.groups].sort((left, right) => {
      if (left.id === currentProvider) return -1
      if (right.id === currentProvider) return 1
      return left.name.localeCompare(right.name)
    })
  }, [snapshot.groups, snapshot.current?.provider])

  const results = useMemo(() => rankChoices(choices, {
    query,
    providerId,
    favorites,
    recents,
    current: snapshot.current,
    quickFilter,
  }), [choices, query, providerId, favorites, recents, snapshot.current, quickFilter])

  const favoriteCount = useMemo(() => choices.filter(choice => favorites.includes(choice.key)).length, [choices, favorites])
  const recentCount = useMemo(() => choices.filter(choice => recents.includes(choice.key)).length, [choices, recents])

  const show = useCallback((nextView: ModelPaletteView = 'models'): boolean => {
    if (!available || locked) return false
    setOpen(true)
    setView(nextView)
    setQuery('')
    setProviderId(null)
    setQuickFilter('all')
    setCursor(0)
    setError(null)
    load()
    return true
  }, [available, load, locked])

  const close = () => {
    setOpen(false)
    setError(null)
  }

  useEffect(() => {
    if (!open || view !== 'models') return
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open, view])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === 'm') {
        event.preventDefault()
        if (open) close()
        else show()
        return
      }
      if (!open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (view !== 'models') return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCursor((value) => Math.min(value + 1, Math.max(0, results.length - 1)))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursor((value) => Math.max(0, value - 1))
        return
      }
      if (event.key === 'Enter' && results[cursor] !== undefined && !isTypingTarget(event.target)) {
        event.preventDefault()
        void choose(results[cursor])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, locked, available, results, cursor, view])

  useEffect(() => {
    setCursor(0)
  }, [query, providerId])

  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, results.length - 1)))
  }, [results.length])

  useEffect(() => {
    rowRefs.current[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const choose = async (choice: ModelChoice) => {
    if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) {
      try {
        const repaired = await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)
        if (repaired.length > 0) load()
      } catch (cause) {
        setError(t('palette.compatRepairFailed', { message: messageOf(cause) }))
        return
      }
    }
    const accepted = await select(choice.selection)
    if (!accepted) {
      setError(t('palette.selectFailed'))
      return
    }
    setRecents(pushRecent(recents, choice.key))
    close()
  }

  const chooseEffort = async (value: string) => {
    if (snapshot.current === null) return
    setEffortBusy(true)
    setError(null)
    try {
      const alreadyOffered = current?.model.reasoning?.efforts.some(effort => effort.id === value) === true
      if (value !== '' && !alreadyOffered) {
        const changed = await ensureSelectionReasoning(api, snapshot.current.provider, snapshot.current.model)
        if (changed) load()
      }
      const selection: Selection = {
        provider: snapshot.current.provider,
        model: snapshot.current.model,
        ...(value === '' ? {} : { reasoningEffort: value }),
      }
      if (!await select(selection)) setError(t('palette.selectFailed'))
    } catch (cause) {
      setError(t('palette.reasoningEnableFailed', { message: messageOf(cause) }))
    } finally {
      setEffortBusy(false)
    }
  }

  const currentLabel = current?.model.name ?? snapshot.current?.model ?? t('trigger.fallback')
  const providerLabel = current?.provider.name ?? snapshot.current?.provider
  const currentReasoning = current?.model.reasoning
  const currentEffort = snapshot.current?.reasoningEffort ?? currentReasoning?.defaultEffort ?? ''
  const reasoningOptions = REASONING_LEVELS.map((level) => currentReasoning?.efforts.find(effort => effort.id === level) ?? {
    id: level,
    name: `${level.charAt(0).toUpperCase()}${level.slice(1)}`,
  })

  return (
    <div className="dmp-launcher">
      <button
        type="button"
        className="dmp-trigger"
        disabled={locked || !available}
        onClick={() => show()}
        title={`${currentLabel}${providerLabel === undefined ? '' : ` · ${providerLabel}`} · Alt+M`}
        aria-label={t('trigger.aria')}
      >
        <span className="dmp-trigger-icon" aria-hidden="true">⌘</span>
        <span className="dmp-trigger-model">{currentLabel}</span>
        {providerLabel !== undefined && <span className="dmp-trigger-provider">· {providerLabel}</span>}
        <kbd>Alt M</kbd>
      </button>

      {open && createPortal(
        <div className="dmp-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close()
        }}>
          <section className="dmp-dialog" role="dialog" aria-modal="true" aria-label={t(view === 'models' ? 'palette.title' : view === 'media' ? 'media.title' : view === 'config' ? 'config.title' : 'relay.title')}>
            <header className="dmp-header">
              <div>
                <h2>{t(view === 'models' ? 'palette.title' : view === 'media' ? 'media.title' : view === 'config' ? 'config.title' : 'relay.title')}</h2>
                <p>{view === 'models' ? `${choices.length} ${t('palette.models')} · ${t('palette.shortcut')}` : t(view === 'media' ? 'media.subtitle' : view === 'config' ? 'config.subtitle' : 'relay.subtitle')}</p>
              </div>
              <button type="button" className="dmp-close" onClick={close} aria-label={t('palette.close')}>×</button>
            </header>

            {view === 'models' && <div className="dmp-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && results[cursor] !== undefined) {
                    event.preventDefault()
                    void choose(results[cursor])
                  }
                }}
                placeholder={t('palette.search')}
                aria-label={t('palette.search')}
              />
              {query !== '' && <button type="button" onClick={() => setQuery('')} aria-label={t('palette.clear')}>×</button>}
            </div>}

            {view === 'models' && (snapshot.error !== null || error !== null) && (
              <div className="dmp-error">
                <span>{error ?? snapshot.error}</span>
                <button type="button" onClick={load}>{t('palette.retry')}</button>
              </div>
            )}

            <div className="dmp-body">
              <nav className="dmp-providers" aria-label={t('palette.providers')}>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'media' ? ' is-active' : ''}`}
                  onClick={() => setView('media')}
                >
                  <span>{t('media.nav')}</span><small>5</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'config' ? ' is-active' : ''}`}
                  onClick={() => setView('config')}
                >
                  <span>{t('config.nav')}</span><small>⚙</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'relay' ? ' is-active' : ''}`}
                  onClick={() => setView('relay')}
                >
                  <span>{t('relay.nav')}</span><small>↗</small>
                </button>
                <div className="dmp-provider-divider" />
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'all' ? 'is-active' : ''}
                  onClick={() => { setView('models'); setProviderId(null); setQuickFilter('all') }}
                >
                  <span>{t('palette.allProviders')}</span><small>{choices.length}</small>
                </button>
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'favorites' ? 'is-active' : ''}
                  onClick={() => { setView('models'); setProviderId(null); setQuickFilter('favorites') }}
                >
                  <span>{t('palette.favorites')}</span><small>{favoriteCount}</small>
                </button>
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'recents' ? 'is-active' : ''}
                  onClick={() => { setView('models'); setProviderId(null); setQuickFilter('recents') }}
                >
                  <span>{t('palette.recents')}</span><small>{recentCount}</small>
                </button>
                <div className="dmp-provider-divider" />
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={view === 'models' && providerId === provider.id ? 'is-active' : ''}
                    onClick={() => { setView('models'); setProviderId(provider.id); setQuickFilter('all') }}
                    title={`${provider.name} · ${provider.id}`}
                  >
                    <span>{provider.name}</span><small>{provider.models.length}</small>
                  </button>
                ))}
              </nav>

              {view === 'media' ? (
                <MediaPanel t={t} />
              ) : view === 'config' ? (
                <ConfigPanel api={api} isLoopback={isLoopback} t={t} />
              ) : view === 'relay' ? (
                <RelayPanel onOpenConfig={() => setView('config')} t={t} />
              ) : <main className="dmp-results">
                {snapshot.status === 'loading' && results.length === 0 && <div className="dmp-empty">{t('palette.loading')}</div>}
                {snapshot.status !== 'loading' && results.length === 0 && <div className="dmp-empty">{t('palette.empty')}</div>}
                {results.map((choice, index) => {
                  const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id
                  const isFavorite = favorites.includes(choice.key)
                  const isRecent = recents.includes(choice.key)
                  return (
                    <div
                      key={choice.key}
                      className={`dmp-result${index === cursor ? ' is-cursor' : ''}${isCurrent ? ' is-current' : ''}`}
                      onMouseEnter={() => setCursor(index)}
                    >
                      <button
                        ref={(node) => { rowRefs.current[index] = node }}
                        type="button"
                        className="dmp-result-select"
                        onClick={() => void choose(choice)}
                      >
                        <span className="dmp-result-main">
                          <span className="dmp-result-title">
                            {choice.model.name}
                            {isCurrent && <em>{t('palette.current')}</em>}
                            {isRecent && !isCurrent && <em>{t('palette.recent')}</em>}
                          </span>
                          <span className="dmp-result-meta">
                            <strong>{choice.provider.name}</strong>
                            <span>{choice.model.id}</span>
                          </span>
                          {choice.model.description !== undefined && <span className="dmp-result-description">{choice.model.description}</span>}
                        </span>
                        {choice.model.reasoning !== undefined && <span className="dmp-reasoning">R</span>}
                      </button>
                      <button
                        type="button"
                        className={`dmp-star${isFavorite ? ' is-favorite' : ''}`}
                        title={t(isFavorite ? 'favorite.remove' : 'favorite.add')}
                        aria-label={t(isFavorite ? 'favorite.remove' : 'favorite.add')}
                        onClick={() => setFavorites(toggleFavorite(favorites, choice.key))}
                      >★</button>
                    </div>
                  )
                })}
              </main>}
            </div>

            <footer className="dmp-footer">
              <div className="dmp-current">
                <span>{t('palette.current')}</span>
                <strong>{currentLabel}</strong>
                {providerLabel !== undefined && <small>{providerLabel}</small>}
              </div>
              {snapshot.current !== null && (
                <label className="dmp-effort">
                  <span>{t('palette.effort')}</span>
                  <select value={currentEffort} disabled={effortBusy} onChange={(event) => void chooseEffort(event.currentTarget.value)}>
                    <option value="">{t('palette.providerDefault')}</option>
                    {reasoningOptions.map((effort) => <option key={effort.id} value={effort.id}>{effort.name}</option>)}
                  </select>
                </label>
              )}
              {snapshot.failures.length > 0 && <span className="dmp-failures" title={snapshot.failures.map((item) => `${item.name}: ${item.message}`).join('\n')}>{t('palette.failures')} ({snapshot.failures.length})</span>}
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}
