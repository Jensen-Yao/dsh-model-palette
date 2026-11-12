import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Fragment } from 'react'
import { ConfigPanel } from './ConfigPanel.tsx'
import { QuickProfilesPanel } from './QuickProfilesPanel.tsx'
import { useQuickProfiles } from './quick-profiles-store.ts'
import { MediaPanel } from './MediaPanel.tsx'
import { fetchFreeModelSnapshot, refreshFreeModelCatalog, resolveProviderModels, syncProviderFreeModels } from './config-api.ts'
import type { RankOptions } from './model.ts'
import { RelayPanel } from './RelayPanel.tsx'
import { choiceKey, currentChoice, flattenChoices, FREE_LANE_PROVIDER_ID, groupChoicesByProvider, isFreeChoice, mergeFreeLaneGroup, providerHasFreeModels, pushRecent, rankChoices, toggleFavorite, type FreeLaneSnapshot } from './model.ts'
import { formatTokenCount, REASONING_LEVELS } from './model-config.ts'
import { ProviderIcon } from './ProviderIcon.tsx'
import { providerMeta } from './provider-catalog.ts'
import { ensureSelectionCompatibility, ensureSelectionReasoning, mayNeedReasoningCompatibility } from './selection-compatibility.ts'
import type { CatalogGroup, ModelChoice, PaletteProps, Selection } from './types.ts'

const FAVORITES_KEY = 'dsh-model-palette:favorites:v1'
const RECENTS_KEY = 'dsh-model-palette:recents:v1'
const RAIL_WIDTH_KEY = 'dsh-model-palette:rail-width:v1'
const RAIL_WIDTH_DEFAULT = 236
const RAIL_WIDTH_MIN = 180
const RAIL_WIDTH_MAX = 440
type ModelPaletteView = 'models' | 'media' | 'config' | 'catalog' | 'relay' | 'quick'

function readRailWidth(): number {
  try {
    const parsed = Number(localStorage.getItem(RAIL_WIDTH_KEY))
    if (Number.isFinite(parsed) && parsed >= RAIL_WIDTH_MIN && parsed <= RAIL_WIDTH_MAX) return parsed
  } catch { /* storage unavailable */ }
  return RAIL_WIDTH_DEFAULT
}

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

interface EffortControlProps {
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
 * Codex-style ascending-bar glyph: every stop renders the full ladder of bars
 * (signal-strength metaphor) with bars below its level filled. The provider
 * default shows a hollow circle; "off" shows an empty ladder.
 */
function EffortGlyph({ id, ladder }: { id: string; ladder: number }): JSX.Element {
  if (id === '') {
    return (
      <svg className="dmp-effort-glyph" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
        <circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  const rank = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].indexOf(id)
  const filled = rank <= 0 ? 0 : rank
  const bars = Math.max(ladder, 3)
  const unit = 3.4
  const gap = 2
  const height = 14
  const width = bars * unit + (bars - 1) * gap
  return (
    <svg className="dmp-effort-glyph" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" focusable="false">
      {Array.from({ length: bars }, (_, bar) => {
        const barHeight = Math.max(unit, ((bar + 1) / bars) * height)
        return (
          <rect
            key={bar}
            x={bar * (unit + gap)}
            y={height - barHeight}
            width={unit}
            height={barHeight}
            rx={1}
            fill="currentColor"
            opacity={bar < filled ? 1 : 0.22}
          />
        )
      })}
    </svg>
  )
}

/**
 * Diagram-style discrete reasoning-effort control. Stops come from the current
 * model's declared efforts only, prefixed by the provider default; a sliding
 * thumb animates between stops instead of a raw range slider.
 */
function EffortControl({ value, options, defaultLabel, label, disabled, compact = false, onChange }: EffortControlProps): JSX.Element {
  const stops = [{ id: '', name: defaultLabel }, ...options.map(option => ({ id: option.id, name: option.name }))]
  const index = value === '' ? 0 : Math.max(0, stops.findIndex(stop => stop.id === value))
  const activeName = value === '' ? defaultLabel : options.find(option => option.id === value)?.name ?? value
  const select = (next: number) => {
    if (!disabled && stops[next] !== undefined && stops[next]!.id !== value) onChange(stops[next]!.id)
  }
  return (
    <div className={`dmp-effort-seg${compact ? ' is-compact' : ''}${disabled ? ' is-busy' : ''}`} title={`${label}: ${activeName}`}>
      {compact
        ? <span className="dmp-effort-seg-value">{activeName}</span>
        : (
          <div className="dmp-effort-seg-head">
            <span>{label}</span>
            <strong>{activeName}</strong>
          </div>
        )}
      <div
        className="dmp-effort-seg-track"
        role="radiogroup"
        aria-label={label}
        onKeyDown={event => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
          event.preventDefault()
          const next = Math.min(stops.length - 1, Math.max(0, index + (event.key === 'ArrowRight' ? 1 : -1)))
          select(next)
          ;(event.currentTarget.querySelectorAll('button')[next] as HTMLElement | undefined)?.focus()
        }}
      >
        <span className="dmp-effort-seg-thumb" style={{ width: `${100 / stops.length}%`, transform: `translateX(${index * 100}%)` }} />
        {stops.map((stop, stopIndex) => (
          <button
            key={stop.id === '' ? 'default' : stop.id}
            type="button"
            aria-label={stop.name}
            role="radio"
            aria-checked={stopIndex === index}
            className={stopIndex === index ? 'is-active' : ''}
            disabled={disabled}
            title={`${label}: ${stop.name}`}
            onClick={() => select(stopIndex)}
          >
            <EffortGlyph id={stop.id} ladder={stops.length - 1} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }: PaletteProps) {
  const rawSnapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot, directory.getSnapshot)
  const [freeLane, setFreeLane] = useState<FreeLaneSnapshot | null>(null)
  // Fetch the keyless lane once the palette can talk to the plugin host, then
  // merge it into the directory groups whenever the catalog lacks it.
  useEffect(() => {
    if (locked || !available) return
    const controller = new AbortController()
    void fetchFreeModelSnapshot(controller.signal).then(setFreeLane, () => {})
    return () => controller.abort()
  }, [locked, available])
  const snapshot = useMemo(() => (
    rawSnapshot.groups.some(group => group.id === FREE_LANE_PROVIDER_ID)
      ? rawSnapshot
      : { ...rawSnapshot, groups: mergeFreeLaneGroup(rawSnapshot.groups, freeLane) }
  ), [rawSnapshot, freeLane])
  const choices = useMemo(() => flattenChoices(snapshot.groups), [snapshot.groups])
  const current = currentChoice(choices, snapshot.current)
  const freeLaneGroup = snapshot.groups.find(group => group.id === FREE_LANE_PROVIDER_ID)
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

  const [railWidth, setRailWidth] = useState(readRailWidth)
  const railDragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  useEffect(() => {
    try { localStorage.setItem(RAIL_WIDTH_KEY, String(railWidth)) } catch { /* storage unavailable */ }
  }, [railWidth])
  const onRailResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    railDragRef.current = { startX: event.clientX, startWidth: railWidth }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onRailResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = railDragRef.current
    if (drag === null) return
    const next = Math.round(Math.min(RAIL_WIDTH_MAX, Math.max(RAIL_WIDTH_MIN, drag.startWidth + event.clientX - drag.startX)))
    setRailWidth(current => current === next ? current : next)
  }
  const onRailResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (railDragRef.current === null) return
    railDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const [providerRefresh, setProviderRefresh] = useState<{ id: string; phase: 'busy' | 'ok'; note?: string } | null>(null)
  useEffect(() => {
    if (providerRefresh === null || providerRefresh.phase !== 'ok') return
    const timer = setTimeout(() => setProviderRefresh(null), 6000)
    return () => clearTimeout(timer)
  }, [providerRefresh])
  const refreshProviderFreeModels = async (provider: CatalogGroup) => {
    if (locked || !available || providerRefresh?.phase === 'busy') return
    setProviderRefresh({ id: provider.id, phase: 'busy' })
    try {
      let total = 0
      let added = 0
      let removed = 0
      if (provider.id === 'dsh-free-models') {
        const summary = await refreshFreeModelCatalog({ force: true })
        total = summary.available
        added = summary.added
        removed = summary.removed
        setFreeLane(await fetchFreeModelSnapshot().catch(() => freeLane))
      } else {
        const summary = await syncProviderFreeModels(provider.id, { manual: true })
        total = summary.total
        added = summary.added
        removed = summary.removed
      }
      setProviderRefresh({
        id: provider.id,
        phase: 'ok',
        note: t('palette.freeRefreshed', { provider: provider.name, total, added, removed }),
      })
      load()
    } catch (cause) {
      setProviderRefresh(null)
      setError(t('palette.freeRefreshFailed', { provider: provider.name, message: messageOf(cause) }))
    }
  }

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const toggleGroupCollapsed = (providerId: string) => {
    setCollapsedGroups(current => {
      const next = new Set(current)
      if (next.has(providerId)) next.delete(providerId)
      else next.add(providerId)
      return next
    })
  }

  const providers = useMemo(() => {
    const currentProvider = snapshot.current?.provider
    return [...snapshot.groups].sort((left, right) => {
      // The keyless free lane is pinned right after the current provider so it
      // stays discoverable instead of sinking into the alphabetical pile.
      const rank = (id: string | null | undefined) => id === currentProvider ? 0 : id === FREE_LANE_PROVIDER_ID ? 1 : 2
      const leftRank = rank(left.id)
      const rightRank = rank(right.id)
      if (leftRank !== rightRank) return leftRank - rightRank
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
  // Unfiltered browsing of a large catalog groups rows by provider so the list
  // stays scannable; searching, filtering, or name sorting falls back to a flat list.
  const grouped = useMemo(() => (
    query === '' && providerId === null && quickFilter === 'all' && sort !== 'name' && results.length > 1
      ? groupChoicesByProvider(results, snapshot.current?.provider)
      : null
  ), [query, providerId, quickFilter, sort, results, snapshot.current?.provider])
  const rows = useMemo(() => grouped === null
    ? results
    : grouped.filter(group => !collapsedGroups.has(group.provider.id)).flatMap(group => group.choices),
  [grouped, results, collapsedGroups])
  // Group headers stay rendered even when collapsed (they carry the expand
  // control), so a collapsed group can always be found and reopened.
  type ResultItem = { kind: 'header'; group: NonNullable<typeof grouped>[number] } | { kind: 'choice'; choice: ModelChoice }
  const renderItems = useMemo<Array<ResultItem>>(() => {
    if (grouped === null) return results.map(choice => ({ kind: 'choice', choice }) as ResultItem)
    const items: Array<ResultItem> = []
    for (const group of grouped) {
      items.push({ kind: 'header', group })
      if (!collapsedGroups.has(group.provider.id)) {
        for (const choice of group.choices) items.push({ kind: 'choice', choice })
      }
    }
    return items
  }, [grouped, results, collapsedGroups])
  const choiceBudget = Math.max(resultLimit, cursor + 1)
  const displayedItems = useMemo(() => {
    const items: Array<ResultItem> = []
    let shown = 0
    for (const item of renderItems) {
      if (item.kind === 'choice') {
        if (shown >= choiceBudget) break
        shown += 1
      }
      items.push(item)
    }
    return items
  }, [renderItems, choiceBudget])
  const displayedChoiceCount = displayedItems.reduce((count, item) => count + (item.kind === 'choice' ? 1 : 0), 0)

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
    setCollapsedGroups(new Set())
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
        setCursor((value) => Math.min(value + 1, Math.max(0, rows.length - 1)))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursor((value) => Math.max(0, value - 1))
        return
      }
      if (event.key === 'Enter' && rows[cursor] !== undefined) {
        event.preventDefault()
        void choose(rows[cursor])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, locked, available, rows, cursor, view, activate, previousSelection, quickProfiles, close, show])

  useEffect(() => {
    setCursor(0)
    setResultLimit(RESULT_PAGE_SIZE)
  }, [query, providerId, quickFilter, capability, sort])

  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, rows.length - 1)))
  }, [rows.length])

  useEffect(() => {
    rowRefs.current[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const currentLabel = current?.model.name ?? snapshot.current?.model ?? t('trigger.fallback')
  const providerLabel = current === undefined
    ? snapshot.current?.provider
    : current.provider.id === FREE_LANE_PROVIDER_ID ? t('palette.freeLaneName') : current.provider.name
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
  const badgeTargetsKey = JSON.stringify(
    displayedItems.reduce<Array<[string, string]>>((targets, item) => {
      if (item.kind === 'choice') targets.push([item.choice.provider.id, item.choice.model.id])
      return targets
    }, []).sort(),
  )
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
        <EffortControl
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
              <span role="status">{t('palette.resultCount', { count: rows.length })}</span>
            </div>}

            {(error !== null || view === 'models' && snapshot.error !== null) && (
              <div className="dmp-error">
                <span>{error ?? snapshot.error}</span>
                <button type="button" onClick={load}>{t('palette.retry')}</button>
              </div>
            )}

            {providerRefresh?.phase === 'ok' && providerRefresh.note !== undefined && (
              <div className="dmp-status" role="status">{providerRefresh.note}</div>
            )}

            <div className="dmp-body" style={{ gridTemplateColumns: `${railWidth}px 5px minmax(0, 1fr)` }}>
              <nav className="dmp-providers" aria-label={t('palette.providers')}>
                <div className="dmp-rail-scroll">
                  <div className="dmp-provider-group-label">{t('palette.sectionModels')}</div>
                  <button
                    type="button"
                    className={view === 'models' && providerId === null && quickFilter === 'all' ? 'is-active' : ''}
                    onClick={() => { if (changeView('models')) resetFilters() }}
                  >
                    <span className="dmp-rail-icon" aria-hidden="true">☰</span>
                    <span>{t('palette.allModels')}</span><small>{choices.length}</small>
                  </button>
                  <div className={`dmp-provider-item is-free-lane${view === 'models' && providerId === FREE_LANE_PROVIDER_ID ? ' is-selected' : ''}`}>
                    <button
                      type="button"
                      className={`dmp-rail-free-lane${view === 'models' && providerId === FREE_LANE_PROVIDER_ID ? ' is-active' : ''}`}
                      onClick={() => { if (changeView('models')) { setProviderId(FREE_LANE_PROVIDER_ID); setQuickFilter('all') } }}
                      title={t('palette.freeLaneHint')}
                    >
                      <span className="dmp-rail-icon"><ProviderIcon id="free" size={14} colored /></span>
                      <span>{t('palette.freeLaneName')}</span>
                      <small>{freeLaneGroup?.models.length ?? 0}</small>
                      <em className="dmp-rail-free">FREE</em>
                    </button>
                    <button
                      type="button"
                      className={`dmp-provider-refresh${providerRefresh?.id === FREE_LANE_PROVIDER_ID && providerRefresh.phase === 'busy' ? ' is-busy' : providerRefresh?.id === FREE_LANE_PROVIDER_ID && providerRefresh.phase === 'ok' ? ' is-done' : ''}`}
                      disabled={selectionDisabled || providerRefresh?.id === FREE_LANE_PROVIDER_ID && providerRefresh.phase === 'busy'}
                      title={t('palette.freeRefresh', { provider: t('palette.freeLaneName') })}
                      aria-label={t('palette.freeRefresh', { provider: t('palette.freeLaneName') })}
                      onClick={() => { if (freeLaneGroup !== undefined) void refreshProviderFreeModels(freeLaneGroup) }}
                    >⟳</button>
                  </div>
                  <button
                    type="button"
                    className={view === 'models' && providerId === null && quickFilter === 'favorites' ? 'is-active' : ''}
                    onClick={() => { if (changeView('models')) { setProviderId(null); setQuickFilter('favorites') } }}
                  >
                    <span className="dmp-rail-icon" aria-hidden="true">★</span>
                    <span>{t('palette.favorites')}</span><small>{favoriteCount}</small>
                  </button>
                  <button
                    type="button"
                    className={view === 'models' && providerId === null && quickFilter === 'recents' ? 'is-active' : ''}
                    onClick={() => { if (changeView('models')) { setProviderId(null); setQuickFilter('recents') } }}
                  >
                    <span className="dmp-rail-icon" aria-hidden="true">
                      <svg viewBox="0 0 12 12" width="12" height="12" focusable="false"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M6 3.6V6l1.8 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </span>
                    <span>{t('palette.recents')}</span><small>{recentCount}</small>
                  </button>
                  <div className="dmp-provider-divider" />
                  <div className="dmp-provider-group-label">{t('palette.configuredProviders')}</div>
                  {providers.filter(provider => provider.id !== FREE_LANE_PROVIDER_ID).map((provider) => {
                    const refreshable = providerHasFreeModels(provider.id, provider.models.map(model => model.id))
                    const refreshState = providerRefresh?.id === provider.id ? providerRefresh : null
                    return (
                      <div key={provider.id} className="dmp-provider-item">
                        <button
                          type="button"
                          className={view === 'models' && providerId === provider.id ? 'is-active' : ''}
                          onClick={() => { if (changeView('models')) { setProviderId(provider.id); setQuickFilter('all') } }}
                          title={`${provider.name} · ${provider.id}`}
                        >
                          <span className="dmp-rail-icon"><ProviderIcon id={providerMeta(provider.id).icon} size={14} colored /></span>
                          <span>{provider.name}</span><small>{provider.models.length}</small>
                        </button>
                        {refreshable && (
                          <button
                            type="button"
                            className={`dmp-provider-refresh${refreshState?.phase === 'busy' ? ' is-busy' : refreshState?.phase === 'ok' ? ' is-done' : ''}`}
                            disabled={selectionDisabled || refreshState?.phase === 'busy'}
                            title={t('palette.freeRefresh', { provider: provider.name })}
                            aria-label={t('palette.freeRefresh', { provider: provider.name })}
                            onClick={() => void refreshProviderFreeModels(provider)}
                          >⟳</button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="dmp-rail-tools" role="group" aria-label={t('palette.sectionTools')}>
                  <button type="button" className={view === 'config' || view === 'catalog' ? ' is-active' : ''} onClick={() => changeView('config')} title={t('config.nav')}>
                    <span aria-hidden="true">⚙</span><small>{t('config.navShort')}</small>
                  </button>
                  <button type="button" className={view === 'catalog' ? ' is-active' : ''} onClick={() => changeView('catalog')} title={t('palette.navCatalog')}>
                    <span aria-hidden="true">＋</span><small>{t('palette.navCatalogShort')}</small>
                  </button>
                  <button type="button" className={view === 'relay' ? ' is-active' : ''} onClick={() => changeView('relay')} title={t('relay.nav')}>
                    <span aria-hidden="true">↗</span><small>{t('relay.navShort')}</small>
                  </button>
                  <button type="button" className={view === 'media' ? ' is-active' : ''} onClick={() => changeView('media')} title={t('media.nav')}>
                    <span aria-hidden="true"><svg viewBox="0 0 12 12" width="13" height="13" focusable="false"><path d="M2 2h3.4v3.4H2V2Zm4.6 0H10v3.4H6.6V2ZM2 6.6h3.4V10H2V6.6Zm4.6 0H10V10H6.6V6.6Z" fill="currentColor" /></svg></span><small>{t('media.navShort')}</small>
                  </button>
                  <button type="button" className={view === 'quick' ? ' is-active' : ''} onClick={() => changeView('quick')} title={t('quick.nav')}>
                    <span aria-hidden="true"><svg viewBox="0 0 12 12" width="13" height="13" focusable="false"><path d="M7 1.5 2.8 6.8h2.6L4.9 10.5l4.3-5.3H6.6L7 1.5Z" fill="currentColor" /></svg></span><small>{t('quick.navShort')}</small>
                  </button>
                </div>
              </nav>

              <div
                className="dmp-rail-resizer"
                role="separator"
                aria-orientation="vertical"
                aria-label={t('palette.railResize')}
                title={t('palette.railResizeHint')}
                onPointerDown={onRailResizeStart}
                onPointerMove={onRailResizeMove}
                onPointerUp={onRailResizeEnd}
                onPointerCancel={onRailResizeEnd}
                onDoubleClick={() => setRailWidth(RAIL_WIDTH_DEFAULT)}
              />

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
                {(() => {
                  let choiceIndex = 0
                  return displayedItems.map(item => {
                    if (item.kind === 'header') {
                      const collapsed = collapsedGroups.has(item.group.provider.id)
                      const isFreeLane = item.group.provider.id === FREE_LANE_PROVIDER_ID
                      return (
                        <div key={`header:${item.group.provider.id}`} className={`dmp-group-header${collapsed ? ' is-collapsed' : ''}`}>
                          <button type="button" onClick={() => toggleGroupCollapsed(item.group.provider.id)} aria-expanded={!collapsed}>
                            <span className="dmp-rail-icon"><ProviderIcon id={providerMeta(item.group.provider.id).icon} size={13} colored /></span>
                            <strong>{isFreeLane ? t('palette.freeLaneName') : item.group.provider.name}</strong>
                            <small>{item.group.choices.length}</small>
                            {isFreeLane && <em className="dmp-rail-free">FREE</em>}
                            <svg className="dmp-group-chevron" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true" focusable="false">
                              <path d="M1 1.2 5 5.2 9 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      )
                    }
                    const choice = item.choice
                    const index = choiceIndex++
                    const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id
                    const isFavorite = favorites.includes(choice.key)
                    const isRecent = recents.includes(choice.key)
                    const isFree = isFreeChoice(choice.provider.id, choice.model.id)
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
                                return (
                                  <span className="dmp-result-badges">
                                    {isFree && <em className="is-free">free</em>}
                                    {badge?.image && <em title="vision">👁</em>}
                                    {badge?.context !== undefined && <em>{formatTokenCount(badge.context)}</em>}
                                    {badge?.output !== undefined && <em>↩{formatTokenCount(badge.output)}</em>}
                                  </span>
                                )
                              })()}
                              {isCurrent && <em>{t('palette.current')}</em>}
                              {isRecent && !isCurrent && <em>{t('palette.recent')}</em>}
                            </span>
                            <span className="dmp-result-meta">
                              <strong>{choice.provider.id === FREE_LANE_PROVIDER_ID ? t('palette.freeLaneName') : choice.provider.name}</strong>
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
                  })
                })()}
                {displayedChoiceCount < rows.length && <button type="button" className="dmp-load-more" onClick={() => setResultLimit(Math.max(resultLimit, cursor + 1) + RESULT_PAGE_SIZE)}>
                  {t('palette.showMore', { count: rows.length - displayedChoiceCount })}
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
                <EffortControl
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
