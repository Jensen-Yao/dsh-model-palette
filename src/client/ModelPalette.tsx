import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { choiceKey, currentChoice, flattenChoices, pushRecent, rankChoices, toggleFavorite } from './model.ts'
import type { ModelChoice, PaletteProps, Selection } from './types.ts'

const FAVORITES_KEY = 'dsh-model-palette:favorites:v1'
const RECENTS_KEY = 'dsh-model-palette:recents:v1'

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

export function ModelPalette({ locked, available, directory, load, select, t }: PaletteProps) {
  const snapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot, directory.getSnapshot)
  const choices = useMemo(() => flattenChoices(snapshot.groups), [snapshot.groups])
  const current = currentChoice(choices, snapshot.current)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [providerId, setProviderId] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [favorites, setFavorites] = useStoredList(FAVORITES_KEY)
  const [recents, setRecents] = useStoredList(RECENTS_KEY)
  const [error, setError] = useState<string | null>(null)
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
  }), [choices, query, providerId, favorites, recents, snapshot.current])

  const show = () => {
    if (!available || locked) return
    setOpen(true)
    setQuery('')
    setProviderId(null)
    setCursor(0)
    setError(null)
    load()
  }

  const close = () => {
    setOpen(false)
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

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
  }, [open, locked, available, results, cursor])

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
    const selection: Selection = {
      provider: snapshot.current.provider,
      model: snapshot.current.model,
      ...(value === '' ? {} : { reasoningEffort: value }),
    }
    if (!await select(selection)) setError(t('palette.selectFailed'))
  }

  const currentLabel = current?.model.name ?? snapshot.current?.model ?? t('trigger.fallback')
  const providerLabel = current?.provider.name ?? snapshot.current?.provider
  const currentReasoning = current?.model.reasoning
  const currentEffort = snapshot.current?.reasoningEffort ?? currentReasoning?.defaultEffort ?? ''

  return (
    <div className="dmp-seat">
      <button
        type="button"
        className="dmp-trigger"
        disabled={locked || !available}
        onClick={show}
        title={`${currentLabel}${providerLabel === undefined ? '' : ` · ${providerLabel}`} · Alt+M`}
        aria-label={t('trigger.aria')}
      >
        <span className="dmp-trigger-icon" aria-hidden="true">⌘</span>
        <span className="dmp-trigger-model">{currentLabel}</span>
        {providerLabel !== undefined && <span className="dmp-trigger-provider">· {providerLabel}</span>}
        <kbd>Alt M</kbd>
      </button>

      {open && (
        <div className="dmp-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close()
        }}>
          <section className="dmp-dialog" role="dialog" aria-modal="true" aria-label={t('palette.title')}>
            <header className="dmp-header">
              <div>
                <h2>{t('palette.title')}</h2>
                <p>{choices.length} {t('palette.models')} · {t('palette.shortcut')}</p>
              </div>
              <button type="button" className="dmp-close" onClick={close} aria-label={t('palette.close')}>×</button>
            </header>

            <div className="dmp-search-wrap">
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
            </div>

            {(snapshot.error !== null || error !== null) && (
              <div className="dmp-error">
                <span>{error ?? snapshot.error}</span>
                <button type="button" onClick={load}>{t('palette.retry')}</button>
              </div>
            )}

            <div className="dmp-body">
              <nav className="dmp-providers" aria-label={t('palette.providers')}>
                <button
                  type="button"
                  className={providerId === null ? 'is-active' : ''}
                  onClick={() => setProviderId(null)}
                >
                  <span>{t('palette.allProviders')}</span><small>{choices.length}</small>
                </button>
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={providerId === provider.id ? 'is-active' : ''}
                    onClick={() => setProviderId(provider.id)}
                    title={`${provider.name} · ${provider.id}`}
                  >
                    <span>{provider.name}</span><small>{provider.models.length}</small>
                  </button>
                ))}
              </nav>

              <main className="dmp-results">
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
              </main>
            </div>

            <footer className="dmp-footer">
              <div className="dmp-current">
                <span>{t('palette.current')}</span>
                <strong>{currentLabel}</strong>
                {providerLabel !== undefined && <small>{providerLabel}</small>}
              </div>
              {currentReasoning !== undefined && (
                <label className="dmp-effort">
                  <span>{t('palette.effort')}</span>
                  <select value={currentEffort} onChange={(event) => void chooseEffort(event.currentTarget.value)}>
                    {currentReasoning.defaultEffort === undefined && <option value="">{t('palette.providerDefault')}</option>}
                    {currentReasoning.efforts.map((effort) => <option key={effort.id} value={effort.id}>{effort.name}</option>)}
                  </select>
                </label>
              )}
              {snapshot.failures.length > 0 && <span className="dmp-failures" title={snapshot.failures.map((item) => `${item.name}: ${item.message}`).join('\n')}>{t('palette.failures')} ({snapshot.failures.length})</span>}
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
