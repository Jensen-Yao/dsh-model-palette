/**
 * Keyless free-model lanes and the DSH LLM adapter.
 *
 * Kilo contributes rows its catalog marks `isFree`; OpenCode contributes its
 * explicit public-pool ids. Catalog refresh never mutates user provider settings;
 * availability is runtime-local so an egress-specific refusal cannot delete a route.
 */
import { registerFreeGateway } from './free-gateway.ts'
import crypto from 'node:crypto'
import z from '@deepseek-ai/schemastery'

export const FREE_MODEL_PROVIDER_ID = 'dsh-free-models'
export const DEFAULT_FREE_MODEL_BASE = 'https://ai-gateway.kilo.ai/api/v1'
export const DEFAULT_OPENCODE_BASE = 'https://opencode.ai'
export const FREE_MODELS_API_PATH = '/model-palette/api/free-models'
/** Host-config surface for the keyless lane and loopback OpenAI gateway. */
export const FreeModelsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  baseURL: z.string().default(DEFAULT_FREE_MODEL_BASE),
  opencodeBaseURL: z.string().default(DEFAULT_OPENCODE_BASE),
  probeOnStartup: z.boolean().default(true),
  probeIntervalMinutes: z.number().step(1).min(0).max(1440).default(60),
  probeConcurrency: z.number().step(1).min(1).max(8).default(2),
  gateway: z.object({
    enabled: z.boolean().default(true),
    port: z.number().step(1).min(0).max(65535).default(4180),
    credentialRef: z.string().default(''),
  }).default({}),
})
const CATALOG_TIMEOUT_MS = 20_000
const TURN_TIMEOUT_MS = 300_000
const PROBE_TIMEOUT_MS = 45_000
/** Public capability catalog (same source the opencode ecosystem uses) backing context/reasoning enrichment. */
const MODELS_DEV_URL = 'https://models.dev/api.json'
const MODELS_DEV_TIMEOUT_MS = 20_000
const MODELS_DEV_TTL_MS = 12 * 60 * 60_000
const OPENCODE_EFFORT_LADDER = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
const USER_AGENT = 'dsh-model-palette/0.20'
const ATTRIBUTION_HEADERS = Object.freeze({ 'http-referer': 'https://kilo.ai/', 'x-title': 'DSH Model Palette' })
const OPENCODE_ALWAYS_FREE = new Set(['big-pickle', 'space-bunny-free'])
const OPENCODE_NON_CHAT = new Set(['union-alpha', 'muse-spark-1.2-contributor-free', 'muse-spark-1.3-contributor-free'])
const BOOT_NONCE = crypto.randomUUID()

function opencodeSession(seed: string): string {
  const digest = crypto.createHash('sha256').update(`ses\0${BOOT_NONCE}\0${seed}`).digest()
  const midnight = Math.floor(Date.now() / 86400000) * 86400000
  const offset = digest.readUInt32BE(0) % (30 * 24 * 60 * 60 * 1000)
  const inverted = ~((BigInt(midnight - offset) << 12n) | 1n) & 0xffffffffffffn
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let value = digest.subarray(6, 16).reduce((sum, byte) => (sum << 8n) | BigInt(byte), 0n)
  let random = ''
  for (let index = 0; index < 14; index++) { random += alphabet[Number(value % 62n)]; value /= 62n }
  return `ses_${inverted.toString(16).padStart(12, '0')}${random}`
}

function opencodeHeaders(session: string, accept: string): Record<string, string> {
  const project = crypto.createHash('sha256').update(`opencode-project\0${session}`).digest().subarray(0, 20).toString('hex')
  const trace = crypto.randomBytes(16).toString('hex')
  const span = crypto.randomBytes(8).toString('hex')
  return {
    authorization: 'Bearer public', 'user-agent': 'opencode/latest/2.2.3/cli', 'x-opencode-client': 'cli',
    'x-session-affinity': session, 'x-session-id': session, 'x-opencode-session': session, 'x-opencode-session-id': session,
    'x-opencode-project': project, traceparent: `00-${trace}-${span}-01`, b3: `${trace}-${span}-1`, accept,
  }
}

/** Runtime-local catalog row; model ids remain the upstream ids. */
export interface FreeModelEntry {
  id: string
  name: string
  contextWindow: number
  maxOutput: number
  input: Array<'text' | 'image'>
  efforts: string[]
  canDisableReasoning: boolean
  channel: 'kilo' | 'opencode'
}

/** Catalog refresh outcome for the palette's update button. */
export interface FreeModelRefreshSummary {
  total: number
  available: number
  added: number
  removed: number
  checkedAt: string
}

/** Validate and project the Kilo listing's free rows. */
export function parseFreeModelCatalog(value: unknown): FreeModelEntry[] {
  const rows = Array.isArray((value as { data?: unknown })?.data) ? (value as { data: unknown[] }).data : []
  const entries: FreeModelEntry[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (!isRecord(row) || row.isFree !== true || typeof row.id !== 'string' || row.id.trim() === '') continue
    const id = row.id.trim()
    if (seen.has(id)) continue
    const supported = Array.isArray(row.supported_parameters) ? row.supported_parameters : []
    const modalities = isRecord(row.architecture) && Array.isArray(row.architecture.input_modalities)
      ? row.architecture.input_modalities.filter((item): item is 'text' | 'image' => item === 'text' || item === 'image')
      : ['text'] as Array<'text' | 'image'>
    const top = isRecord(row.top_provider) ? row.top_provider : {}
    const reasoning = supported.includes('reasoning')
    entries.push({
      id,
      name: displayName(row, id),
      contextWindow: positiveInteger(row.context_length) ?? positiveInteger(top.context_length) ?? 131_072,
      maxOutput: positiveInteger(top.max_completion_tokens) ?? 32_768,
      input: modalities.length === 0 ? ['text'] : modalities,
      efforts: reasoning ? reasoningEfforts(id) : [],
      canDisableReasoning: reasoning && !/^stepfun\//iu.test(id) && !/^liquid\//iu.test(id) && id !== 'kilo-auto/free' && id !== 'openrouter/free',
      channel: 'kilo',
    })
    seen.add(id)
  }
  return entries
}

/** Project the OpenCode free lane's id-only listing. */
export function parseOpenCodeCatalog(value: unknown): FreeModelEntry[] {
  const rows = Array.isArray((value as { data?: unknown })?.data) ? (value as { data: unknown[] }).data : []
  const entries: FreeModelEntry[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (!isRecord(row) || typeof row.id !== 'string') continue
    const id = row.id.trim()
    if (id === '' || seen.has(id) || OPENCODE_NON_CHAT.has(id) || !(OPENCODE_ALWAYS_FREE.has(id) || /(?:^|[-_])free(?:$|[-_.])/iu.test(id))) continue
    const deep = /deepseek|glm|kimi/iu.test(id)
    const contextWindow = /^mimo.*v2\.6/iu.test(id) || /^muse.?spark/iu.test(id) || deep ? 1_048_576
      : /^mimo.*v2\.5/iu.test(id) ? 1_048_576
      : /^space.?bunny/iu.test(id) ? 262_144
      : /^nemotron|^ling/iu.test(id) ? 128_000
      : /^jev/iu.test(id) ? 32_768
      : 131_072
    entries.push({
      id,
      name: typeof row.name === 'string' && row.name.trim() !== '' ? row.name.trim() : id,
      contextWindow,
      maxOutput: 32_768,
      input: ['text'],
      efforts: deep ? ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] : [],
      canDisableReasoning: deep,
      channel: 'opencode',
    })
    seen.add(id)
  }
  return entries
}

/** Capability facts pulled from the public models.dev catalog. */
export interface ModelsDevFacts {
  contextWindow?: number
  maxOutput?: number
  reasoning?: boolean
  name?: string
}

/**
 * Index the models.dev document by normalized model id. Aliases cover the
 * `-free` suffix variants the OpenCode lane uses, and entries from the
 * opencode/kilo namespaces win over same-id rows from other aggregators.
 */
export function parseModelsDevCatalog(value: unknown): Map<string, ModelsDevFacts> {
  const index = new Map<string, ModelsDevFacts>()
  if (!isRecord(value)) return index
  const register = (id: unknown, model: unknown, strong: boolean) => {
    if (typeof id !== 'string' || id.trim() === '' || !isRecord(model)) return
    const record: ModelsDevFacts = {}
    const limit = isRecord(model.limit) ? model.limit : {}
    const context = positiveInteger(limit.context)
    const output = positiveInteger(limit.output)
    if (context !== undefined) record.contextWindow = context
    if (output !== undefined) record.maxOutput = output
    if (model.reasoning === true || model.reasoning === false) record.reasoning = model.reasoning
    if (typeof model.name === 'string' && model.name.trim() !== '') record.name = model.name.trim()
    if (Object.keys(record).length === 0) return
    const normalized = normalizeModelsDevId(id)
    const withoutFree = normalized.replace(/-free$/u, '')
    for (const key of new Set([normalized, withoutFree])) {
      if (strong || !index.has(key)) index.set(key, record)
    }
  }
  const preferred = ['opencode', 'kilo', 'kilo-ai', 'kiloai']
  for (const [providerId, provider] of Object.entries(value)) {
    if (preferred.includes(providerId.toLocaleLowerCase())) continue
    if (!isRecord(provider)) continue
    for (const [id, model] of Object.entries(isRecord(provider.models) ? provider.models : {})) register(id, model, false)
  }
  for (const providerId of preferred) {
    const provider = (value as Record<string, unknown>)[providerId]
    if (!isRecord(provider)) continue
    for (const [id, model] of Object.entries(isRecord(provider.models) ? provider.models : {})) register(id, model, true)
  }
  return index
}

function normalizeModelsDevId(id: string): string {
  return id.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-')
}

/** Fill context, output, reasoning, and display name facts the upstream listings omit. */
export function enrichFreeModelEntries(entries: readonly FreeModelEntry[], facts: ReadonlyMap<string, ModelsDevFacts>): FreeModelEntry[] {
  return entries.map(entry => {
    const record = facts.get(normalizeModelsDevId(entry.id))
      ?? facts.get(normalizeModelsDevId(entry.id.replace(/[-_.]?free$/iu, '')))
      ?? facts.get(normalizeModelsDevId(entry.id.split('/').at(-1) ?? entry.id))
    if (record === undefined) return entry
    const next: FreeModelEntry = { ...entry }
    if (record.contextWindow !== undefined) next.contextWindow = record.contextWindow
    if (record.maxOutput !== undefined) next.maxOutput = record.maxOutput
    if (record.reasoning === true && next.efforts.length === 0) {
      next.efforts = [...OPENCODE_EFFORT_LADDER]
      next.canDisableReasoning = true
    }
    if (record.name !== undefined && (next.name === next.id || next.name === '')) next.name = record.name
    return next
  })
}

/** Classify whether an upstream answer proves this exact model cannot route. */
export function freeModelUnavailable(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status
  const message = String((error as { message?: unknown } | null)?.message ?? '')
  if (status === 400 || status === 404 || status === 422) return true
  return !Number.isInteger(status) && /model is unavailable|no such model|unknown model|invalid model|not supported/iu.test(message)
}

/** Determine the payload shape from leading bytes, independently of Content-Type. */
export function sniffBodyShape(text: string): 'empty' | 'sse' | 'json' {
  const lead = text.slice(0, 512).trimStart()
  if (lead === '') return 'empty'
  if (/^(?:data:|event:|id:|:|retry:)/iu.test(lead)) return 'sse'
  return 'json'
}

/**
 * Post one Chat Completions request and yield each SSE data payload.
 * A 2xx JSON document is also yielded once; the decision is made from body bytes,
 * so a gateway that labels an SSE stream as application/json remains readable.
 */
export async function* streamChatPayloads(options: {
  baseURL: string
  opencodeBaseURL?: string
  entry: FreeModelEntry
  body: Record<string, unknown>
  signal?: AbortSignal
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): AsyncGenerator<string> {
  const fetchImpl = options.fetchImpl ?? fetch
  const timeout = options.signal === undefined
    ? AbortSignal.timeout(options.timeoutMs ?? TURN_TIMEOUT_MS)
    : AbortSignal.any([options.signal, AbortSignal.timeout(options.timeoutMs ?? TURN_TIMEOUT_MS)])
  const opencode = options.entry.channel === 'opencode'
  const session = opencodeSession(`turn:${options.entry.id}:${String((options.body.user as string | undefined) ?? options.entry.id)}`)
  const body = opencode
    ? (() => { const { max_tokens: _ignored, ...rest } = options.body; return { ...rest, max_completion_tokens: options.body.max_tokens ?? 32_000, stream_options: { include_usage: true } } })()
    : options.body
  const url = opencode
    ? `${(options.opencodeBaseURL ?? 'https://opencode.ai').replace(/\/+$/u, '')}/inference/openai/v1/chat/completions`
    : `${options.baseURL.replace(/\/+$/u, '')}/chat/completions`
  const headers = opencode
    ? { 'content-type': 'application/json', ...opencodeHeaders(session, 'text/event-stream') }
    : { 'content-type': 'application/json', accept: 'text/event-stream', 'user-agent': USER_AGENT, ...ATTRIBUTION_HEADERS }
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: timeout,
    redirect: 'error',
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw Object.assign(new Error(errorDetail(response.status, text)), { status: response.status })
  }
  if (response.body === null) throw new Error('free-model stream returned no body')
  let shape: 'empty' | 'sse' | 'json' | undefined
  let json = ''
  let sse = ''
  const decoder = new TextDecoder()
  for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
    const bytes = chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk))
    const text = decoder.decode(bytes, { stream: true })
    if (shape === undefined) {
      shape = sniffBodyShape(text)
      if (shape === 'empty') continue
    }
    if (shape === 'json') {
      json += text
      continue
    }
    sse += text
    let boundary: RegExpExecArray | null
    while ((boundary = /(?:\r\n|\r|\n){2}/u.exec(sse)) !== null) {
      const frame = sse.slice(0, boundary.index)
      sse = sse.slice(boundary.index + boundary[0].length)
      const data = frame.split(/(?:\r\n|\r|\n)/u)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart())
        .join('\n')
      if (data !== '') yield data
    }
  }
  const tail = decoder.decode()
  if (shape === 'json') {
    json += tail
    if (json.trim() !== '') yield json
    return
  }
  sse += tail
  const data = sse.split(/(?:\r\n|\r|\n)/u)
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart())
    .join('\n')
  if (data !== '') yield data
}

/** Map OpenAI usage facts to DSH's disjoint token counters. */
export function mapChatUsage(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined
  const prompt = positiveInteger(value.prompt_tokens) ?? positiveInteger(value.input_tokens)
  const completion = positiveInteger(value.completion_tokens) ?? positiveInteger(value.output_tokens)
  if (prompt === undefined && completion === undefined) return undefined
  const cached = positiveInteger(isRecord(value.prompt_tokens_details) ? value.prompt_tokens_details.cached_tokens : undefined)
    ?? positiveInteger(isRecord(value.input_tokens_details) ? value.input_tokens_details.cached_tokens : undefined) ?? 0
  const reasoning = positiveInteger(isRecord(value.completion_tokens_details) ? value.completion_tokens_details.reasoning_tokens : undefined)
    ?? positiveInteger(isRecord(value.output_tokens_details) ? value.output_tokens_details.reasoning_tokens : undefined)
  const result: Record<string, number> = {
    inputTokens: Math.max(0, (prompt ?? 0) - cached),
    outputTokens: completion ?? 0,
    totalTokens: (prompt ?? 0) + (completion ?? 0),
  }
  if (cached > 0) result.cacheReadTokens = cached
  if (reasoning !== undefined && reasoning > 0) result.reasoningTokens = reasoning
  return result
}

/** Convert DSH request messages to an OpenAI Chat Completions body. */
export function toChatBody(options: Record<string, any>, entry: FreeModelEntry): Record<string, unknown> {
  const messages: Record<string, unknown>[] = []
  if (typeof options.system === 'string' && options.system !== '') messages.push({ role: 'system', content: options.system })
  for (const message of options.messages ?? []) {
    const blocks = Array.isArray(message.content) ? message.content : []
    const text = blocks.filter(isRecord).map((block: Record<string, unknown>) => {
      if (block.type === 'text' && typeof block.text === 'string') return block.text
      if (block.type === 'reasoning' && typeof block.text === 'string') return `<thinking>${block.text}</thinking>`
      if (block.type === 'tool-call') return `<tool-call>${block.name ?? ''} ${block.arguments ?? ''}</tool-call>`
      if (block.type === 'tool-result') return `<tool-result>${contentText(block.content)}</tool-result>`
      return ''
    }).filter((text: string) => text !== '').join('\n')
    if (message.source?.kind === 'tool') {
      messages.push({ role: 'tool', tool_call_id: String(message.source.callId ?? ''), content: text })
      continue
    }
    const row: Record<string, unknown> = { role: message.role === 'assistant' ? 'assistant' : 'user', content: text }
    if (message.role === 'assistant') {
      const calls = blocks.filter(isRecord).filter((block: Record<string, unknown>) => block.type === 'tool-call')
      if (calls.length > 0) row.tool_calls = calls.map((call: Record<string, unknown>) => ({ id: String(call.id ?? ''), type: 'function', function: { name: String(call.name ?? ''), arguments: String(call.arguments ?? '{}') } }))
      const reasoning = blocks.filter(isRecord).find((block: Record<string, unknown>) => block.type === 'reasoning' && typeof block.text === 'string')
      if (reasoning !== undefined) row.reasoning_content = reasoning.text
    }
    if (!(typeof row.content === 'string' && row.content === '' && row.tool_calls === undefined)) messages.push(row)
  }
  const tools = Array.isArray(options.tools) ? options.tools.filter(isRecord).map(tool => ({
    type: 'function',
    function: { name: String(tool.name ?? ''), description: String(tool.description ?? ''), parameters: isRecord(tool.parameters) ? tool.parameters : { type: 'object', properties: {} } },
  })) : []
  const body: Record<string, unknown> = {
    model: entry.id,
    messages,
    stream: true,
    ...(options.temperature === undefined ? {} : { temperature: options.temperature }),
    ...(options.maxTokens === undefined ? {} : { max_tokens: options.maxTokens }),
    ...(options.stop === undefined ? {} : { stop: options.stop }),
    ...(tools.length === 0 ? {} : { tools, tool_choice: 'auto' }),
    ...(options.sessionId === undefined ? {} : { user: `dsh:${String(options.sessionId)}` }),
  }
  if (typeof options.reasoningEffort === 'string' && entry.efforts.length > 0) {
    if (entry.channel === 'opencode') body.reasoning_effort = options.reasoningEffort === 'off' && entry.canDisableReasoning ? 'none' : options.reasoningEffort
    else body.reasoning = options.reasoningEffort === 'off' && entry.canDisableReasoning ? { enabled: false } : { effort: options.reasoningEffort }
  }
  return body
}

/** Adapt keyless free models to the structural DSH LlmAdapter contract. */
export class FreeModelAdapter {
  constructor(private runtime: FreeModelRuntime) {}

  providerInfo(provider: string) { return { id: provider, name: 'Free Models' } }
  providerRetryPolicy(_provider: string) { return undefined }

  async listModels() { return this.runtime.availableEntries().map(entry => ({ provider: FREE_MODEL_PROVIDER_ID, id: entry.id, name: entry.name, inputModalities: entry.input })) }

  async resolveModel(_provider: string, model: string) {
    const entry = this.runtime.entry(model)
    if (entry === undefined) throw new Error(`free model "${model}" is not loaded`)
    const efforts = entry.efforts.map(id => ({ id, name: id.charAt(0).toLocaleUpperCase() + id.slice(1) }))
    return {
      provider: FREE_MODEL_PROVIDER_ID,
      id: entry.id,
      name: entry.name,
      inputModalities: entry.input,
      context: { contextWindow: entry.contextWindow },
      defaultMaxTokens: entry.maxOutput,
      ...(efforts.length === 0 ? {} : { reasoning: { efforts, defaultEffort: entry.efforts.at(-1) } }),
    }
  }

  async *stream(options: Record<string, any>): AsyncGenerator<Record<string, unknown>> {
    const entry = this.runtime.entry(options.model)
    if (entry === undefined) throw new Error(`free model "${options.model}" is not loaded`)
    try {
      yield* chatPayloadsToChunks(streamChatPayloads({ baseURL: this.runtime.baseURL, opencodeBaseURL: this.runtime.opencodeBaseURL, entry, body: toChatBody(options, entry), signal: options.signal, fetchImpl: this.runtime.fetchImpl }), this.runtime, entry)
    } catch (error) {
      this.runtime.markFailure(entry.id, error)
      throw error
    }
  }
}

/** Convert OpenAI stream payloads into DSH raw chunks. */
export async function* chatPayloadsToChunks(payloads: AsyncIterable<string>, runtime?: FreeModelRuntime, entry?: FreeModelEntry): AsyncGenerator<Record<string, unknown>> {
  const blocks = new Map<string, { index: number; type: 'text' | 'reasoning' | 'tool-call'; text: string; id?: string; name?: string; arguments: string }>()
  let nextIndex = 0
  let finish: string | undefined
  let usage: Record<string, number> | undefined
  const slot = function* (key: string, type: 'text' | 'reasoning' | 'tool-call', id?: string, name?: string) {
    let block = blocks.get(key)
    if (block === undefined) {
      block = { index: nextIndex++, type, text: '', id, name, arguments: '' }
      blocks.set(key, block)
      yield { type: 'block-start', index: block.index, blockType: type }
    }
    return block
  }
  for await (const payloadText of payloads) {
    if (payloadText === '[DONE]') break
    let payload: unknown
    try { payload = JSON.parse(payloadText) } catch { continue }
    if (!isRecord(payload)) continue
    if (payload.error !== undefined || payload.type === 'error') {
      const error = isRecord(payload.error) ? payload.error : payload
      throw Object.assign(new Error(String(error.message ?? 'free-model stream error')), { status: positiveInteger(payload.code) })
    }
    const choice = Array.isArray(payload.choices) ? payload.choices.find(isRecord) : undefined
    const delta = choice !== undefined && isRecord(choice.delta) ? choice.delta : {}
    const reasoning = firstString(delta, ['reasoning', 'reasoning_content', 'reasoning_text', 'thinking'])
    if (reasoning !== undefined) {
      const generator = slot('reasoning', 'reasoning')
      for (const chunk of generator) yield chunk
      const block = blocks.get('reasoning')!
      block.text += reasoning
      yield { type: 'reasoning-delta', index: block.index, text: reasoning }
    }
    if (typeof delta.content === 'string' && delta.content !== '') {
      const generator = slot('text', 'text')
      for (const chunk of generator) yield chunk
      const block = blocks.get('text')!
      block.text += delta.content
      yield { type: 'text-delta', index: block.index, text: delta.content }
    }
    if (Array.isArray(delta.tool_calls)) {
      for (const rawCall of delta.tool_calls) {
        if (!isRecord(rawCall)) continue
        const key = `tool:${positiveInteger(rawCall.index) ?? blocks.size}`
        const generator = slot(key, 'tool-call', typeof rawCall.id === 'string' ? rawCall.id : undefined, isRecord(rawCall.function) && typeof rawCall.function.name === 'string' ? rawCall.function.name : undefined)
        for (const chunk of generator) yield chunk
        const block = blocks.get(key)!
        if (block.id === undefined && typeof rawCall.id === 'string') block.id = rawCall.id
        if (block.name === undefined && isRecord(rawCall.function) && typeof rawCall.function.name === 'string') block.name = rawCall.function.name
        if (isRecord(rawCall.function) && typeof rawCall.function.arguments === 'string') block.arguments += rawCall.function.arguments
        yield { type: 'tool-call-delta', index: block.index, id: block.id ?? `call-${block.index}`, ...(block.name === undefined ? {} : { name: block.name }), argumentsDelta: isRecord(rawCall.function) && typeof rawCall.function.arguments === 'string' ? rawCall.function.arguments : '' }
      }
    }
    if (payload.usage !== undefined) usage = mapChatUsage(payload.usage)
    if (choice !== undefined && typeof choice.finish_reason === 'string' && choice.finish_reason !== '') finish = choice.finish_reason
  }
  for (const block of [...blocks.values()].sort((left, right) => left.index - right.index)) {
    if (block.type === 'tool-call') yield { type: 'block-end', index: block.index, block: { type: 'tool-call', id: block.id ?? `call-${block.index}`, name: block.name ?? '', arguments: block.arguments === '' ? '{}' : block.arguments } }
    else yield { type: 'block-end', index: block.index, block: { type: block.type, text: block.text } }
  }
  if (usage !== undefined) yield { type: 'usage', usage }
  const sawToolCall = [...blocks.values()].some(block => block.type === 'tool-call')
  const reason = finish === 'length' ? 'max-tokens' : finish === 'tool_calls' || sawToolCall ? 'tool-calls' : 'stop'
  yield { type: 'finish', reason: { kind: reason } }
}

/** Mutable runtime state shared by the LLM adapter and local gateway. */
export class FreeModelRuntime {
  readonly baseURL: string
  readonly opencodeBaseURL: string
  private entries: FreeModelEntry[] = []
  private unavailable = new Set<string>()
  private verdicts = new Map<string, { state: string; detail?: string; checkedAt: string }>()
  private handle: { replace: (providers: string[]) => void } | undefined
  private capabilityCache: { facts: Map<string, ModelsDevFacts>; fetchedAt: number } | undefined
  readonly fetchImpl: typeof fetch

  constructor(baseURL: string, fetchImpl: typeof fetch = fetch, opencodeBaseURL: string = DEFAULT_OPENCODE_BASE) { this.baseURL = baseURL; this.opencodeBaseURL = opencodeBaseURL; this.fetchImpl = fetchImpl }

  setHandle(handle: { replace: (providers: string[]) => void }) { this.handle = handle }

  availableEntries() { return this.entries.filter(entry => !this.unavailable.has(entry.id)) }

  entry(id: string) { return this.availableEntries().find(entry => entry.id === id) }

  snapshot() { return { models: this.availableEntries().map(entry => ({ ...entry })), verdicts: Object.fromEntries(this.verdicts) } }

  async refresh(signal?: AbortSignal, options: { force?: boolean } = {}): Promise<FreeModelRefreshSummary> {
    const deadline = signal ?? AbortSignal.timeout(CATALOG_TIMEOUT_MS)
    const [kilo, opencode, capabilities] = await Promise.allSettled([
      this.fetchImpl(`${this.baseURL.replace(/\/+$/u, '')}/models`, {
        headers: { accept: 'application/json', 'user-agent': USER_AGENT, ...ATTRIBUTION_HEADERS }, signal: deadline, redirect: 'error',
      }).then(async response => {
        if (!response.ok) throw new Error(`Kilo catalog returned HTTP ${response.status}`)
        return parseFreeModelCatalog(await response.json())
      }),
      this.fetchImpl(`${this.opencodeBaseURL.replace(/\/+$/u, '')}/inference/v1/models`, {
        headers: opencodeHeaders(opencodeSession('catalog'), 'application/json'), signal: deadline, redirect: 'error',
      }).then(async response => {
        if (!response.ok) throw new Error(`OpenCode catalog returned HTTP ${response.status}`)
        return parseOpenCodeCatalog(await response.json())
      }),
      this.loadCapabilityFacts(options.force === true, signal),
    ])
    if (kilo.status === 'rejected' && opencode.status === 'rejected') throw kilo.reason
    const merged = new Map<string, FreeModelEntry>()
    for (const entry of [...(kilo.status === 'fulfilled' ? kilo.value : []), ...(opencode.status === 'fulfilled' ? opencode.value : [])]) merged.set(entry.id, entry)
    const facts = capabilities.status === 'fulfilled' ? capabilities.value : undefined
    const previous = new Set(this.entries.map(entry => entry.id))
    this.entries = facts === undefined ? [...merged.values()] : enrichFreeModelEntries([...merged.values()], facts)
    for (const id of [...this.unavailable]) if (!this.entries.some(entry => entry.id === id)) this.unavailable.delete(id)
    this.announce()
    const ids = new Set(this.entries.map(entry => entry.id))
    return {
      total: this.entries.length,
      available: this.availableEntries().length,
      added: [...ids].filter(id => !previous.has(id)).length,
      removed: [...previous].filter(id => !ids.has(id)).length,
      checkedAt: new Date().toISOString(),
    }
  }

  /** Cached models.dev capability index; refreshes at most twice a day unless forced. */
  private async loadCapabilityFacts(force: boolean, signal?: AbortSignal): Promise<Map<string, ModelsDevFacts>> {
    if (!force && this.capabilityCache !== undefined && Date.now() - this.capabilityCache.fetchedAt < MODELS_DEV_TTL_MS) {
      return this.capabilityCache.facts
    }
    const response = await this.fetchImpl(MODELS_DEV_URL, {
      headers: { accept: 'application/json', 'user-agent': USER_AGENT }, signal: signal ?? AbortSignal.timeout(MODELS_DEV_TIMEOUT_MS), redirect: 'error',
    })
    if (!response.ok) throw new Error(`models.dev returned HTTP ${response.status}`)
    const facts = parseModelsDevCatalog(await response.json())
    this.capabilityCache = { facts, fetchedAt: Date.now() }
    return facts
  }

  async probeAll(concurrency = 2, signal?: AbortSignal) {
    const cursor = { index: 0 }
    await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, this.entries.length)) }, async () => {
      while (cursor.index < this.entries.length) {
        const entry = this.entries[cursor.index++]!
        await this.probe(entry.id, signal)
      }
    }))
    this.announce()
    return this.snapshot()
  }

  async probe(id: string, signal?: AbortSignal) {
    const entry = this.entries.find(item => item.id === id)
    if (entry === undefined) throw new Error(`free model "${id}" is not loaded`)
    try {
      for await (const payload of streamChatPayloads({
        baseURL: this.baseURL,
        opencodeBaseURL: this.opencodeBaseURL,
        entry,
        body: { model: entry.id, messages: [{ role: 'user', content: 'ping' }], stream: true, max_tokens: 16 },
        signal, fetchImpl: this.fetchImpl, timeoutMs: PROBE_TIMEOUT_MS,
      })) {
        if (/"(?:type"\s*:\s*"error"|"error"\s*:)/u.test(payload)) throw new Error(payload.slice(0, 240))
      }
      this.unavailable.delete(id)
      this.verdicts.set(id, { state: 'available', checkedAt: new Date().toISOString() })
      return 'available'
    } catch (error) {
      const unavailable = freeModelUnavailable(error)
      // An explicit routing refusal proves the model is gone: drop it from the
      // catalog outright so it cannot reappear after a restart.
      if (unavailable) this.pruneEntry(id, String((error as Error)?.message ?? error))
      else this.verdicts.set(id, { state: 'unknown', ...(String((error as Error)?.message ?? error) === '' ? {} : { detail: String((error as Error)?.message ?? error).slice(0, 240) }), checkedAt: new Date().toISOString() })
      return unavailable ? 'unavailable' : 'unknown'
    }
  }

  markFailure(id: string, error: unknown) {
    if (!freeModelUnavailable(error)) return false
    this.pruneEntry(id, String((error as Error)?.message ?? error))
    return true
  }

  /** Remove one model from the catalog after an upstream-proved absence. */
  private pruneEntry(id: string, detail: string) {
    this.entries = this.entries.filter(entry => entry.id !== id)
    this.unavailable.delete(id)
    this.verdicts.set(id, { state: 'removed', ...(detail === '' ? {} : { detail: detail.slice(0, 240) }), checkedAt: new Date().toISOString() })
    this.announce()
  }

  private announce() { this.handle?.replace([FREE_MODEL_PROVIDER_ID]) }
}

/** Register adapter, background availability maintenance, and the local gateway. */
export function registerFreeModels(ctx: Record<string, any>, config: Record<string, any> = {}) {
  const runtime = new FreeModelRuntime(String(config.baseURL ?? DEFAULT_FREE_MODEL_BASE), config.fetch ?? fetch, String(config.opencodeBaseURL ?? DEFAULT_OPENCODE_BASE))
  const adapter = new FreeModelAdapter(runtime)
  const handle = ctx.llm.registerAdapter([FREE_MODEL_PROVIDER_ID], adapter)
  runtime.setHandle(handle)
  const gateway = config.gateway?.enabled === false
    ? { dispose: async () => {}, port: () => undefined }
    : registerFreeGateway(ctx, adapter, runtime, config.gateway ?? {})
  let stopped = false
  const controller = new AbortController()
  let timer: NodeJS.Timeout | undefined
  const bootstrap = async () => {
    while (!stopped) {
      try {
        await runtime.refresh(controller.signal)
        if (config.probeOnStartup !== false) await runtime.probeAll(Number(config.probeConcurrency ?? 2), controller.signal)
        break
      } catch (error) {
        if (stopped || controller.signal.aborted) break
        ctx.logger?.warn?.(`dsh-model-palette: free-model catalog refresh failed: ${String((error as Error)?.message ?? error)}`)
        await sleep(60_000, controller.signal)
      }
    }
    const interval = Number(config.probeIntervalMinutes ?? 60)
    if (!stopped && Number.isInteger(interval) && interval > 0) {
      // Each tick re-reads the upstream catalogs first so newly published free
      // models appear without a restart, then re-probes availability.
      timer = setInterval(() => {
        void runtime.refresh(controller.signal)
          .catch(error => ctx.logger?.warn?.(`dsh-model-palette: scheduled free-model catalog refresh failed: ${String((error as Error)?.message ?? error)}`))
          .then(() => runtime.probeAll(Number(config.probeConcurrency ?? 2), controller.signal).catch(() => {}))
      }, interval * 60_000)
      timer.unref?.()
    }
  }
  void bootstrap()
  ctx.effect(() => {
    const disposeApi = registerFreeModelsRefreshApi(ctx, runtime)
    return async () => {
      stopped = true
      controller.abort()
      if (timer !== undefined) clearInterval(timer)
      await disposeApi()
      await gateway.dispose()
      handle()
    }
  }, 'dsh-model-palette: free models')
}

/** Serve GET/POST under /model-palette/api/free-models so the palette can read and refresh the keyless lane. */
export function registerFreeModelsRefreshApi(ctx: Record<string, any>, runtime: FreeModelRuntime): () => Promise<void> {
  const registered = ctx.webServer?.register?.({
    kind: 'prefix',
    path: FREE_MODELS_API_PATH,
    handler: async (req: any, res: any) => {
      try {
        const site = req.headers?.['sec-fetch-site']
        if (site !== undefined && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
          writeJson(res, 403, { ok: false, error: { message: 'cross-site request rejected' } })
          return
        }
        let pathname = FREE_MODELS_API_PATH
        try { pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname } catch { /* keep prefix */ }
        if (pathname === `${FREE_MODELS_API_PATH}/snapshot` && req.method === 'GET') {
          const snapshot = runtime.snapshot()
          writeJson(res, 200, { ok: true, value: { ...snapshot, provider: FREE_MODEL_PROVIDER_ID } })
          return
        }
        if (req.method !== 'POST') {
          writeJson(res, 405, { ok: false, error: { message: 'method not allowed' } })
          return
        }
        if (pathname !== `${FREE_MODELS_API_PATH}/refresh`) {
          writeJson(res, 404, { ok: false, error: { message: 'unknown free-models action' } })
          return
        }
        let body: { force?: unknown } = {}
        try {
          const text = await new Promise<string>((resolve, reject) => {
            let buffer = ''
            req.on('data', (chunk: Buffer) => { buffer += chunk.toString(); if (buffer.length > 65_536) reject(new Error('request body is too large')) })
            req.on('end', () => resolve(buffer))
            req.on('error', reject)
          })
          if (text.trim() !== '') body = JSON.parse(text) as { force?: unknown }
        } catch (error) {
          writeJson(res, 400, { ok: false, error: { message: `invalid request body: ${String((error as Error)?.message ?? error)}` } })
          return
        }
        writeJson(res, 200, { ok: true, value: await runtime.refresh(undefined, { force: body?.force === true }) })
      } catch (error) {
        writeJson(res, 502, { ok: false, error: { message: `free-model catalog refresh failed: ${String((error as Error)?.message ?? error)}` } })
      }
    },
  })
  return async () => { registered?.() }
}

function writeJson(res: any, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
  res.end(JSON.stringify(value))
}

function sleep(ms: number, signal: AbortSignal) { return new Promise<void>((resolve, reject) => { if (signal.aborted) return reject(new Error('aborted')); const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms); timer.unref?.(); function onAbort() { clearTimeout(timer); reject(new Error('aborted')) } signal.addEventListener('abort', onAbort, { once: true }) }) }
function displayName(row: Record<string, unknown>, id: string) {
  const raw = typeof row.name === 'string' && row.name.trim() !== '' ? row.name.trim() : id
  return raw.replace(/^[^:]{1,40}:\s*/u, '').replace(/\s*\(free\)\s*$/iu, '').trim() || id
}
function reasoningEfforts(id: string) { return /^stepfun\//iu.test(id) || /^liquid\//iu.test(id) || id === 'kilo-auto/free' || id === 'openrouter/free' ? ['low', 'medium', 'high'] : ['off', 'low', 'medium', 'high'] }
function firstString(value: Record<string, unknown>, fields: string[]) { for (const field of fields) if (typeof value[field] === 'string' && value[field] !== '') return value[field] as string; return undefined }
function contentText(value: unknown) { return Array.isArray(value) ? value.filter(isRecord).map(block => typeof block.text === 'string' ? block.text : '').join('\n') : String(value ?? '') }
function errorDetail(status: number, text: string) { try { const value = JSON.parse(text); return String(value?.error?.message ?? value?.message ?? `HTTP ${status}`) } catch { return text.slice(0, 240) || `HTTP ${status}` } }
function positiveInteger(value: unknown) { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
