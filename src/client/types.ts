export interface ReasoningLevel {
  id: string
  name: string
  description?: string
}

export interface CatalogModel {
  id: string
  name: string
  description?: string
  reasoning?: {
    defaultEffort?: string
    efforts: ReasoningLevel[]
  }
}

export interface CatalogGroup {
  id: string
  name: string
  models: CatalogModel[]
}

export interface CatalogFailure {
  id: string
  name: string
  message: string
}

export interface CurrentSelection {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface DirectorySnapshot {
  current: CurrentSelection | null
  groups: CatalogGroup[]
  failures: CatalogFailure[]
  status: 'idle' | 'loading' | 'selecting' | 'ready' | 'error'
  error: string | null
}

export interface DirectoryStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): DirectorySnapshot
}

export interface Selection {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface ModelChoice {
  key: string
  provider: CatalogGroup
  model: CatalogModel
  selection: Selection
  catalogIndex: number
}

export interface PaletteProps {
  locked: boolean
  available: boolean
  directory: DirectoryStore
  load: () => void
  select: (selection: Selection) => Promise<boolean>
  api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>
  isLoopback: boolean
  t: (key: string, params?: Record<string, unknown>) => string
}
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
