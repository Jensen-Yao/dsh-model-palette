import { describe, expect, it, vi } from 'vitest'
import { Readable } from 'node:stream'
import {
  FREE_MODEL_PROVIDER_ID,
  parseOpenCodeCatalog,
  FreeModelAdapter,
  FreeModelRuntime,
  chatPayloadsToChunks,
  registerFreeModels,
  registerFreeModelsRefreshApi,
  mapChatUsage,
  parseFreeModelCatalog,
  parseModelsDevCatalog,
  sniffBodyShape,
  streamChatPayloads,
} from '../src/free-model.js'
import { registerFreeGateway } from '../src/free-gateway.js'

const catalog = {
  data: [
    { id: 'vendor/available-free', name: 'Vendor: Available (free)', isFree: true, context_length: 131072, supported_parameters: ['reasoning'], architecture: { input_modalities: ['text', 'image'] }, top_provider: { max_completion_tokens: 16384 } },
    { id: 'vendor/paid', name: 'Paid', isFree: false },
    { id: 'vendor/refused-free', name: 'Vendor Refused (free)', isFree: true },
  ],
}

function sseResponse(rows: string[]) {
  return new Response(rows.map(row => `data: ${row}\n\n`).join(''), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('free-model catalog and stream handling', () => {
  it('projects the keyless OpenCode free lane without paid ids', () => {
    const rows = parseOpenCodeCatalog({ data: [
      { id: 'big-pickle', name: 'Big Pickle' },
      { id: 'deepseek-v4.1-flash-free', name: 'DeepSeek Flash' },
      { id: 'paid-model' },
      { id: 'union-alpha' },
    ] })
    expect(rows.map(row => row.id)).toEqual(['big-pickle', 'deepseek-v4.1-flash-free'])
    expect(rows[1]).toMatchObject({ channel: 'opencode', contextWindow: 1048576, efforts: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] })
  })

  it('keeps only gateway-declared free rows', () => {
    expect(parseFreeModelCatalog(catalog).map(row => row.id)).toEqual(['vendor/available-free', 'vendor/refused-free'])
    expect(parseFreeModelCatalog(catalog)[0]).toMatchObject({ name: 'Available', contextWindow: 131072, maxOutput: 16384, input: ['text', 'image'], efforts: ['off', 'low', 'medium', 'high'] })
  })

  it('shapes keyless OpenCode requests and retains quota failures', async () => {
    const requests: Array<{ url: string; init: RequestInit }> = []
    const entry = { id: 'big-pickle', name: 'Big Pickle', contextWindow: 1048576, maxOutput: 32768, input: ['text'] as Array<'text' | 'image'>, efforts: [], canDisableReasoning: false, channel: 'opencode' as const }
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (String(input).endsWith('/models')) return Response.json({ data: [{ id: 'big-pickle', name: 'Big Pickle' }] })
      requests.push({ url: String(input), init: init ?? {} })
      return new Response(JSON.stringify({ type: 'error', error: { type: 'FreeUsageLimitError', message: 'Free usage limit reached' } }), { status: 429, headers: { 'content-type': 'application/json' } })
    }) as unknown as typeof fetch
    await expect(async () => {
      for await (const _payload of streamChatPayloads({ baseURL: 'https://ignored', opencodeBaseURL: 'https://opencode.example', entry, body: { model: entry.id, messages: [], stream: true, max_tokens: 16 }, fetchImpl, timeoutMs: 1000 })) void _payload
    }).rejects.toMatchObject({ status: 429 })
    expect(requests[0]?.url).toBe('https://opencode.example/inference/openai/v1/chat/completions')
    expect(requests[0]?.init.headers).toMatchObject({ authorization: 'Bearer public', 'user-agent': 'opencode/latest/2.2.3/cli', 'x-opencode-client': 'cli' })
    expect(String(requests[0]?.init.body)).toContain('"max_completion_tokens":16')
    expect(String(requests[0]?.init.body)).not.toContain('"max_tokens"')
    const runtime = new FreeModelRuntime('https://ignored', fetchImpl, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    await runtime.refresh()
    expect(runtime.availableEntries()).toHaveLength(1)
  })

  it('sniffs SSE from body bytes even when Content-Type claims JSON', async () => {
    expect(sniffBodyShape('data: {"ok":true}\n\n')).toBe('sse')
    const payloads: string[] = []
    for await (const payload of streamChatPayloads({
      baseURL: 'https://gateway.example/v1',
      entry: { id: 'm', name: 'M', contextWindow: 128000, maxOutput: 32768, input: ['text'], efforts: [], canDisableReasoning: false, channel: 'kilo' },
      body: { model: 'm' },
      fetchImpl: vi.fn(async () => sseResponse(['{"delta":1}', '[DONE]'])) as unknown as typeof fetch,
      timeoutMs: 1000,
    })) payloads.push(payload)
    expect(payloads).toEqual(['{"delta":1}', '[DONE]'])
  })

  it('maps chat stream payloads into DSH blocks and usage', async () => {
    const chunks: Record<string, unknown>[] = []
    for await (const chunk of chatPayloadsToChunks(async function* () {
      yield JSON.stringify({ choices: [{ delta: { reasoning: 'think' } }] })
      yield JSON.stringify({ choices: [{ delta: { content: 'answer', tool_calls: [{ index: 0, id: 'call', function: { name: 'tool', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] })
      yield JSON.stringify({ usage: { prompt_tokens: 3, completion_tokens: 5, prompt_tokens_details: { cached_tokens: 1 } } })
    }())) chunks.push(chunk)
    expect(chunks.filter(chunk => chunk.type === 'text-delta')).toEqual([{ type: 'text-delta', index: 1, text: 'answer' }])
    expect(chunks.at(-2)).toEqual({ type: 'usage', usage: { inputTokens: 2, outputTokens: 5, totalTokens: 8, cacheReadTokens: 1 } })
    expect(mapChatUsage({ prompt_tokens: 2, completion_tokens: 3 })).toEqual({ inputTokens: 2, outputTokens: 3, totalTokens: 5 })
  })
})

describe('free-model runtime', () => {
  it('removes only models whose routing refusal is explicit', async () => {
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (String(input).includes('opencode.ai')) return Response.json({ data: [] })
      if (String(input).endsWith('/models')) return Response.json(catalog)
      const requestBody = String(init?.body ?? '')
      if (requestBody.includes('refused')) return new Response(JSON.stringify({ error: { message: 'Model is unavailable' } }), { status: 404 })
      return sseResponse([JSON.stringify({ choices: [{ delta: { content: 'ok' }, finish_reason: 'stop' }] })])
    }) as unknown as typeof fetch
    const runtime = new FreeModelRuntime('https://gateway.example/v1', fetchImpl)
    const replaced: string[][] = []
    runtime.setHandle({ replace: providers => replaced.push(providers) })
    await runtime.refresh()
    await runtime.probeAll(2)
    expect(runtime.availableEntries().map(entry => entry.id)).toEqual(['vendor/available-free'])
    // an explicit refusal hides the model (unsupported) and waits for the user's delete confirmation
    expect(runtime.snapshot().models.map(entry => entry.id)).toEqual(['vendor/available-free'])
    expect(runtime.snapshot().verdicts['vendor/refused-free']).toMatchObject({ state: 'unsupported' })
    expect(runtime.unsupportedIds()).toEqual(['vendor/refused-free'])
    expect(replaced.at(-1)).toEqual([FREE_MODEL_PROVIDER_ID])
  })
})

describe('loopback OpenAI-compatible gateway', () => {
  it('serves models and streams a chat completion', async () => {
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (String(input).includes('opencode.ai')) return Response.json({ data: [] })
      if (String(input).endsWith('/models')) return Response.json(catalog)
      return sseResponse([JSON.stringify({ choices: [{ delta: { content: 'gateway ok' }, finish_reason: 'stop' }] }), '[DONE]'])
    }) as unknown as typeof fetch
    const runtime = new FreeModelRuntime('https://gateway.example/v1', fetchImpl)
    await runtime.refresh()
    const adapter = new FreeModelAdapter(runtime)
    const handle = registerFreeGateway({ logger: undefined }, adapter, runtime, { port: 0 })
    try {
      await vi.waitFor(() => expect(handle.port()).toBeGreaterThan(0))
      const base = `http://127.0.0.1:${handle.port()}/v1`
      const models = await (await fetch(`${base}/models`)).json()
      expect(models.data.map((row: { id: string }) => row.id)).toContain('vendor/available-free')
      const completion = await fetch(`${base}/chat/completions`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'vendor/available-free', messages: [{ role: 'user', content: 'hi' }] }),
      })
      expect(completion.headers.get('content-type')).toContain('text/event-stream')
      const responseText = await completion.text()
      expect(responseText).toContain('gateway ok')
      expect(responseText).toContain('"finish_reason":"stop"')
    } finally {
      await handle.dispose()
    }
  })
})

describe('free-model registration', () => {
  it('registers the provider, refreshes catalogs, and drains its effect', async () => {
    const effects: Array<() => Promise<void>> = []
    let adapter: FreeModelAdapter | undefined
    const disposeAdapter = vi.fn()
    const ctx = {
      effect(factory: () => () => Promise<void>) { effects.push(factory()) },
      llm: {
        registerAdapter(_providers: string[], next: FreeModelAdapter) {
          expect(next.providerInfo(FREE_MODEL_PROVIDER_ID)).toEqual({ id: FREE_MODEL_PROVIDER_ID, name: 'Free Models' })
          expect(next.providerRetryPolicy(FREE_MODEL_PROVIDER_ID)).toBeUndefined()
          adapter = next
          const dispose = vi.fn(() => { disposeAdapter() }) as unknown as { (): void; replace: () => void }
          dispose.replace = () => {}
          return dispose
        },
      },
      logger: undefined,
    }
    registerFreeModels(ctx, {
      probeOnStartup: false,
      probeIntervalMinutes: 0,
      gateway: { enabled: false },
      fetch: async (input: string | URL) => Response.json(String(input).includes('opencode.ai') ? { data: [] } : catalog),
    })
    await vi.waitFor(async () => expect(adapter === undefined ? 0 : (await adapter.listModels()).length).toBeGreaterThan(0))
    expect((await (adapter as FreeModelAdapter).listModels()).map(row => row.id)).toContain('vendor/available-free')
    for (const dispose of effects.reverse()) await dispose()
    expect(disposeAdapter).toHaveBeenCalledOnce()
  })
})

describe('free-model refresh API', () => {
  it('serves a manual catalog refresh with an added/removed summary', async () => {
    let call = 0
    const fetchImpl = vi.fn(async (input: string | URL) => {
      call += 1
      const opencode = String(input).includes('opencode.example')
      if (opencode) return Response.json({ data: [] })
      return Response.json(call === 1
        ? { data: [{ id: 'vendor/available-free', name: 'Vendor: Available (free)', isFree: true, supported_parameters: ['reasoning'] }] }
        : { data: [{ id: 'vendor/new-free', name: 'Vendor: New (free)', isFree: true }] })
    }) as unknown as typeof fetch
    const runtime = new FreeModelRuntime('https://kilo.example', fetchImpl, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    await runtime.refresh()
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined
    const ctx = {
      webServer: {
        register(registration: { handler: (req: unknown, res: unknown) => Promise<void> }) {
          handler = registration.handler
          return () => {}
        },
      },
    }
    const dispose = registerFreeModelsRefreshApi(ctx, runtime)
    expect(handler).toBeDefined()
    const req = Readable.from(['{}'])
    Object.assign(req, {
      method: 'POST',
      url: '/model-palette/api/free-models/refresh',
      headers: { 'sec-fetch-site': 'same-origin' },
    })
    let status = 0
    let text = ''
    const res = {
      writeHead(nextStatus: number) { status = nextStatus },
      end(chunk = '') { text += String(chunk) },
    }
    await handler?.(req, res)
    expect(status).toBe(200)
    const body = JSON.parse(text) as { ok: boolean; value: { total: number; available: number; added: number; removed: number; missing?: string[] } }
    expect(body.ok).toBe(true)
    // the previously configured id stays listed as missing until the user confirms deletion
    expect(body.value).toMatchObject({ total: 2, available: 2, added: 1, removed: 0 })
    expect(body.value.missing).toEqual(['vendor/available-free'])
    await dispose()
  })
})

describe('models.dev capability enrichment', () => {
  const modelsDev = {
    other: { models: { 'big-pickle': { name: 'Other Big Pickle', limit: { context: 999, output: 999 } } } },
    opencode: { models: {
      'big-pickle': { name: 'Big Pickle', limit: { context: 200000, output: 32000 }, reasoning: true },
      'deepseek-v4.1-flash': { name: 'DeepSeek V4.1 Flash', limit: { context: 1000000, output: 384000 }, reasoning: true },
      'plain-model': { name: 'Plain', limit: { context: 64000, output: 8000 }, reasoning: false },
    } },
    kilo: { models: { 'kilo-auto/free': { name: 'Auto Free', limit: { context: 512000, output: 64000 }, reasoning: true } } },
  }

  it('indexes models.dev with opencode/kilo namespaces winning over other aggregators', () => {
    const facts = parseModelsDevCatalog(modelsDev)
    expect(facts.get('big-pickle')).toMatchObject({ contextWindow: 200000, maxOutput: 32000, reasoning: true, name: 'Big Pickle' })
    expect(facts.get('kilo-auto-free')).toMatchObject({ contextWindow: 512000 })
    expect(facts.get('kilo-auto')).toMatchObject({ contextWindow: 512000 })
    expect(facts.size).toBeGreaterThan(3)
  })

  it('fills context, output, reasoning ladder, and display names for opencode rows', async () => {
    const runtime = new FreeModelRuntime('https://ignored', (async (input: string | URL) => {
      const url = String(input)
      if (url.includes('models.dev')) return Response.json(modelsDev)
      if (url.includes('opencode.example')) {
        return Response.json({ data: [
          { id: 'big-pickle', name: 'big-pickle' },
          { id: 'longcat-2.5-free' },
        ] })
      }
      return Response.json({ data: [] })
    }) as unknown as typeof fetch, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    await runtime.refresh()
    const entries = runtime.availableEntries()
    const pickle = entries.find(entry => entry.id === 'big-pickle')
    expect(pickle).toMatchObject({ contextWindow: 200000, maxOutput: 32000, name: 'Big Pickle', canDisableReasoning: true })
    expect(pickle?.efforts).toEqual(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    // unknown ids keep the heuristic fallbacks
    expect(entries.find(entry => entry.id === 'longcat-2.5-free')).toMatchObject({ contextWindow: 131_072, efforts: [] })
  })

  it('keeps heuristic entries when the capability catalog is unreachable', async () => {
    const runtime = new FreeModelRuntime('https://ignored', (async (input: string | URL) => {
      const url = String(input)
      if (url.includes('models.dev')) return new Response('nope', { status: 503 })
      if (url.includes('opencode.example')) return Response.json({ data: [{ id: 'big-pickle', name: 'Big Pickle' }] })
      return Response.json({ data: [] })
    }) as unknown as typeof fetch, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    await runtime.refresh()
    expect(runtime.availableEntries()[0]).toMatchObject({ contextWindow: 131_072, efforts: [] })
  })
})

describe('free-model snapshot API', () => {
  it('serves the live runtime snapshot for palette-side merging', async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes('models.dev')) return new Response('nope', { status: 503 })
      if (url.includes('opencode.example')) return Response.json({ data: [{ id: 'big-pickle', name: 'Big Pickle' }] })
      return Response.json({ data: [] })
    }) as unknown as typeof fetch
    const runtime = new FreeModelRuntime('https://ignored', fetchImpl, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    await runtime.refresh()
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined
    const ctx = { webServer: { register: (registration: { handler: (req: unknown, res: unknown) => Promise<void> }) => { handler = registration.handler; return () => {} } } }
    registerFreeModelsRefreshApi(ctx, runtime)
    const req = Readable.from([])
    Object.assign(req, { method: 'GET', url: '/model-palette/api/free-models/snapshot', headers: { 'sec-fetch-site': 'same-origin' } })
    let status = 0
    let text = ''
    const res = { writeHead(nextStatus: number) { status = nextStatus }, end(chunk = '') { text += String(chunk) } }
    await handler?.(req, res)
    expect(status).toBe(200)
    const body = JSON.parse(text) as { ok: boolean; value: { provider: string; models: Array<{ id: string }> } }
    expect(body.ok).toBe(true)
    expect(body.value.provider).toBe(FREE_MODEL_PROVIDER_ID)
    expect(body.value.models.map(model => model.id)).toContain('big-pickle')
  })
})

describe('upstream query filters and delete confirmation', () => {
  const dayAgo = (days: number) => Math.floor((Date.now() - days * 86400_000) / 1000)
  const oldFree = { id: 'vendor/old-free', name: 'Old (free)', isFree: true, created: dayAgo(800) }
  const plainFree = { id: 'vendor/plain-free', name: 'Plain (free)', isFree: true, created: dayAgo(10) }
  const thinkerFree = { id: 'vendor/thinker-free', name: 'Thinker (free)', isFree: true, created: dayAgo(5), supported_parameters: ['reasoning'] }

  function laneRuntime(listings: unknown[]) {
    let call = -1
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes('models.dev')) return Response.json({ opencode: { models: {} } })
      if (url.includes('opencode.example')) return Response.json({ data: [] })
      call += 1
      return Response.json(listings[Math.min(call, listings.length - 1)])
    }) as unknown as typeof fetch
    const runtime = new FreeModelRuntime('https://kilo.example', fetchImpl, 'https://opencode.example')
    runtime.setHandle({ replace: () => {} })
    return runtime
  }

  it('retains previously configured ids the fresh listing dropped, and prunes only on confirmation', async () => {
    const runtime = laneRuntime([{ data: [oldFree, plainFree, thinkerFree] }, { data: [plainFree, thinkerFree] }])
    await runtime.refresh()
    expect(runtime.snapshot().models.map(entry => entry.id)).toContain('vendor/old-free')
    const summary = await runtime.refresh(undefined, { force: true })
    expect(summary.missing).toEqual(['vendor/old-free'])
    // retained until the user confirms deletion
    expect(runtime.snapshot().models.map(entry => entry.id)).toContain('vendor/old-free')
    expect(runtime.prune(['vendor/old-free'])).toEqual(['vendor/old-free'])
    expect(runtime.snapshot().models.map(entry => entry.id)).not.toContain('vendor/old-free')
  })

  it('pre-query filters keep stale (>1 year) and no-reasoning models from joining', async () => {
    const runtime = laneRuntime([{ data: [oldFree, plainFree, thinkerFree] }])
    const summary = await runtime.refresh(undefined, { force: true, excludeStale: true, excludeNonReasoning: true })
    expect(summary.filteredStale).toBe(1)
    expect(summary.filteredNonReasoning).toBe(1)
    expect(runtime.snapshot().models.map(entry => entry.id)).toEqual(['vendor/thinker-free'])
  })

  it('serves prune through the refresh API after the user confirms', async () => {
    const runtime = laneRuntime([{ data: [oldFree, plainFree] }])
    await runtime.refresh()
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined
    const ctx = { webServer: { register: (registration: { handler: (req: unknown, res: unknown) => Promise<void> }) => { handler = registration.handler; return () => {} } } }
    registerFreeModelsRefreshApi(ctx, runtime)
    const req = Readable.from([JSON.stringify({ ids: ['vendor/old-free'] })])
    Object.assign(req, { method: 'POST', url: '/model-palette/api/free-models/prune', headers: { 'sec-fetch-site': 'same-origin' } })
    let status = 0
    let textOut = ''
    const res = { writeHead(nextStatus: number) { status = nextStatus }, end(chunk = '') { textOut += String(chunk) } }
    await handler?.(req, res)
    expect(status).toBe(200)
    const body = JSON.parse(textOut) as { ok: boolean; value: { pruned: string[]; total: number } }
    expect(body.value.pruned).toEqual(['vendor/old-free'])
    expect(runtime.snapshot().models.map(entry => entry.id)).toEqual(['vendor/plain-free'])
  })
})
