import type { ClientRemote, ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import { ModelPalette } from './ModelPalette.tsx'
import { en, NS, zh } from './locales.ts'
import { paletteApi } from './remote-compat.ts'
import type { DirectoryStore, PaletteProps, Selection } from './types.ts'
import './style.css'

interface LocaleService {
  register(namespace: string, dictionaries: { zh: Record<string, string>; en: Record<string, string> }): () => void
}

interface DirectoryHandle {
  store: DirectoryStore
  load(): Promise<void>
  select(selection: Selection): Promise<void>
}

interface ModelDirectoryService {
  directoryFor(sessionId: string): DirectoryHandle
}

interface SessionService {
  subagentAddress(sessionId: string): unknown
}

interface SlotRegistrationScope {
  slots: {
    inject(name: string, factory: () => () => void, label: string): void
    register(
      definition: {
        name: string
        locale: string
        priority: number
        registrant: string
        inject(sessionId: string): Omit<PaletteProps, 'locked' | 't'>
      },
      component: typeof ModelPalette,
    ): () => void
  }
  modelDirectories: ModelDirectoryService
  sessions: SessionService
}

interface ClientContext {
  locale: LocaleService
  remote: ClientRemote
  effect(factory: () => () => void, label: string): void
  get(name: 'connection'): ConnectionHandle
  inject(services: string[], callback: (scope: SlotRegistrationScope) => void): void
  slots: {
    inject(name: string, factory: () => () => void, label: string): void
  }
}

export const inject = [
  'locale', 'sessions', 'slots', 'modelDirectories', 'connection',
  'remote', 'remote.settings', 'remote.credentials', 'remote.llm', 'remote.session',
]

export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-model-palette: dictionaries')
  ctx.inject(['slots', 'modelDirectories', 'sessions'], (scope) => {
    scope.slots.inject(
      'conversation.input.model',
      () => scope.slots.register({
        name: 'conversation.input.model',
        locale: NS,
        priority: -2,
        registrant: 'dsh-model-palette',
        inject: (sessionId) => {
          const directory = scope.modelDirectories.directoryFor(sessionId)
          const available = scope.sessions.subagentAddress(sessionId) === undefined
          return {
            available,
            directory: directory.store,
            load: () => {
              if (available) directory.load().catch((error) => {
                console.error('[dsh-model-palette] model directory load failed', error)
              })
            },
            select: async (selection) => {
              if (!available) return false
              try {
                await directory.select(selection)
                return true
              } catch (error) {
                console.error('[dsh-model-palette] model selection failed', error)
                return false
              }
            },
            api: paletteApi(ctx.remote),
            isLoopback: connection.isLoopback,
          }
        },
      }, ModelPalette),
      'dsh-model-palette: composer model seat',
    )
  })
}
