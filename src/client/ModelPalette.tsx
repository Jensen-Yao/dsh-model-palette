import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ConfigPanel } from './ConfigPanel.tsx'
import { QuickProfilesPanel } from './QuickProfilesPanel.tsx'
import { useQuickProfiles } from './quick-profiles-store.ts'
import { MediaPanel } from './MediaPanel.tsx'
import { resolveProviderModels } from './config-api.ts'
import type { RankOptions } from './model.ts'
import { RelayPanel } from './RelayPanel.tsx'
import { choiceKey, currentChoice, flattenChoices, pushRecent, rankChoices, toggleFavorite } from './model.ts'
import { formatTokenCount, REASONING_LEVELS } from './model-config.ts'
import { ProviderIcon } from './ProviderIcon.tsx'
import { providerMeta } from './provider-catalog.ts'
import { ensureSelectionCompatibility, ensureSelectionReasoning, mayNeedReasoningCompatibility } from './selection-compatibility.ts'
import type { ModelChoice, PaletteProps, Selection } from './types.ts'

const FAVORITES_KEY = 'dsh-model-palette:favorites:v1'
const RECENTS_KEY = 'dsh-model-palette:recents:v1'
type ModelPaletteView = 'models' | 'media' | 'config' | 'catalog' | 'relay' | 'quick'

interface ModelBadges {
  context?: number
  output?: number
  image: boolean
  free: boolean
}

const RESULT_PAGE_SIZE = 80

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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface EffortSliderProps {
  value: string
  options: ReadonlyArray<{ id: string; name: string }>
  defaultLabel: string
  label: string
  disabled: boolean
  /** Compact single-row seat variant rendered next to the composer trigger. */
  compact?: boolean
  onChange: (value: string) => void
}

/**
 * Codex-style discrete reasoning-effort slider. Stops come from the current
 * model's declared efforts only, prefixed by the provider default.
 */
function EffortSlider({ value, options, defaultLabel, label, disabled, compact = false, onChange }: EffortSliderProps): JSX.Element {
  const stops = ['', ...options.map(option => option.id)]
  const index = value === '' ? 0 : Math.max(0, stops.indexOf(value))
  const activeName = value === '' ? defaultLabel : options.find(option => option.id === value)?.name ?? value
  if (compact) {
    return (
      <div className={`dmp-effort-slider is-compact${disabled ? ' is-busy' : ''}`} title={`${label}: ${activeName}`}>
        <span className="dmp-effort-slider-value">{activeName}</span>
        <input
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={Math.min(index, stops.length - 1)}
          disabled={disabled}
          aria-label={label}
          onChange={event => onChange(stops[Number(event.currentTarget.value)])}
        />
      </div>
    )
  }
  return (
    <div className={`dmp-effort-slider${disabled ? ' is-busy' : ''}`}>
      <div className="dmp-effort-slider-head">
        <span>{label}</span>
        <strong>{activeName}</strong>
      </div>
      <input
        type="range"
        min={0}
        max={stops.length - 1}
        step={1}
        value={Math.min(index, stops.length - 1)}
        disabled={disabled}
        aria-label={label}
        onChange={event => onChange(stops[Number(event.currentTarget.value)])}
      />
      <div className="dmp-effort-slider-scale">
        <span className={value === '' ? 'is-on' : ''}>{defaultLabel}</span>
        {options.map(option => (
          <span key={option.id} className={option.id === value ? 'is-on' : ''}>{option.name}</span>
        ))}
      </div>
    </div>
  )
}

export function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }: PaletteProps) {
  const snapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot, directory.getSnapshot)
  const choices = useMemo(() => flattenChoices(snapshot.groups), [snapshot.groups])
  const current = currentChoice(choices, snapshot.current)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ModelPaletteView>('models')
  const [query, setQuery] = useState('')
  const [providerId, setProviderId] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<'all' | 'favorites' | 'recents'>('all')
  const [cursor, setCursor] = useState(0)
  const [capability, setCapability] = useState<NonNullable<RankOptions['capability']>>('all')
  const [sort, setSort] = useState<NonNullable<RankOptions['sort']>>('recommended')
  const [resultLimit, setResultLimit] = useState(RESULT_PAGE_SIZE)
  const [favorites, setFavorites] = useStoredList(FAVORITES_KEY)
  const [recents, setRecents] = useStoredList(RECENTS_KEY)
  const [error, setError] = useState<string | null>(null)
  const [selectionBusy, setSelectionBusy] = useState(false)
  const selectingRef = useRef(false)
  const [quickProfiles, setQuickProfiles] = useQuickProfiles()
  const [previousSelection, setPreviousSelection] = useState<Selection | null>(null)
  const lastSelectionRef = useRef<Selection | null>(null)
  const leaveGuardRef = useRef<(() => boolean) | null>(null)
  const registerLeaveGuard = useCallback((guard: (() => boolean) | null) => { leaveGuardRef.current = guard }, [])
  const selectionDisabled = locked || !available || selectionBusy || snapshot.status === 'selecting'
  const searchRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
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
    quickFilter, capability, sort,
  }), [choices, query, providerId, favorites, recents, snapshot.current, quickFilter, capability, sort])
  const displayedResults = results.slice(0, Math.max(resultLimit, cursor + 1))

  const favoriteCount = useMemo(() => choices.filter(choice => favorites.includes(choice.key)).length, [choices, favorites])
  const recentCount = useMemo(() => choices.filter(choice => recents.includes(choice.key)).length, [choices, recents])
  const previousChoice = choices.find(choice => choice.provider.id === previousSelection?.provider && choice.model.id === previousSelection?.model)
  const hasFilters = query !== '' || providerId !== null || quickFilter !== 'all' || capability !== 'all' || sort !== 'recommended'

  const show = useCallback((nextView: ModelPaletteView = 'models'): boolean => {
    if (!available || locked) return false
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
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

  const close = useCallback((force = false) => {
    if (!force && leaveGuardRef.current !== null && !leaveGuardRef.current()) return false
    setOpen(false)
    setError(null)
    return true
  }, [])

  const changeView = (next: ModelPaletteView): boolean => {
    if (next === view) return true
    const keepsEditor = (view === 'config' || view === 'catalog') && (next === 'config' || next === 'catalog')
    if (!keepsEditor && leaveGuardRef.current !== null && !leaveGuardRef.current()) return false
    setView(next)
    setError(null)
    return true
  }

  const resetFilters = () => {
    setQuery(''); setProviderId(null); setQuickFilter('all'); setCapability('all'); setSort('recommended')
  }

  useEffect(() => {
    const next = snapshot.current
    if (next === null) return
    const last = lastSelectionRef.current
    if (last !== null && (last.provider !== next.provider || last.model !== next.model)) setPreviousSelection({ ...last })
    lastSelectionRef.current = { ...next }
  }, [snapshot.current])

  useEffect(() => {
    if (!open || view !== 'models') return
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open, view])

  const activate = useCallback(async (selection: Selection, closeAfter = true): Promise<boolean> => {
    if (locked || !available || selectingRef.current || snapshot.status === 'selecting') return false
    if (leaveGuardRef.current !== null && !leaveGuardRef.current()) return false
    const choice = choices.find(item => item.provider.id === selection.provider && item.model.id === selection.model)
    if (choice === undefined) { setError(t('quick.unavailable')); return false }
    selectingRef.current = true
    setSelectionBusy(true)
    setError(null)
    try {
      if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) {
        const repaired = await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)
        if (repaired.length > 0) load()
      }
      if (selection.reasoningEffort !== undefined && !choice.model.reasoning?.efforts.some(effort => effort.id === selection.reasoningEffort)) {
        const changed = await ensureSelectionReasoning(api, selection.provider, selection.model)
        if (changed) load()
      }
      const outcome = await select({ ...selection })
      if (outcome?.ok !== true) {
        const reason = outcome?.error?.message ?? ''
        setError(reason === '' ? t('palette.selectFailed') : t('palette.selectFailedReason', { message: reason }))
        return false
      }
      setRecents(pushRecent(recents, choice.key))
      if (closeAfter) close(true)
      return true
    } catch (cause) {
      setError(t('palette.selectFailedReason', { message: messageOf(cause) }))
      return false
    } finally {
      selectingRef.current = false
      setSelectionBusy(false)
    }
  }, [locked, available, snapshot.status, choices, api, load, select, recents, setRecents, close, t])

  const choose = (choice: ModelChoice) => activate(choice.selection)
  const chooseEffort = (value: string) => snapshot.current === null ? undefined : activate({
    provider: snapshot.current.provider, model: snapshot.current.model,
    ...(value === '' ? {} : { reasoningEffort: value }),
  }, false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return
      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
        if (event.key.toLocaleLowerCase() === 'm') {
          event.preventDefault()
          if (!event.repeat && previousSelection !== null) void activate(previousSelection)
          return
        }
        const slot = /^Digit([1-3])$/u.exec(event.code)
        if (slot !== null && quickProfiles[Number(slot[1]) - 1] !== undefined) {
          event.preventDefault()
          if (!event.repeat) void activate(quickProfiles[Number(slot[1]) - 1]!.selection)
          return
        }
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === 'm') {
        event.preventDefault()
        if (event.repeat) return
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
      if (event.key === 'Tab' && dialogRef.current !== null) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], summary, [tabindex]')]
          .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        return
      }
      if (view !== 'models' || event.target !== searchRef.current) return
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
      if (event.key === 'Enter' && results[cursor] !== undefined) {
        event.preventDefault()
        void choose(results[cursor])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, locked, available, results, cursor, view, activate, previousSelection, quickProfiles, close, show])

  useEffect(() => {
    setCursor(0)
    setResultLimit(RESULT_PAGE_SIZE)
  }, [query, providerId, quickFilter, capability, sort])

  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, results.length - 1)))
  }, [results.length])

  useEffect(() => {
    rowRefs.current[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const currentLabel = current?.model.name ?? snapshot.current?.model ?? t('trigger.fallback')
  const providerLabel = current?.provider.name ?? snapshot.current?.provider
  const currentReasoning = current?.model.reasoning
  const currentEffort = snapshot.current?.reasoningEffort ?? currentReasoning?.defaultEffort ?? ''
  // Stops follow the current model's declared efforts only, in canonical order —
  // a model without xhigh never shows an xhigh stop, and a non-reasoning model
  // shows no effort control at all.
  const reasoningOptions = (currentReasoning?.efforts ?? [])
    .filter(effort => effort.id !== '')
    .slice()
    .sort((left, right) => {
      const leftIndex = REASONING_LEVELS.indexOf(left.id as (typeof REASONING_LEVELS)[number])
      const rightIndex = REASONING_LEVELS.indexOf(right.id as (typeof REASONING_LEVELS)[number])
      return (leftIndex < 0 ? REASONING_LEVELS.length : leftIndex) - (rightIndex < 0 ? REASONING_LEVELS.length : rightIndex)
    })
  const hasEffortControl = snapshot.current !== null && reasoningOptions.length > 0
  const [badges, setBadges] = useState<Map<string, ModelBadges>>(new Map())
  const badgeTargetsKey = JSON.stringify(displayedResults.map(choice => [choice.provider.id, choice.model.id]).sort())
  useEffect(() => {
    if (!open || view !== 'models') return
    const controller = new AbortController()
    const targets = new Map<string, string[]>()
    for (const [provider, model] of JSON.parse(badgeTargetsKey) as Array<[string, string]>) {
      targets.set(provider, [...(targets.get(provider) ?? []), model])
    }
    // Resolve only displayed rows; the native directory contains names and reasoning, not capacities.
    void (async () => {
      const next = new Map<string, ModelBadges>()
      for (const [provider, models] of targets) {
        if (controller.signal.aborted) return
        try {
          for (let offset = 0; offset < models.length; offset += 100) {
            const resolved = await resolveProviderModels({ provider, models: models.slice(offset, offset + 100) }, controller.signal)
            for (const model of resolved) next.set(choiceKey(provider, model.id), {
              context: model.contextWindow, output: model.maxTokens,
              image: model.input?.includes('image') === true, free: model.id.toLocaleLowerCase().endsWith(':free'),
            })
          }
        } catch (cause) {
          if (!controller.signal.aborted) console.warn('[dsh-model-palette] model metadata unavailable', cause)
        }
      }
      if (!controller.signal.aborted) setBadges(next)
    })()
    return () => controller.abort()
  }, [open, view, badgeTargetsKey, snapshot.groups])

  useEffect(() => {
    if (!open) return
    const origin = returnFocusRef.current
    return () => origin?.focus()
  }, [open])

  return (
    <div className="dmp-launcher">
      <button
        type="button"
        className="dmp-trigger"
        disabled={selectionDisabled}
        onClick={() => show()}
        title={`${currentLabel}${providerLabel === undefined ? '' : ` · ${providerLabel}`} · Alt+M`}
        aria-label={t('trigger.aria')}
        aria-keyshortcuts="Alt+M"
      >
        <span className="dmp-trigger-icon" aria-hidden="true">⌘</span>
        <span className="dmp-trigger-model">{currentLabel}</span>
        {providerLabel !== undefined && <span className="dmp-trigger-provider">· {providerLabel}</span>}
        <kbd>Alt M</kbd>
      </button>

      {previousSelection !== null && <button type="button" className="dmp-back-switch"
        disabled={selectionDisabled || previousChoice === undefined}
        title={t('quick.switchBackHint', { model: previousChoice?.model.name ?? previousSelection.model })}
        aria-label={t('quick.switchBack', { model: previousChoice?.model.name ?? previousSelection.model })}
        aria-keyshortcuts="Alt+Shift+M"
        onClick={() => void activate(previousSelection)}>↶</button>}
      {quickProfiles.slice(0, 3).map((profile, index) => <button type="button" className="dmp-quick-chip" key={profile.id}
        aria-keyshortcuts={`Alt+Shift+${index + 1}`}
        disabled={selectionDisabled || !choices.some(choice => choice.provider.id === profile.selection.provider && choice.model.id === profile.selection.model)}
        title={`${profile.selection.provider} / ${profile.selection.model} · ${profile.selection.reasoningEffort ?? t('palette.providerDefault')} · Alt Shift ${index + 1}`}
        onClick={() => void activate(profile.selection)}>{profile.name}</button>)}
      {!open && error !== null && <span className="dmp-launcher-error" role="alert">{error}<button type="button" aria-label={t('quick.dismissError')} onClick={() => setError(null)}>×</button></span>}

      {!locked && available && hasEffortControl && (
        <EffortSlider
          compact
          value={currentEffort}
          options={reasoningOptions}
          defaultLabel={t('palette.providerDefault')}
          label={t('palette.effort')}
          disabled={selectionDisabled}
          onChange={value => void chooseEffort(value)}
        />
      )}

      {open && createPortal(
        <div className="dmp-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close()
        }}>
          <section ref={dialogRef} className="dmp-dialog" role="dialog" aria-modal="true" aria-label={t(view === 'models' ? 'palette.title' : view === 'media' ? 'media.title' : view === 'catalog' ? 'config.templateTitle' : view === 'config' ? 'config.title' : view === 'quick' ? 'quick.title' : 'relay.title')}>
            <header className="dmp-header">
              <div>
                <h2>{t(view === 'models' ? 'palette.title' : view === 'media' ? 'media.title' : view === 'catalog' ? 'config.templateTitle' : view === 'config' ? 'config.title' : view === 'quick' ? 'quick.title' : 'relay.title')}</h2>
                <p>{view === 'models' ? `${choices.length} ${t('palette.models')} · ${t('palette.shortcut')}` : view === 'catalog' ? t('config.templateHint') : t(view === 'media' ? 'media.subtitle' : view === 'config' ? 'config.subtitle' : view === 'quick' ? 'quick.subtitle' : 'relay.subtitle')}</p>
              </div>
              <button type="button" className="dmp-close" onClick={() => close()} aria-label={t('palette.close')}>×</button>
            </header>

            {view === 'models' && <div className="dmp-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={t('palette.search')}
                aria-label={t('palette.search')}
                title={t('palette.searchHint')}
              />
              {query !== '' && <button type="button" onClick={() => setQuery('')} aria-label={t('palette.clear')}>×</button>}
            </div>}

            {view === 'models' && query === '' && <p className="dmp-search-help">{t('palette.searchHint')}</p>}

            {view === 'models' && <div className="dmp-model-filters">
              <label>{t('palette.capability')}
                <select value={capability} onChange={event => setCapability(event.currentTarget.value as typeof capability)}>
                  <option value="all">{t('palette.capabilityAll')}</option>
                  <option value="reasoning">{t('palette.capabilityReasoning')}</option>
                  <option value="free">{t('palette.capabilityFree')}</option>
                </select>
              </label>
              <label>{t('palette.sort')}
                <select value={sort} onChange={event => setSort(event.currentTarget.value as typeof sort)}>
                  <option value="recommended">{t('palette.sortRecommended')}</option>
                  <option value="name">{t('palette.sortName')}</option>
                  <option value="provider">{t('palette.sortProvider')}</option>
                </select>
              </label>
              {hasFilters && <button type="button" className="dmp-reset-filters" onClick={resetFilters}>{t('palette.resetFilters')}</button>}
              <span role="status">{t('palette.resultCount', { count: results.length })}</span>
            </div>}

            {(error !== null || view === 'models' && snapshot.error !== null) && (
              <div className="dmp-error">
                <span>{error ?? snapshot.error}</span>
                <button type="button" onClick={load}>{t('palette.retry')}</button>
              </div>
            )}

            <div className="dmp-body">
              <nav className="dmp-providers" aria-label={t('palette.providers')}>
                <button type="button" className={`dmp-media-nav${view === 'quick' ? ' is-active' : ''}`} onClick={() => changeView('quick')}>
                  <span>{t('quick.nav')}</span><small>{quickProfiles.length || '+'}</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'media' ? ' is-active' : ''}`}
                  onClick={() => changeView('media')}
                >
                  <span>{t('media.nav')}</span><small>5</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'config' ? ' is-active' : ''}`}
                  onClick={() => changeView('config')}
                >
                  <span>{t('config.nav')}</span><small>⚙</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'catalog' ? ' is-active' : ''}`}
                  onClick={() => changeView('catalog')}
                >
                  <span>{t('palette.navCatalog')}</span><small>＋</small>
                </button>
                <button
                  type="button"
                  className={`dmp-media-nav${view === 'relay' ? ' is-active' : ''}`}
                  onClick={() => changeView('relay')}
                >
                  <span>{t('relay.nav')}</span><small>↗</small>
                </button>
                <div className="dmp-provider-divider" />
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'all' ? 'is-active' : ''}
                  onClick={() => { if (changeView('models')) resetFilters() }}
                >
                  <span>{t('palette.allModels')}</span><small>{choices.length}</small>
                </button>
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'favorites' ? 'is-active' : ''}
                  onClick={() => { if (changeView('models')) { setProviderId(null); setQuickFilter('favorites') } }}
                >
                  <span>{t('palette.favorites')}</span><small>{favoriteCount}</small>
                </button>
                <button
                  type="button"
                  className={view === 'models' && providerId === null && quickFilter === 'recents' ? 'is-active' : ''}
                  onClick={() => { if (changeView('models')) { setProviderId(null); setQuickFilter('recents') } }}
                >
                  <span>{t('palette.recents')}</span><small>{recentCount}</small>
                </button>
                <div className="dmp-provider-divider" />
                <div className="dmp-provider-group-label">{t('palette.configuredProviders')}</div>
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={view === 'models' && providerId === provider.id ? 'is-active' : ''}
                    onClick={() => { if (changeView('models')) { setProviderId(provider.id); setQuickFilter('all') } }}
                    title={`${provider.name} · ${provider.id}`}
                  >
                    <span className="dmp-rail-icon"><ProviderIcon id={providerMeta(provider.id).icon} size={14} colored /></span>
                    <span>{provider.name}</span><small>{provider.models.length}</small>
                  </button>
                ))}
              </nav>

              {view === 'quick' ? (
                <QuickProfilesPanel profiles={quickProfiles} current={snapshot.current} choices={choices} busy={selectionDisabled}
                  onChange={setQuickProfiles} onActivate={selection => void activate(selection)} onReload={load} t={t} />
              ) : view === 'media' ? (
                <MediaPanel t={t} />
              ) : view === 'config' || view === 'catalog' ? (
                <ConfigPanel api={api} isLoopback={isLoopback} mode={view} onSwitchMode={next => changeView(next)} onLeaveGuardChange={registerLeaveGuard} t={t} />
              ) : view === 'relay' ? (
                <RelayPanel onOpenConfig={() => changeView('config')} t={t} />
              ) : <main className="dmp-results">
                {snapshot.status === 'loading' && results.length === 0 && <div className="dmp-empty">{t('palette.loading')}</div>}
                {snapshot.status !== 'loading' && results.length === 0 && <div className="dmp-empty"><span>{t('palette.empty')}</span><button type="button" onClick={resetFilters}>{t('palette.resetFilters')}</button></div>}
                {displayedResults.map((choice, index) => {
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
                        disabled={selectionDisabled}
                        onClick={() => void choose(choice)}
                      >
                        <span className="dmp-result-main">
                          <span className="dmp-result-title">
                            {choice.model.name}
                            {(() => {
                              const badge = badges.get(choice.key)
                              if (badge === undefined) return null
                              return (
                                <span className="dmp-result-badges">
                                  {badge.free && <em className="is-free">free</em>}
                                  {badge.image && <em title="vision">👁</em>}
                                  {badge.context !== undefined && <em>{formatTokenCount(badge.context)}</em>}
                                  {badge.output !== undefined && <em>↩{formatTokenCount(badge.output)}</em>}
                                </span>
                              )
                            })()}
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
                {displayedResults.length < results.length && <button type="button" className="dmp-load-more" onClick={() => setResultLimit(Math.max(resultLimit, cursor + 1) + RESULT_PAGE_SIZE)}>
                  {t('palette.showMore', { count: results.length - displayedResults.length })}
                </button>}
              </main>}
            </div>

            <footer className="dmp-footer">
              <div className="dmp-current">
                <span>{t('palette.current')}</span>
                <strong>{currentLabel}</strong>
                {snapshot.current?.provider !== undefined && (
                  <ProviderIcon id={providerMeta(snapshot.current.provider).icon} size={14} colored />
                )}
                {providerLabel !== undefined && <small>{providerLabel}</small>}
              </div>
              {hasEffortControl && (
                <EffortSlider
                  value={currentEffort}
                  options={reasoningOptions}
                  defaultLabel={t('palette.providerDefault')}
                  label={t('palette.effort')}
                  disabled={selectionDisabled}
                  onChange={value => void chooseEffort(value)}
                />
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
