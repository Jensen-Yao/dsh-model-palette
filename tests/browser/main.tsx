/** Keyless browser fixture for the assembled palette, provider editor and backup controls. */
import { createRoot } from 'react-dom/client'
import z from '@deepseek-ai/schemastery'
import { ModelPalette } from '../../src/client/ModelPalette.tsx'
import { zh } from '../../src/client/locales.ts'
import type { PaletteApi } from '../../src/client/remote-compat.ts'
import type { DirectorySnapshot, Selection } from '../../src/client/types.ts'
import type { SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import '../../src/client/style.css'

const providers = {
  custom: { displayName: '自定义供应商', api: 'openai-responses', baseURL: 'https://example.invalid/v1', apiKeyEnv: 'FIXTURE_API_KEY', models: [{ id: 'custom-model', contextWindow: 131072, maxTokens: 8192 }] },
  'openrouter-free': { api: 'openai-completions', baseURL: 'https://openrouter.ai/api/v1', models: [{ id: 'vendor/reasoner:free' }] },
  'custom-chat': { displayName: 'Custom Chat', api: 'openai-completions', baseURL: 'https://example.invalid/v1', apiKeyEnv: 'FIXTURE_API_KEY', models: [{ id: 'legacy-model' }] },
}
const descriptors: SettingsNamespaceView[] = [
  { ns: 'fixture-models', schema: z.object({ providers: z.dict(z.any()) }).toJSON(), revision: 1, value: { providers }, user: { providers }, applies: 'live', secrets: [] },
  { ns: 'fixture-palette', schema: z.object({ requestRetries: z.any(), freeSync: z.any() }).toJSON(), revision: 1,
    value: { requestRetries: { providers: { custom: { enabled: true, maxRetries: 2, models: {} } } }, freeSync: { providers: {}, state: {} } }, applies: 'live', secrets: [] },
]
let snapshot: DirectorySnapshot = {
  current: { provider: 'custom', model: 'custom-model', reasoningEffort: 'high' }, status: 'ready', failures: [], error: null,
  groups: [
    { id: 'custom', name: '自定义供应商', models: [{ id: 'custom-model', name: 'Custom Model', reasoning: { defaultEffort: 'high', efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }] } }, ...Array.from({ length: 180 }, (_, i) => ({ id: `model-${i}`, name: `Model ${String(i).padStart(3, '0')}` }))] },
    { id: 'dsh-free-models', name: 'Free Models', models: [
      { id: 'deepseek-v4.1-flash-free', name: 'DeepSeek V4.1 Flash', reasoning: { defaultEffort: 'high', efforts: [{ id: 'off', name: 'Off' }, { id: 'low', name: 'Low' }, { id: 'medium', name: 'Medium' }, { id: 'high', name: 'High' }] } },
      { id: 'big-pickle', name: 'Big Pickle' },
      { id: 'kilo-auto/free', name: 'Auto Free' },
    ] },
    { id: 'openrouter-free', name: 'OpenRouter 免费', models: [{ id: 'vendor/reasoner:free', name: 'Free Reasoner', reasoning: { efforts: [{ id: 'high', name: 'High' }] } }] },
    { id: 'custom-chat', name: 'Custom Chat', models: [{ id: 'legacy-model', name: 'Legacy Model' }] },
  ],
}
const listeners = new Set<() => void>()
const writes: unknown[] = []
const api: PaletteApi = {
  settings: {
    describe: async () => ({ result: { ok: true, value: { namespaces: structuredClone(descriptors) } } }),
    mutate: async request => {
      const entry = descriptors.find(row => row.ns === request.ns)
      if (entry === undefined || entry.revision !== request.expectedRevision) return { result: { ok: false, error: { code: 'CONFLICT', message: 'Fixture revision conflict' } } }
      const value = structuredClone(entry.user ?? entry.value) as Record<string, unknown>
      for (const op of request.ops) {
        let node = value
        for (const part of op.path.slice(0, -1)) {
          if (node[part] === undefined) node[part] = {}
          node = node[part] as Record<string, unknown>
        }
        const key = op.path.at(-1)!
        if (op.op === 'set') node[key] = structuredClone(op.value)
        else delete node[key]
      }
      entry.value = value
      entry.user = value
      entry.revision += 1
      writes.push(structuredClone(request))
      return { result: { ok: true, value: structuredClone(entry) } }
    },
  },
  credentials: {
    describe: async ({ refs }) => ({ result: { ok: true, value: { credentials: Object.fromEntries(refs.map(ref => [ref, { configured: false, writable: true }])) } } }),
    set: async () => ({ result: { ok: true, value: undefined } }),
  },
  llm: {
    models: async () => ({ result: { ok: true, value: { groups: snapshot.groups } } }),
    discoverModels: async () => ({ result: { ok: true, value: { models: [] } } }),
  },
}
window.fetch = async (input, init) => {
  if (String(input).endsWith('/models/resolve')) {
    const body = JSON.parse(String(init?.body)) as { models: string[] }
    return Response.json({ ok: true, value: { models: body.models.map(id => ({ id, contextWindow: 131072, maxTokens: 8192, input: ['text', 'image'] })) } })
  }
  return Response.json({ ok: false, error: { message: 'External requests disabled in the fixture' } }, { status: 404 })
}
const root = document.getElementById('root')!
const reactRoot = createRoot(root)
let fixtureLocked = false
let resumeSelection: (() => void) | null = null
const controls = {
  selectCalls: [] as Selection[],
  failNext: false,
  holdNext: false,
  setLocked(value: boolean) { fixtureLocked = value; render() },
  finishSelection() { resumeSelection?.(); resumeSelection = null },
}
Object.assign(window, { __paletteFixture: { writes, descriptors, controls } })
function render(): void {
  reactRoot.render(<ModelPalette
  locked={fixtureLocked} available isLoopback api={api}
  directory={{ getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) } }}
  load={() => {}}
  select={async selection => {
    controls.selectCalls.push({ ...selection })
    if (controls.failNext) { controls.failNext = false; return { ok: false, error: { message: 'Fixture selection failed' } } }
    if (controls.holdNext) {
      controls.holdNext = false
      await new Promise<void>(resolve => { resumeSelection = resolve })
    }
    snapshot = { ...snapshot, current: selection }
    listeners.forEach(listener => listener())
    return { ok: true }
  }}
  t={(key, params) => Object.entries(params ?? {}).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), zh[key as keyof typeof zh] ?? key)}
/>)
}
render()
